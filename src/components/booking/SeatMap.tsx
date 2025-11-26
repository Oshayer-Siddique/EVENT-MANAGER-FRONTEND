'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { useEventSeats } from '@/hooks/useEventSeats';
import { getSeatLayoutById } from '@/services/venueService';
import { EventSeat, EventSeatStatus } from '../../types/eventSeat';
import type { EventTicketTier, SeatLayoutSummary } from '../../types/event';
import type { Layout } from '@/types/layout';
import type { TheaterPlanSummary } from '@/types/theaterPlan';
import { cn } from '@/lib/utils/utils';

const THEATER_LAYOUT_TYPES = new Set(['Theater', 'Seminar', 'Conference Hall']);

const TIER_COLORS = ['#2F5F7F', '#0EA5E9', '#EC4899', '#22C55E', '#F97316', '#6366F1', '#14B8A6', '#FACC15'];

const WALKWAY_PATTERN: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(251,191,36,0.85) 0 8px, rgba(254,240,199,0.85) 8px 16px)',
};
const SEAT_PIXEL_WIDTH = 32;
const SEAT_GAP_WIDTH = 6;


interface SeatMapProps {
  eventId: string;
  selectedSeats: EventSeat[];
  onSeatSelect: (seat: EventSeat) => void;
  tiers: EventTicketTier[];
  seatLayout?: SeatLayoutSummary | null;
}

