"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  getEventSeatMap,
  updateSeatAssignments,
} from "@/services/eventSeatService";
import { getBanquetLayout } from "@/services/banquetLayoutService";
import { getSeatLayoutById } from "@/services/venueService";
import BanquetAdminSeatMap from "@/components/admin/BanquetAdminSeatMap";
import type { BanquetLayout } from "@/types/banquet";
import type { EventSeatMap, EventSeatMapSeat, SeatAssignmentPayload } from "@/types/seatMap";
import { EventSeatStatus } from "@/types/eventSeat";
import { cn } from "@/lib/utils/utils";
import type { Layout } from "@/types/layout";
import type { TheaterPlanSummary } from "@/types/theaterPlan";
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  Paintbrush,
  RotateCcw,
  Unlock,
  X,
} from "lucide-react";

const TIER_COLORS = [
  "#2F5F7F",
  "#0EA5E9",
  "#EC4899",
  "#22C55E",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#FACC15",
];

const WALKWAY_PATTERN: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(251,191,36,0.85) 0 8px, rgba(254,240,199,0.85) 8px 16px)",
};

interface SeatMapPageProps {
  params: { id: string };
}

const SeatMapDesignerClient = ({ params }: SeatMapPageProps) => {
  const { id: eventId } = params;

  const [seatMap, setSeatMap] = useState<EventSeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [activeTierCode, setActiveTierCode] = useState<string | null>(null);
  const [layoutDetail, setLayoutDetail] = useState<Layout | null>(null);
  const [banquetLayout, setBanquetLayout] = useState<BanquetLayout | null>(null);
  const [loadingBanquetPreview, setLoadingBanquetPreview] = useState(false);
  const [banquetPreviewError, setBanquetPreviewError] = useState<string | null>(null);

  const loadSeatMap = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);
      const data = await getEventSeatMap(eventId);
      setSeatMap(data);
      setActiveTierCode(data.ticketTiers[0]?.tierCode ?? null);
    } catch (err) {
      console.error(err);
      setError("We couldn't load the seat map for this event. Make sure a seat layout is assigned.");
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [eventId]);

  useEffect(() => {
    void loadSeatMap();
  }, [loadSeatMap]);

  useEffect(() => {
    let cancelled = false;
    const layoutId = seatMap?.seatLayoutId;
    if (!layoutId) {
      setLayoutDetail(null);
      return () => {
        cancelled = true;
      };
    }

    const loadLayout = async () => {
      try {
        const layout = await getSeatLayoutById(layoutId);
        if (!cancelled) {
          setLayoutDetail(layout);
        }
      } catch (err) {
        console.error('Failed to fetch layout configuration for preview', err);
        if (!cancelled) {
          setLayoutDetail(null);
        }
      }
    };

    void loadLayout();
    return () => {
      cancelled = true;
    };
  }, [seatMap?.seatLayoutId]);

  const tierColorMap = useMemo(() => {
    if (!seatMap) return new Map<string, string>();
    return new Map(
      seatMap.ticketTiers.map((tier, index) => [tier.tierCode, TIER_COLORS[index % TIER_COLORS.length]]),
    );
  }, [seatMap]);

  const tierPriceMap = useMemo(() => {
    if (!seatMap) return new Map<string, number>();
    return new Map(seatMap.ticketTiers.map(tier => [tier.tierCode, tier.price]));
  }, [seatMap]);

  const seatsByRow = useMemo(() => {
    if (!seatMap) return [] as Array<[string, EventSeatMapSeat[]]>;
    const groups = new Map<string, EventSeatMapSeat[]>();
    seatMap.seats.forEach(seat => {
      const rowKey = seat.row ?? "Row";
      if (!groups.has(rowKey)) {
        groups.set(rowKey, []);
      }
      groups.get(rowKey)!.push(seat);
    });

    return Array.from(groups.entries())
      .map(([row, seats]) => {
        seats.sort((a, b) => {
          if (a.number != null && b.number != null) {
            return a.number - b.number;
          }
          return (a.label ?? "").localeCompare(b.label ?? "", undefined, { sensitivity: "base" });
        });
        return [row, seats] as [string, EventSeatMapSeat[]];
      })
      .sort(([rowA], [rowB]) => rowA.localeCompare(rowB, undefined, { sensitivity: "base", numeric: true }));
  }, [seatMap]);

  const seatGroupMap = useMemo(() => new Map(seatsByRow), [seatsByRow]);

  const seatByLabel = useMemo(() => {
    const map = new Map<string, EventSeatMapSeat>();
    seatMap?.seats.forEach(seat => {
      const key = seat.label ?? (seat.row ? `${seat.row}${seat.number ?? ""}` : seat.seatId);
      if (key) {
        map.set(key, seat);
      }
    });
    return map;
  }, [seatMap]);

  const tierCounts = useMemo(() => {
    if (!seatMap) return new Map<string, number>();
    const counts = new Map<string, number>();
    seatMap.seats.forEach(seat => {
      const key = seat.tierCode ?? "__unassigned";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [seatMap]);

  const theaterPlan = useMemo<TheaterPlanSummary | null>(() => {
    if (!layoutDetail?.configuration || layoutDetail.configuration.kind !== 'theater') {
      return null;
    }
    return layoutDetail.configuration.summary;
  }, [layoutDetail]);

  type LayoutRowCell =
    | { kind: 'seat'; columnIndex: number; seat: EventSeatMapSeat | null; price?: number }
    | { kind: 'walkway'; columnIndex: number }
    | { kind: 'empty'; columnIndex: number };

  type LayoutRowDefinition =
    | { kind: 'walkway-row'; label: string }
    | { kind: 'seat-row'; label: string; cells: LayoutRowCell[] };

  const isBanquetLayout = useMemo(() => {
    if (!seatMap?.layout) {
      return false;
    }
    const normalizedName = seatMap.layout.typeName ? seatMap.layout.typeName.toLowerCase() : undefined;
    const normalizedCode = seatMap.layout.typeCode ? seatMap.layout.typeCode.toLowerCase() : undefined;
    return normalizedName === 'banquet' || normalizedCode === '230';
  }, [seatMap?.layout]);

  const layoutRows: LayoutRowDefinition[] | null = useMemo(() => {
    if (!theaterPlan) {
      return null;
    }

    const walkwayColumns = new Set(theaterPlan.walkwayColumns ?? []);
    const rowSeatDefs = new Map<string, Map<number, TheaterPlanSummary['seats'][number]>>();
    theaterPlan.seats.forEach(def => {
      if (!rowSeatDefs.has(def.rowLabel)) {
        rowSeatDefs.set(def.rowLabel, new Map());
      }
      rowSeatDefs.get(def.rowLabel)!.set(def.columnIndex, def);
    });

    return theaterPlan.rows.map(row => {
      if (row.isWalkway) {
        return { kind: 'walkway-row', label: row.rowLabel } as LayoutRowDefinition;
      }

      const columnMap = rowSeatDefs.get(row.rowLabel) ?? new Map();
      const cells: LayoutRowCell[] = [];
      for (let columnIndex = 0; columnIndex < theaterPlan.columns; columnIndex += 1) {
        if (walkwayColumns.has(columnIndex)) {
          cells.push({ kind: 'walkway', columnIndex });
          continue;
        }

        const seatDef = columnMap.get(columnIndex);
        if (!seatDef) {
          cells.push({ kind: 'empty', columnIndex });
          continue;
        }

        const key = seatDef.label ?? `${seatDef.rowLabel}${seatDef.seatNumber}`;
        const match = key ? seatByLabel.get(key) ?? null : null;
        const resolvedPrice = match?.price ?? (match?.tierCode ? tierPriceMap.get(match.tierCode) : undefined);

        cells.push({ kind: 'seat', columnIndex, seat: match, price: resolvedPrice });
      }

      return { kind: 'seat-row', label: row.rowLabel, cells } as LayoutRowDefinition;
    });
  }, [theaterPlan, seatByLabel, tierPriceMap]);

  useEffect(() => {
    if (!isBanquetLayout || !seatMap?.seatLayoutId) {
      setBanquetLayout(null);
      setBanquetPreviewError(null);
      setLoadingBanquetPreview(false);
      return;
    }

    let cancelled = false;
    const loadBanquetPreview = async () => {
      try {
        setLoadingBanquetPreview(true);
        setBanquetPreviewError(null);
        const layout = await getBanquetLayout(seatMap.seatLayoutId);
        if (!cancelled) {
          setBanquetLayout(layout);
        }
      } catch (err) {
        console.error('Failed to load banquet layout preview', err);
        if (!cancelled) {
          setBanquetLayout(null);
          setBanquetPreviewError('We could not load the banquet seating preview.');
        }
      } finally {
        if (!cancelled) {
          setLoadingBanquetPreview(false);
        }
      }
    };

    void loadBanquetPreview();
    return () => {
      cancelled = true;
    };
  }, [isBanquetLayout, seatMap?.seatLayoutId]);

  const selectableStatuses = useMemo(() => new Set<EventSeatStatus>([EventSeatStatus.AVAILABLE, EventSeatStatus.BLOCKED]), []);
  const selectedCount = selectedSeatIds.size;

  const toggleSeatSelection = (seat: EventSeatMapSeat) => {
    if (!selectableStatuses.has(seat.status)) {
      console.warn(`Seat ${seat.label ?? seat.seatId} cannot be selected because it is ${seat.status}`);
      return;
    }

    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      if (next.has(seat.seatId)) {
        next.delete(seat.seatId);
      } else {
        next.add(seat.seatId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedSeatIds(new Set());
    setAssignError(null);
  };

  const applyTierToSelection = async (tierCode: string) => {
    if (!seatMap) return;
    if (selectedSeatIds.size === 0) {
      setAssignError("Select one or more seats before assigning a tier.");
      return;
    }

    const tier = seatMap.ticketTiers.find(t => t.tierCode === tierCode);
    if (!tier) {
      setAssignError("Selected tier isn't available for this event.");
      return;
    }

    const assignments: SeatAssignmentPayload[] = Array.from(selectedSeatIds)
      .map(seatId => {
        const seat = seatMap.seats.find(s => s.seatId === seatId);
        if (!seat) {
          return null;
        }
        return {
          eventSeatId: seat.eventSeatId,
          seatId: seat.seatId,
          tierCode,
          price: tier.price,
        } satisfies SeatAssignmentPayload;
      })
      .filter((assignment): assignment is SeatAssignmentPayload => assignment !== null);

    if (assignments.length === 0) {
      setAssignError("Unable to resolve the selected seats. Try reloading the seat map.");
      return;
    }

    try {
      setSaving(true);
      setAssignError(null);
      await updateSeatAssignments(eventId, assignments);
      await loadSeatMap(false);
      setSelectedSeatIds(new Set());
    } catch (err) {
      console.error(err);
      setAssignError("We couldn't update the seat assignments. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSeatStatus = async (status: EventSeatStatus) => {
    if (!seatMap) return;
    if (selectedSeatIds.size === 0) {
      setAssignError("Select one or more seats before updating their status.");
      return;
    }

    const assignments: SeatAssignmentPayload[] = Array.from(selectedSeatIds)
      .map(seatId => {
        const seat = seatMap.seats.find(s => s.seatId === seatId);
        if (!seat) {
          return null;
        }
        const tierCode = seat.tierCode ?? seatMap.ticketTiers[0]?.tierCode;
        if (!tierCode) {
          return null;
        }
        return {
          eventSeatId: seat.eventSeatId,
          seatId: seat.seatId,
          tierCode,
          price: seat.price,
          status,
        } satisfies SeatAssignmentPayload;
      })
      .filter((assignment): assignment is SeatAssignmentPayload => assignment !== null);

    if (assignments.length === 0) {
      setAssignError("Unable to update the selected seats. Ensure they are assigned to a ticket tier first.");
      return;
    }

    try {
      setSaving(true);
      setAssignError(null);
      await updateSeatAssignments(eventId, assignments);
      await loadSeatMap(false);
      setSelectedSeatIds(new Set());
    } catch (err) {
      console.error(err);
      setAssignError("We couldn't update the seat status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading seat designer…</span>
        </div>
      </div>
    );
  }

  if (error || !seatMap) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-slate-50">
        <div className="max-w-lg rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-center text-rose-600">
          {error ?? "Seat map is not available for this event."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Seat Map Designer</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Assign ticket tiers to individual seats for <strong className="font-semibold">{seatMap.layout.layoutName}</strong>.
            Select one or more seats, choose a tier, and press assign. Changes are saved instantly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to event
          </Link>
          <button
            type="button"
            onClick={() => void loadSeatMap()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <RotateCcw className="h-4 w-4" /> Refresh map
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <TierPalette
            tiers={seatMap.ticketTiers}
            activeTierCode={activeTierCode}
            tierColorMap={tierColorMap}
            onSelectTier={code => {
              setActiveTierCode(code);
              setAssignError(null);
            }}
          />

          {isBanquetLayout && (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Banquet preview</h2>
                  <p className="text-sm text-slate-500">This mirrors the exact seating view guests see on the booking page.</p>
                </div>
                {loadingBanquetPreview && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </div>

              {banquetPreviewError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {banquetPreviewError}
                </div>
              )}

              {loadingBanquetPreview ? (
                <div className="flex h-56 items-center justify-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : banquetLayout ? (
                <BanquetAdminSeatMap
                  layout={banquetLayout}
                  seats={seatMap.seats}
                  selectedSeatIds={selectedSeatIds}
                  selectableStatuses={selectableStatuses}
                  tierColorMap={tierColorMap}
                  onToggleSeat={toggleSeatSelection}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Configure tables in the banquet layout builder to preview them here.
                </div>
              )}
            </section>
          )}

          {!isBanquetLayout && (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Seat layout</h2>
                  <p className="text-sm text-slate-500">
                    {seatMap.layout.totalCapacity} total capacity · {seatMap.seats.length} seats mapped
                  </p>
                </div>
                <SeatStatusLegend />
              </header>

              <div className="mx-auto max-w-5xl space-y-4">
                {(layoutRows ?? seatsByRow).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    This layout has no seats yet. Add seats to the layout before assigning tiers.
                  </div>
                ) : (
                  (layoutRows
                    ? layoutRows.map(row => {
                        if (row.kind === 'walkway-row') {
                          return (
                            <div
                              key={`walkway-${row.label}`}
                              className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-inner"
                              style={WALKWAY_PATTERN}
                            >
                              {row.label || 'Walkway'}
                            </div>
                          );
                        }

                        const seatsForRow = seatGroupMap.get(row.label) ?? [];
                        const rowHasSelectableSeats = seatsForRow.some(seat => selectableStatuses.has(seat.status));

                        return (
                          <div
                            key={`row-${row.label}`}
                            className="space-y-2 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm"
                          >
                            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                              <h3 className="text-base font-semibold text-slate-700">Row {row.label}</h3>
                              {rowHasSelectableSeats && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                                  onClick={() => {
                                    setSelectedSeatIds(prev => {
                                      const next = new Set(prev);
                                      const allSelected = seatsForRow
                                        .filter(seat => selectableStatuses.has(seat.status))
                                        .every(seat => next.has(seat.seatId));
                                      seatsForRow.forEach(seat => {
                                        if (!selectableStatuses.has(seat.status)) {
                                          return;
                                        }
                                        if (allSelected) {
                                          next.delete(seat.seatId);
                                        } else {
                                          next.add(seat.seatId);
                                        }
                                      });
                                      return next;
                                    });
                                  }}
                                >
                                  <Paintbrush className="h-3 w-3" />
                                  {seatsForRow.every(seat => selectedSeatIds.has(seat.seatId))
                                    ? 'Deselect row'
                                    : 'Select row'}
                                </button>
                              )}
                            </div>
                            <div className="w-full overflow-x-auto">
                              <div className="flex min-w-full flex-wrap items-center justify-center gap-1.5 pb-1">
                                {row.cells.map(cell => {
                                  if (cell.kind === 'walkway') {
                                    return (
                                      <div
                                        key={`walkway-col-${row.label}-${cell.columnIndex}`}
                                        className="h-11 w-11 rounded-xl border border-amber-200 shadow-inner"
                                        style={WALKWAY_PATTERN}
                                        aria-label="Walkway column"
                                      />
                                    );
                                  }

                                  if (cell.kind === 'empty') {
                                    return (
                                      <div
                                        key={`empty-${row.label}-${cell.columnIndex}`}
                                        className="h-11 w-11 rounded-xl border border-dashed border-slate-200 bg-slate-50"
                                      />
                                    );
                                  }

                                  if (!cell.seat) {
                                    return (
                                      <div
                                        key={`missing-${row.label}-${cell.columnIndex}`}
                                        className="flex h-11 w-11 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-medium text-slate-400"
                                      >
                                        Missing
                                      </div>
                                    );
                                  }

                                  const isSelected = selectedSeatIds.has(cell.seat.seatId);
                                  const color = cell.seat.tierCode ? tierColorMap.get(cell.seat.tierCode) : undefined;

                                  return (
                                    <SeatButton
                                      key={cell.seat.seatId}
                                      seat={cell.seat}
                                      color={color}
                                      selected={isSelected}
                                      price={cell.price}
                                      onClick={() => toggleSeatSelection(cell.seat!)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : seatsByRow.map(([row, seats]) => (
                        <div key={row} className="space-y-2 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm">
                          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                            <h3 className="text-base font-semibold text-slate-700">Row {row}</h3>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                              onClick={() => {
                                setSelectedSeatIds(prev => {
                                  const next = new Set(prev);
                                  const allSelected = seats
                                    .filter(seat => selectableStatuses.has(seat.status))
                                    .every(seat => next.has(seat.seatId));
                                  seats.forEach(seat => {
                                    if (!selectableStatuses.has(seat.status)) {
                                      return;
                                    }
                                    if (allSelected) {
                                      next.delete(seat.seatId);
                                    } else {
                                      next.add(seat.seatId);
                                    }
                                  });
                                  return next;
                                });
                              }}
                            >
                              <Paintbrush className="h-3 w-3" />
                              {seats.every(seat => selectedSeatIds.has(seat.seatId)) ? 'Deselect row' : 'Select row'}
                            </button>
                          </div>
                          <div className="w-full overflow-x-auto">
                            <div className="flex min-w-full flex-wrap items-center justify-center gap-1.5 pb-1">
                              {seats.map(seat => {
                                const isSelected = selectedSeatIds.has(seat.seatId);
                                const color = seat.tierCode ? tierColorMap.get(seat.tierCode) : undefined;
                                const resolvedPrice = seat.price ?? (seat.tierCode ? tierPriceMap.get(seat.tierCode) ?? null : null);
                                return (
                                  <SeatButton
                                    key={seat.seatId}
                                    seat={seat}
                                    color={color}
                                    selected={isSelected}
                                    price={resolvedPrice ?? undefined}
                                    onClick={() => toggleSeatSelection(seat)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )))
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="w-full space-y-6 lg:w-80">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Assignment actions</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedCount === 0
                ? "Select seats to enable tier assignment."
                : `${selectedCount} seat${selectedCount === 1 ? "" : "s"} selected.`}
            </p>

            {assignError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {assignError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={saving || selectedCount === 0 || !activeTierCode}
                onClick={() => activeTierCode && applyTierToSelection(activeTierCode)}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2F5F7F] px-4 py-2 text-sm font-semibold text-white transition",
                  selectedCount === 0 || !activeTierCode
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-[#23465d]"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Assign to {activeTierCode ?? "tier"}
              </button>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={saving || selectedCount === 0}
                  onClick={() => handleUpdateSeatStatus(EventSeatStatus.BLOCKED)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition",
                    selectedCount === 0 ? "cursor-not-allowed opacity-50" : "hover:border-rose-300 hover:text-rose-700"
                  )}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Block seats
                </button>

                <button
                  type="button"
                  disabled={saving || selectedCount === 0}
                  onClick={() => handleUpdateSeatStatus(EventSeatStatus.AVAILABLE)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 transition",
                    selectedCount === 0 ? "cursor-not-allowed opacity-50" : "hover:border-emerald-300 hover:text-emerald-700"
                  )}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                  Mark available
                </button>
              </div>

              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition",
                  selectedCount === 0 ? "cursor-not-allowed opacity-50" : "hover:border-slate-300 hover:text-slate-900"
                )}
              >
                <X className="h-4 w-4" /> Clear selection
              </button>

            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Seat breakdown</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {seatMap.ticketTiers.map(tier => (
                <div key={tier.tierCode} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tierColorMap.get(tier.tierCode) || "#cbd5f5" }}
                    />
                    {tier.tierName}
                  </span>
                  <span className="font-semibold">{tierCounts.get(tier.tierCode) ?? 0}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-200" /> Unassigned
                </span>
                <span className="font-medium">{tierCounts.get("__unassigned") ?? 0}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SeatMapDesignerClient;

interface SeatButtonProps {
  seat: EventSeatMapSeat;
  color?: string;
  selected: boolean;
  price?: number;
  onClick: () => void;
}

const SeatButton = ({ seat, color, selected, price, onClick }: SeatButtonProps) => {
  const disabled = seat.status === EventSeatStatus.SOLD || seat.status === EventSeatStatus.RESERVED;
  const displayLabel = seat.label || (seat.row ? `${seat.row}${seat.number ?? ""}` : seat.number?.toString() ?? "–");

  const palette = {
    availableBg: color ? withAlpha(color, selected ? 0.35 : 0.18) : selected ? "#cbd5f5" : "#f1f5f9",
    availableBorder: color ? withAlpha(color, 0.8) : "#cbd5f5",
  };

  const statusStyles = (() => {
    if (selected && !disabled) {
      return {
        className: "ring-2 ring-offset-2 ring-[#2F5F7F]",
        bg: palette.availableBg,
        border: palette.availableBorder,
        text: "text-slate-900",
      };
    }

    switch (seat.status) {
      case EventSeatStatus.AVAILABLE:
        return { bg: palette.availableBg, border: palette.availableBorder, text: "text-slate-800" };
      case EventSeatStatus.BLOCKED:
        return { bg: "#fee2e2", border: "#fca5a5", text: "text-rose-600" };
      case EventSeatStatus.RESERVED:
        return { bg: "#fef3c7", border: "#fcd34d", text: "text-amber-700" };
      case EventSeatStatus.SOLD:
        return { bg: "#fee2e2", border: "#f87171", text: "text-rose-700" };
      default:
        return { bg: "#e2e8f0", border: "#cbd5f5", text: "text-slate-500" };
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${displayLabel} · ${seat.tierCode ?? "Unassigned"} · ${seat.status}`}
      className={cn(
        "flex h-11 w-11 flex-col items-center justify-center rounded-xl border text-[11px] font-semibold transition",
        disabled ? "cursor-not-allowed opacity-70" : "hover:translate-y-[-1px] hover:shadow",
        statusStyles.className,
        statusStyles.text,
      )}
      style={{ backgroundColor: disabled ? undefined : statusStyles.bg, borderColor: statusStyles.border }}
    >
      <span className="leading-tight">{displayLabel}</span>
      <span className="text-[9px] font-medium text-slate-600">
        {price !== undefined ? `$${Number(price).toFixed(0)}` : "—"}
      </span>
    </button>
  );
};

const SeatStatusLegend = () => (
  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
    <LegendDot label="Available" className="bg-green-100 border-green-500" />
    <LegendDot label="Blocked" className="bg-rose-100 border-rose-500" />
    <LegendDot label="Reserved" className="bg-amber-100 border-amber-500" />
    <LegendDot label="Sold" className="bg-red-100 border-red-500" />
  </div>
);

const LegendDot = ({ label, className }: { label: string; className: string }) => (
  <span className="inline-flex items-center gap-1">
    <span className={`h-3 w-3 rounded-full border ${className}`} />
    {label}
  </span>
);

interface TierPaletteProps {
  tiers: EventSeatMap["ticketTiers"];
  activeTierCode: string | null;
  tierColorMap: Map<string, string>;
  onSelectTier: (code: string) => void;
}

const TierPalette = ({ tiers, activeTierCode, tierColorMap, onSelectTier }: TierPaletteProps) => {
  if (tiers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">Ticket tiers</h2>
      <p className="text-sm text-slate-500">Choose a tier to assign then click on seats to select them.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {tiers.map(tier => {
          const color = tierColorMap.get(tier.tierCode) ?? "#2F5F7F";
          const active = activeTierCode === tier.tierCode;
          return (
            <button
              key={tier.tierCode}
              type="button"
              onClick={() => onSelectTier(tier.tierCode)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-transparent text-white shadow"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              )}
              style={active ? { backgroundColor: color } : undefined}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              {tier.tierName}
              <span className="text-xs text-slate-400">${tier.price.toFixed(0)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const withAlpha = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(Math.max(alpha, 0), 1)})`;
};