const SeatMap = ({ eventId, selectedSeats, onSeatSelect, tiers, seatLayout }: SeatMapProps) => {
  const { seats, loading, error, rateLimitedUntil, refresh } = useEventSeats(eventId, {
    enabled: Boolean(eventId),
    cacheDurationMs: 0,
  });
  const [activeTier, setActiveTier] = useState<string>('ALL');
  const [activeSection, setActiveSection] = useState<string>('');
  const [layoutDetail, setLayoutDetail] = useState<Layout | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const tierLabelMap = useMemo(() => {
    const map = new Map<string, { name: string; price: number }>();
    tiers.forEach(tier => map.set(tier.tierCode, { name: tier.tierName, price: tier.price }));
    return map;
  }, [tiers]);

  const tierColorMap = useMemo(() => {
    return new Map(tiers.map((tier, index) => [tier.tierCode, TIER_COLORS[index % TIER_COLORS.length]]));
  }, [tiers]);

  const tierPriceMap = useMemo(() => new Map(tiers.map(tier => [tier.tierCode, tier.price])), [tiers]);

  useEffect(() => {
    let cancelled = false;
    if (!seatLayout?.id || !seatLayout?.typeName || !THEATER_LAYOUT_TYPES.has(seatLayout.typeName)) {
      setLayoutDetail(null);
      setLayoutError(null);
      return () => {
        cancelled = true;
      };
    }

    const loadLayout = async () => {
      try {
        setLayoutError(null);
        const layout = await getSeatLayoutById(seatLayout.id!);
        if (!cancelled) {
          setLayoutDetail(layout);
        }
      } catch (err) {
        console.error('Failed to load layout configuration', err);
        if (!cancelled) {
          setLayoutError('Unable to load the exact seating layout.');
          setLayoutDetail(null);
        }
      } finally {
        // no-op
      }
    };

    void loadLayout();
    return () => {
      cancelled = true;
    };
  }, [seatLayout?.id, seatLayout?.typeName]);

  const filteredSeats = useMemo(() => {
    if (activeTier === 'ALL') return seats;
    return seats.filter(seat => seat.tierCode === activeTier || seat.type === activeTier);
  }, [activeTier, seats]);

  const sectionGroups = useMemo(() => {
    const groups = new Map<string, Map<string, EventSeat[]>>();
    filteredSeats.forEach(seat => {
      const section = seat.type ?? 'General Seating';
      const row = seat.row ?? 'Row';
      if (!groups.has(section)) {
        groups.set(section, new Map());
      }
      const rowMap = groups.get(section)!;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(seat);
    });

    // Sort rows and seats for consistent display
    groups.forEach(rowMap => {
      rowMap.forEach(list =>
        list.sort((a, b) =>
          naturalSeatComparator(a.label ?? a.number, b.label ?? b.number),
        ),
      );
    });

    return groups;
  }, [filteredSeats]);

  const seatByLabel = useMemo(() => {
    const map = new Map<string, EventSeat>();
    seats.forEach(seat => {
      const labelKey = seat.label?.trim();
      if (labelKey) {
        map.set(labelKey, seat);
        return;
      }
      if (seat.row) {
        map.set(`${seat.row}${seat.number ?? ''}`, seat);
        return;
      }
      map.set(seat.eventSeatId, seat);
    });
    return map;
  }, [seats]);

  const selectedSeatIds = useMemo(() => new Set(selectedSeats.map(seat => seat.eventSeatId)), [selectedSeats]);

  type LayoutSeatDefinition = TheaterPlanSummary['seats'][number];

  type LayoutRowCell =
    | { kind: 'walkway'; columnIndex: number }
    | { kind: 'empty'; columnIndex: number }
    | { kind: 'seat'; columnIndex: number; seat: EventSeat | null; price?: number };

  type LayoutRowDefinition =
    | { kind: 'walkway-row'; label: string }
    | { kind: 'seat-row'; label: string; cells: LayoutRowCell[] };

  const theaterPlan = useMemo(() => {
    if (!layoutDetail?.configuration || layoutDetail.configuration.kind !== 'theater') {
      return null;
    }
    return layoutDetail.configuration.summary;
  }, [layoutDetail]);

  const layoutRows = useMemo<LayoutRowDefinition[] | null>(() => {
    if (!theaterPlan) {
      return null;
    }

    const columns = Math.max(1, theaterPlan.columns);
    const walkwayColumns = new Set(theaterPlan.walkwayColumns ?? []);
    const seatLookup = new Map<string, Map<number, LayoutSeatDefinition>>();
    theaterPlan.seats.forEach(seat => {
      if (!seatLookup.has(seat.rowLabel)) {
        seatLookup.set(seat.rowLabel, new Map());
      }
      seatLookup.get(seat.rowLabel)!.set(seat.columnIndex, seat);
    });

    return theaterPlan.rows.map(row => {
      if (row.isWalkway) {
        return { kind: 'walkway-row', label: row.rowLabel } as LayoutRowDefinition;
      }

      const columnMap = seatLookup.get(row.rowLabel) ?? new Map<number, LayoutSeatDefinition>();
      const cells: LayoutRowCell[] = [];
      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        if (walkwayColumns.has(columnIndex)) {
          cells.push({ kind: 'walkway', columnIndex });
          continue;
        }

        const seatDef = columnMap.get(columnIndex);
        if (!seatDef) {
          cells.push({ kind: 'empty', columnIndex });
          continue;
        }

        const labelKey = seatDef.label || `${seatDef.rowLabel}${seatDef.seatNumber}`;
        const seat = labelKey ? seatByLabel.get(labelKey) ?? null : null;
        const fallbackPrice = seat?.tierCode ? tierPriceMap.get(seat.tierCode) : undefined;
        cells.push({ kind: 'seat', columnIndex, seat, price: seat?.price ?? fallbackPrice });
      }

      return { kind: 'seat-row', label: row.rowLabel, cells } as LayoutRowDefinition;
    });
  }, [seatByLabel, theaterPlan, tierPriceMap]);

  useEffect(() => {
    if (layoutRows) {
      return;
    }
    if (sectionGroups.size === 0) {
      setActiveSection('');
      return;
    }
    if (!activeSection || !sectionGroups.has(activeSection)) {
      setActiveSection(sectionGroups.keys().next().value ?? 'General Seating');
    }
  }, [activeSection, sectionGroups, layoutRows]);

  const handleSeatPress = (seat: EventSeat) => {
    if (seat.status !== EventSeatStatus.AVAILABLE) return;
    onSeatSelect(seat);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <span className="text-sm text-gray-600">Loading seat layout…</span>
      </div>
    );
  }

  if (error) {
    const message = rateLimitedUntil && rateLimitedUntil > Date.now()
      ? 'We are refreshing seat availability. Please try again shortly.'
      : error.message || 'Seat layout is not available for this event yet.';
    return (
      <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => void refresh({ ignoreRateLimit: true })}
          className="rounded-md border border-yellow-400 px-3 py-1 text-xs font-semibold text-yellow-900 transition hover:bg-yellow-100"
        >
          Retry now
        </button>
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        No seats have been configured for this event yet. Please check back later or contact the event
        organizer.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Choose your seats</h3>
          {seatLayout && (
            <p className="text-sm text-gray-500">
              Layout: {seatLayout.layoutName} · Capacity {seatLayout.totalCapacity}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <FilterPill
            active={activeTier === 'ALL'}
            label="All tiers"
            onClick={() => setActiveTier('ALL')}
          />
          {tiers.map(tier => (
            <FilterPill
              key={tier.id}
              active={activeTier === tier.tierCode}
              label={`${tier.tierName} · $${tier.price.toFixed(2)}`}
              onClick={() => setActiveTier(tier.tierCode)}
            />
          ))}
        </div>
      </div>

      <SeatLegend />

      {layoutError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {layoutError}
        </div>
      )}

      {layoutRows ? (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <div className="mx-auto flex w-full max-w-2xl justify-center">
            <div className="w-1/2 rounded-full bg-slate-900 px-6 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow">
              Stage
            </div>
          </div>
          <div className="space-y-1.5">
            {layoutRows.map(row => {
              if (row.kind === 'walkway-row') {
                const walkwayWidth = theaterPlan
                  ? theaterPlan.columns * SEAT_PIXEL_WIDTH + Math.max(theaterPlan.columns - 1, 0) * SEAT_GAP_WIDTH
                  : undefined;
                return (
                  <div key={`walkway-${row.label}`} className="mx-auto flex w-full max-w-2xl items-center justify-center gap-1.5">
                    <span className="w-5" />
                    <div
                      className="h-3 rounded-full border border-amber-200 bg-amber-100/80 text-center text-[7px] font-semibold uppercase tracking-[0.25em] text-amber-700"
                      style={{
                        ...WALKWAY_PATTERN,
                        width: walkwayWidth ? `${walkwayWidth}px` : 'auto',
                      }}
                    >
                      {row.label || 'Walkway'}
                    </div>
                  </div>
                );
              }

              return (
                <div key={`row-${row.label}`} className="mx-auto flex w-full max-w-2xl items-center justify-center gap-1.5">
                  <span className="w-5 text-right text-[10px] font-semibold text-slate-500">{row.label}</span>
                  <div className="flex flex-nowrap items-center justify-center gap-1 overflow-x-auto">
                    {row.cells.map(cell => {
                      if (cell.kind === 'walkway') {
                        return (
                          <div
                            key={`walkway-${row.label}-${cell.columnIndex}`}
                            className="mx-0.5 h-8 w-8 rounded-full border border-amber-200"
                            style={WALKWAY_PATTERN}
                            aria-hidden
                          />
                        );
                      }

                      if (cell.kind === 'empty') {
                        return <div key={`empty-${row.label}-${cell.columnIndex}`} className="h-8 w-8 rounded-md bg-transparent" />;
                      }

                      if (!cell.seat) {
                        return (
                          <div
                            key={`missing-${row.label}-${cell.columnIndex}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white/70 text-[8px] font-medium text-slate-400"
                          >
                            N/A
                          </div>
                        );
                      }

                      const seat = cell.seat;
                      const isSelected = selectedSeatIds.has(seat.eventSeatId);
                      const matchesTier =
                        activeTier === 'ALL' || seat.tierCode === activeTier || seat.type === activeTier;
                      const color = seat.tierCode ? tierColorMap.get(seat.tierCode) : undefined;

                      return (
                        <SeatTile
                          key={seat.eventSeatId}
                          seat={seat}
                          selected={isSelected}
                          color={color}
                          price={cell.price}
                          matchesTier={matchesTier}
                          onSelect={() => handleSeatPress(seat)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(sectionGroups.keys()).map(section => (
              <SectionChip
                key={section}
                label={section}
                active={section === activeSection}
                onClick={() => setActiveSection(section)}
              />
            ))}
          </div>

          {activeSection ? (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4 lg:max-h-[60vh] lg:overflow-y-auto">
              {Array.from(sectionGroups.get(activeSection)?.entries() ?? []).map(([row, rowSeats]) => (
                <div key={row} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>{row}</span>
                    <span className="text-xs text-gray-400">{rowSeats.length} seats</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rowSeats.map(seat => {
                      const isSelected = selectedSeats.some(
                        selected => selected.eventSeatId === seat.eventSeatId,
                      );
                      const tier = tierLabelMap.get(seat.tierCode ?? seat.type ?? '');
                      const statusLabel = statusCopy(seat.status);
                      const seatLabel = seat.label
                        ?? (seat.row && seat.number !== undefined
                          ? `${seat.row}${seat.number}`
                          : seat.row ?? String(seat.number ?? 'Seat'));
                      const displayPrice = seat.price ?? tier?.price;
                      const numericPrice = displayPrice !== undefined ? Number(displayPrice) : undefined;
                      const tooltip = `${seatLabel} · ${tier?.name ?? seat.tierCode ?? 'Seat'} · ${statusLabel}`;
                      return (
                        <button
                          key={seat.eventSeatId}
                          type="button"
                          className={buildSeatClasses(seat.status, isSelected)}
                          onClick={() => handleSeatPress(seat)}
                          disabled={seat.status !== EventSeatStatus.AVAILABLE}
                          aria-label={tooltip}
                        >
                          <span className="text-[11px] font-semibold leading-tight">{seatLabel}</span>
                          {numericPrice !== undefined && !Number.isNaN(numericPrice) && (
                            <span className="text-[9px] text-gray-500">${numericPrice.toFixed(0)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No seating sections match the current filters.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeatMap;

interface SeatTileProps {
  seat: EventSeat;
  selected: boolean;
  color?: string;
  price?: number;
  matchesTier: boolean;
  onSelect: () => void;
}

const SeatTile = ({ seat, selected, color, price, matchesTier, onSelect }: SeatTileProps) => {
  const available = seat.status === EventSeatStatus.AVAILABLE;
  const reserved = seat.status === EventSeatStatus.RESERVED;
  const interactable = available && (matchesTier || selected);
  const label =
    seat.label ?? (seat.row && seat.number !== undefined ? `${seat.row}${seat.number}` : seat.row ?? String(seat.number ?? 'Seat'));
  const backgroundColor = reserved
    ? '#fcd34d'
    : color
      ? withAlpha(color, selected ? 0.9 : 0.75)
      : selected
        ? '#2563eb'
        : '#cbd5f5';
  const borderColor = reserved ? '#f97316' : color ? withAlpha(color, 1) : '#94a3b8';
  const textColor = reserved || color ? 'text-white' : 'text-slate-700';

  return (
    <button
      type="button"
      onClick={() => interactable && onSelect()}
      disabled={!interactable}
      className={cn(
        'flex h-8 w-8 flex-col items-center justify-center rounded-lg border text-[9px] font-semibold transition',
        interactable ? 'hover:-translate-y-0.5 hover:shadow' : 'cursor-not-allowed opacity-35',
        selected ? 'ring-1 ring-offset-1 ring-white/70' : '',
        textColor,
      )}
      style={{ backgroundColor, borderColor }}
      aria-label={`${label} · ${seat.tierCode ?? 'Seat'} · ${statusCopy(seat.status)}`}
    >
      <span className="leading-tight">{label}</span>
      <span className="text-[7px] font-medium text-white/90">{price !== undefined ? `$${Number(price).toFixed(0)}` : '—'}</span>
    </button>
  );
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FilterPill = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-sm transition ${
      active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
    }`}
  >
    {label}
  </button>
);

const SectionChip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-sm transition ${
      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const SeatLegend = () => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
    <LegendItem color="bg-green-100 border-green-500" label="Available" />
    <LegendItem color="bg-blue-100 border-blue-500" label="Selected" />
    <LegendItem color="bg-yellow-100 border-yellow-500" label="Reserved" />
    <LegendItem color="bg-rose-100 border-rose-500" label="Pre-reserved" />
    <LegendItem color="bg-red-100 border-red-500" label="Sold" />
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-2">
    <span className={`h-4 w-4 rounded border ${color}`} />
    {label}
  </span>
);

const buildSeatClasses = (status: EventSeatStatus, isSelected: boolean) => {
  if (isSelected) {
    return 'flex h-8 w-8 flex-col items-center justify-center rounded-md border-2 border-blue-500 bg-blue-100 text-blue-700 shadow-sm';
  }

  const base =
    'flex h-8 w-8 flex-col items-center justify-center rounded-md border bg-white text-[10px] text-gray-600 shadow-sm transition';

  switch (status) {
    case EventSeatStatus.AVAILABLE:
      return `${base} border-green-400 hover:-translate-y-0.5 hover:border-green-600 hover:shadow`;
    case EventSeatStatus.RESERVED:
      return `${base} cursor-not-allowed border-yellow-400 bg-yellow-50 text-yellow-700`;
    case EventSeatStatus.SOLD:
      return `${base} cursor-not-allowed border-red-400 bg-red-50 text-red-600`;
    case EventSeatStatus.BLOCKED:
      return `${base} cursor-not-allowed border-rose-400 bg-rose-50 text-rose-600`;
    default:
      return `${base} border-gray-300 bg-gray-100 text-gray-500`;
  }
};

const naturalSeatComparator = (a?: string | number, b?: string | number) => {
  const strA = a !== undefined && a !== null ? String(a) : '';
  const strB = b !== undefined && b !== null ? String(b) : '';
  if (!strA || !strB) return 0;
  const regex = /(\d+)|(\D+)/g;
  const aParts = strA.match(regex) ?? [];
  const bParts = strB.match(regex) ?? [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const partA = aParts[i] ?? '';
    const partB = bParts[i] ?? '';
    if (partA === partB) continue;

    const numA = Number(partA);
    const numB = Number(partB);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB;
    }
    return partA.localeCompare(partB);
  }
  return 0;
};

const statusCopy = (status: EventSeatStatus) => {
  switch (status) {
    case EventSeatStatus.AVAILABLE:
      return 'Available';
    case EventSeatStatus.RESERVED:
      return 'Reserved';
    case EventSeatStatus.SOLD:
      return 'Sold';
    case EventSeatStatus.BLOCKED:
      return 'Reserved by organizer';
    default:
      return 'Unavailable';
  }
};
