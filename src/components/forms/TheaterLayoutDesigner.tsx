"use client";

import { ArrowDown, ArrowUp, Copy, Plus, SquarePlus, Trash2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/utils";
import type {
  TheaterDesignerState,
  TheaterPlanSection,
  TheaterSeatCell,
  TheaterRowState,
  TheaterPlanSummary,
  TheaterSeatDefinition,
  TheaterRowSummary,
} from "@/types/theaterPlan";

const SEAT_COLORS = [
  "#2563eb",
  "#059669",
  "#db2777",
  "#f97316",
  "#7c3aed",
  "#0ea5e9",
  "#dc2626",
  "#65a30d",
];

interface TheaterLayoutDesignerProps {
  value?: TheaterDesignerState;
  onChange?: (state: TheaterDesignerState, summary: TheaterPlanSummary) => void;
  venueMaxCapacity?: number;
  onInitialized?: () => void;
}

const DEFAULT_ROWS = 1;
const DEFAULT_COLS = 1;

const normalizeWalkwayColumns = (columns: number[] | undefined, columnCount: number) => {
  if (!Array.isArray(columns)) {
    return [];
  }
  const unique = Array.from(
    new Set(
      columns.filter((index) => Number.isInteger(index) && index >= 0 && index < columnCount),
    ),
  );
  unique.sort((a, b) => a - b);
  return unique;
};

const applyWalkwayColumnsToRows = (rows: TheaterRowState[], walkwayColumns: number[]) => {
  if (!walkwayColumns.length) {
    return rows;
  }
  const walkwaySet = new Set(walkwayColumns);
  return rows.map((row) => {
    if (row.isWalkway) {
      return row;
    }
    let mutated = false;
    const seats = row.seats.map((seat, columnIndex) => {
      if (!walkwaySet.has(columnIndex)) {
        return seat;
      }
      if (!seat.enabled) {
        return seat;
      }
      mutated = true;
      return { ...seat, enabled: false };
    });
    return mutated ? { ...row, seats } : row;
  });
};

const createSeatCell = (rowIndex: number, columnIndex: number): TheaterSeatCell => ({
  id: `seat-${rowIndex}-${columnIndex}-${Math.random().toString(36).slice(2, 6)}`,
  enabled: true,
});

const createRow = (
  rowIndex: number,
  columnCount: number,
  sectionId: string,
  isWalkway = false,
): TheaterRowState => ({
  id: `row-${rowIndex}-${Math.random().toString(36).slice(2, 8)}`,
  label: isWalkway ? "Walkway" : String.fromCharCode(65 + (rowIndex % 26)),
  sectionId,
  startNumber: 1,
  isWalkway,
  seats: Array.from({ length: columnCount }, (_, columnIndex) => ({
    ...createSeatCell(rowIndex, columnIndex),
    enabled: !isWalkway,
  })),
});

const createDefaultState = (): TheaterDesignerState => {
  const sections: TheaterPlanSection[] = [
    { id: "section-main", name: "Main Floor", color: SEAT_COLORS[0] },
  ];

  const defaultSectionId = sections[0]?.id ?? "section-main";
  const rows = Array.from({ length: DEFAULT_ROWS }, (_, index) =>
    createRow(index, DEFAULT_COLS, defaultSectionId),
  );

  return {
    rows,
    sections,
    columnCount: DEFAULT_COLS,
    walkwayColumns: [],
  };
};

const createStateFromDimensions = (
  rowCount: number,
  columnCount: number,
  templateSections?: TheaterPlanSection[],
): TheaterDesignerState => {
  const baseSections = templateSections && templateSections.length > 0 ? templateSections : createDefaultState().sections;
  const sections = baseSections.map((section, index) => ({
    ...section,
    id: section.id || `section-${index + 1}`,
  }));

  const rows = Array.from({ length: Math.max(1, rowCount) }, (_, index) => {
    const sectionId = sections[0]?.id ?? `section-${index + 1}`;
    return createRow(index, Math.max(1, columnCount), sectionId);
  });

  return {
    rows,
    sections,
    columnCount: Math.max(1, columnCount),
    walkwayColumns: [],
  };
};

const buildSummary = (state: TheaterDesignerState): TheaterPlanSummary => {
  const sectionMap = new Map(state.sections.map((section) => [section.id, section]));

  const rows: TheaterRowSummary[] = state.rows.map((row, rowIndex) => {
    const section = sectionMap.get(row.sectionId);
    const activeSeatCount = row.seats.filter((seat) => seat.enabled).length;
    return {
      rowId: row.id,
      rowIndex,
      rowLabel: row.label,
      sectionId: row.sectionId,
      sectionName: section?.name ?? "",
      sectionColor: section?.color ?? "#475569",
      startNumber: row.startNumber,
      activeSeatCount,
      isWalkway: row.isWalkway,
    };
  });

  const seats: TheaterSeatDefinition[] = [];

  state.rows.forEach((row, rowIndex) => {
    if (row.isWalkway) {
      return;
    }
    const section = sectionMap.get(row.sectionId);
    let seatNumber = row.startNumber;
    row.seats.forEach((seat, columnIndex) => {
      if (!seat.enabled) {
        return;
      }
      seats.push({
        rowId: row.id,
        rowIndex,
        rowLabel: row.label,
        columnIndex,
        seatNumber,
        label: `${row.label}${seatNumber}`,
        sectionId: row.sectionId,
        sectionName: section?.name ?? "",
        sectionColor: section?.color ?? "#1e293b",
      });
      seatNumber += 1;
    });
  });

  return {
    seats,
    rows,
    columns: state.columnCount,
    sections: state.sections,
    capacity: seats.length,
    walkwayColumns: normalizeWalkwayColumns(state.walkwayColumns, state.columnCount),
  };
};

const ensureSeatRow = (row: TheaterRowState): TheaterRowState => {
  if (!row.isWalkway) {
    return row;
  }
  return {
    ...row,
    isWalkway: false,
    seats: row.seats.map((seat) => ({ ...seat, enabled: true })),
  };
};

const getSeatNumberForColumn = (row: TheaterRowState, columnIndex: number) => {
  if (row.isWalkway) return null;
  let number = row.startNumber;
  for (let index = 0; index < row.seats.length; index += 1) {
    const seat = row.seats[index];
    if (!seat.enabled) continue;
    if (index === columnIndex) {
      return number;
    }
    number += 1;
  }
  return null;
};

const hydrateDesignerState = (raw?: TheaterDesignerState): TheaterDesignerState => {
  const base = raw ?? createDefaultState();
  const walkwayColumns = normalizeWalkwayColumns(base.walkwayColumns, base.columnCount);
  const rows = applyWalkwayColumnsToRows(base.rows, walkwayColumns);
  return {
    ...base,
    walkwayColumns,
    rows,
  };
};

const TheaterLayoutDesigner: React.FC<TheaterLayoutDesignerProps> = ({
  value,
  onChange,
  venueMaxCapacity,
  onInitialized,
}) => {
  const initialState = useMemo(() => hydrateDesignerState(value), [value]);
  const [state, setState] = useState<TheaterDesignerState>(initialState);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(
    () => initialState.rows[0]?.id ?? null,
  );
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const valueHashRef = useRef<string | null>(value ? JSON.stringify(value) : null);

  useEffect(() => {
    if (!value) return;

    const hash = JSON.stringify(value);
    if (valueHashRef.current === hash) {
      return;
    }

    valueHashRef.current = hash;
    const hydrated = hydrateDesignerState(value);
    setState(hydrated);
    setSelectedRowId(hydrated.rows[0]?.id ?? null);
    onInitialized?.();
  }, [value, onInitialized]);

  const summary = useMemo(() => buildSummary(state), [state]);

  useEffect(() => {
    onChange?.(state, summary);
  }, [state, summary, onChange]);

  useEffect(() => {
    if (!state.rows.length) {
      if (selectedRowId) setSelectedRowId(null);
      return;
    }
    if (!selectedRowId || !state.rows.some((row) => row.id === selectedRowId)) {
      setSelectedRowId(state.rows[0].id);
    }
  }, [state.rows, selectedRowId]);

  const sectionMap = useMemo(() => new Map(state.sections.map((section) => [section.id, section])), [state.sections]);
  const selectedRow = selectedRowId ? state.rows.find((row) => row.id === selectedRowId) ?? null : null;

  const updateSelection = (id: string | null) => setSelectedRowId(id);

  const setRowCount = useCallback(
    (count: number) => {
      let nextSelection: string | null | undefined;
      const target = Math.max(1, count);
      setState((prev) => {
        if (target === prev.rows.length) return prev;
        let rows: TheaterRowState[];
        if (target > prev.rows.length) {
          const additions = Array.from({ length: target - prev.rows.length }, (_, idx) =>
            createRow(
              prev.rows.length + idx,
              prev.columnCount,
              prev.rows[prev.rows.length - 1]?.sectionId ?? prev.sections[0]?.id ?? "section-1",
            ),
          );
          nextSelection = additions.length ? additions[additions.length - 1].id : prev.rows[prev.rows.length - 1]?.id;
          rows = [...prev.rows, ...additions];
        } else {
          rows = prev.rows.slice(0, target);
          if (selectedRowId && !rows.some((row) => row.id === selectedRowId)) {
            const removedIndex = prev.rows.findIndex((row) => row.id === selectedRowId);
            const fallbackIndex = Math.min(rows.length - 1, Math.max(0, removedIndex - 1));
            nextSelection = rows[fallbackIndex]?.id ?? rows[0]?.id ?? null;
          }
        }
        return { ...prev, rows };
      });
      if (nextSelection !== undefined) {
        updateSelection(nextSelection ?? null);
      }
    },
    [selectedRowId],
  );

  const setColumnCount = useCallback((count: number) => {
    const target = Math.max(1, count);
    setState((prev) => {
      if (target === prev.columnCount) return prev;
      const resizedRows = prev.rows.map((row, rowIndex) => {
        if (target > prev.columnCount) {
          const additions = Array.from({ length: target - prev.columnCount }, (_, idx) => ({
            ...createSeatCell(rowIndex, prev.columnCount + idx),
            enabled: !row.isWalkway,
          }));
          return { ...row, seats: [...row.seats, ...additions] };
        }
        return { ...row, seats: row.seats.slice(0, target) };
      });
      const walkwayColumns = normalizeWalkwayColumns(
        prev.walkwayColumns.filter((index) => index < target),
        target,
      );
      const rows = applyWalkwayColumnsToRows(resizedRows, walkwayColumns);
      return { ...prev, columnCount: target, rows, walkwayColumns };
    });
  }, []);

  const addRowAfter = useCallback((index: number, walkway = false) => {
    let nextSelection: string | null = null;
    setState((prev) => {
      const sectionId = prev.rows[index]?.sectionId ?? prev.sections[0]?.id ?? "section-1";
      const walkwayColumns = normalizeWalkwayColumns(prev.walkwayColumns, prev.columnCount);
      const newRow = applyWalkwayColumnsToRows(
        [createRow(index + 1, prev.columnCount, sectionId, walkway)],
        walkwayColumns,
      )[0];
      nextSelection = newRow.id;
      const rows = [...prev.rows];
      rows.splice(index + 1, 0, newRow);
      return { ...prev, rows, walkwayColumns };
    });
    updateSelection(nextSelection);
  }, []);

  const duplicateRow = useCallback((rowId: string) => {
    let nextSelection: string | null = null;
    setState((prev) => {
      const index = prev.rows.findIndex((row) => row.id === rowId);
      if (index === -1) return prev;
      const source = prev.rows[index];
      const duplicate: TheaterRowState = {
        ...source,
        id: `row-${prev.rows.length}-${Math.random().toString(36).slice(2, 8)}`,
        seats: source.seats.map((seat, columnIndex) => ({
          id: `seat-${prev.rows.length}-${columnIndex}-${Math.random().toString(36).slice(2, 6)}`,
          enabled: seat.enabled,
        })),
      };
      const rows = [...prev.rows];
      rows.splice(index + 1, 0, duplicate);
      nextSelection = duplicate.id;
      return { ...prev, rows };
    });
    updateSelection(nextSelection);
  }, []);

  const removeRow = useCallback(
    (rowId: string) => {
      let nextSelection: string | null | undefined;
      setState((prev) => {
        if (prev.rows.length <= 1) return prev;
        const rows = prev.rows.filter((row) => row.id !== rowId);
        if (selectedRowId === rowId) {
          const removedIndex = prev.rows.findIndex((row) => row.id === rowId);
          const fallbackIndex = Math.min(rows.length - 1, Math.max(0, removedIndex - 1));
          nextSelection = rows[fallbackIndex]?.id ?? rows[0]?.id ?? null;
        }
        return { ...prev, rows };
      });
      if (nextSelection !== undefined) {
        updateSelection(nextSelection ?? null);
      }
    },
    [selectedRowId],
  );

  const moveRow = useCallback((rowId: string, direction: 1 | -1) => {
    setState((prev) => {
      const index = prev.rows.findIndex((row) => row.id === rowId);
      if (index === -1) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.rows.length) return prev;
      const rows = [...prev.rows];
      const [removed] = rows.splice(index, 1);
      rows.splice(target, 0, removed);
      return { ...prev, rows };
    });
  }, []);

  const toggleWalkway = useCallback((rowId: string) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row.id !== rowId) return row;
        if (row.isWalkway) {
          return ensureSeatRow(row);
        }
        return {
          ...row,
          isWalkway: true,
          label: row.label.trim().length ? row.label : "Walkway",
          seats: row.seats.map((seat) => ({ ...seat, enabled: false })),
        };
      }),
    }));
  }, []);

  const updateRow = useCallback((rowId: string, updater: (row: TheaterRowState) => TheaterRowState) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === rowId ? updater(row) : row)),
    }));
  }, []);

  const toggleSeat = useCallback((rowIndex: number, columnIndex: number) => {
    setState((prev) => {
      if (prev.walkwayColumns.includes(columnIndex)) {
        return prev;
      }
      const rows = prev.rows.map((row, index) => {
        if (index !== rowIndex || row.isWalkway) return row;
        const seats = row.seats.map((seat, seatIndex) =>
          seatIndex === columnIndex ? { ...seat, enabled: !seat.enabled } : seat,
        );
        return { ...row, seats };
      });
      return { ...prev, rows };
    });
  }, []);

  const toggleColumn = useCallback((columnIndex: number) => {
    setState((prev) => {
      if (prev.walkwayColumns.includes(columnIndex)) {
        return prev;
      }
      const hasEnabledSeat = prev.rows.some(
        (row) => !row.isWalkway && row.seats[columnIndex]?.enabled,
      );
      const rows = prev.rows.map((row) => {
        if (row.isWalkway) return row;
        const seats = row.seats.map((seat, seatIndex) =>
          seatIndex === columnIndex ? { ...seat, enabled: !hasEnabledSeat } : seat,
        );
        return { ...row, seats };
      });
      return { ...prev, rows };
    });
  }, []);

  const toggleWalkwayColumn = useCallback((columnIndex: number) => {
    setState((prev) => {
      const current = normalizeWalkwayColumns(prev.walkwayColumns, prev.columnCount);
      const walkwaySet = new Set(current);
      const isWalkway = walkwaySet.has(columnIndex);
      if (isWalkway) {
        walkwaySet.delete(columnIndex);
        return { ...prev, walkwayColumns: Array.from(walkwaySet).sort((a, b) => a - b) };
      }

      const rows = prev.rows.map((row) => {
        if (row.isWalkway) return row;
        const seats = row.seats.map((seat, seatIndex) => {
          if (seatIndex !== columnIndex) return seat;
          if (!seat.enabled) return seat;
          return { ...seat, enabled: false };
        });
        return { ...row, seats };
      });

      walkwaySet.add(columnIndex);
      const walkwayColumns = Array.from(walkwaySet).sort((a, b) => a - b);
      return { ...prev, rows, walkwayColumns };
    });
  }, []);

  const addSection = useCallback(() => {
    const name = window.prompt("Section name", `Section ${state.sections.length + 1}`);
    if (!name) return;
    setState((prev) => {
      if (prev.sections.some((section) => section.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      const section: TheaterPlanSection = {
        id: `section-${prev.sections.length + 1}`,
        name,
        color: SEAT_COLORS[prev.sections.length % SEAT_COLORS.length],
      };
      return { ...prev, sections: [...prev.sections, section] };
    });
  }, [state.sections.length]);

  const renameSection = useCallback((sectionId: string) => {
    const section = sectionMap.get(sectionId);
    if (!section) return;
    const name = window.prompt("Section name", section.name);
    if (!name) return;
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((item) => (item.id === sectionId ? { ...item, name } : item)),
    }));
  }, [sectionMap]);

const capacityWarning = useMemo(() => {
  if (!venueMaxCapacity || venueMaxCapacity <= 0) return null;
  if (summary.capacity <= venueMaxCapacity) return null;
  return `Capacity exceeds venue limit (${venueMaxCapacity}).`;
}, [summary.capacity, venueMaxCapacity]);

const seatedRowCount = summary.rows.filter((row) => !row.isWalkway && row.activeSeatCount > 0).length;
const headerColumns = Array.from({ length: state.columnCount }, (_, columnIndex) => columnIndex + 1);
const walkwayColumnSet = useMemo(() => new Set(state.walkwayColumns), [state.walkwayColumns]);

const gridTemplate = inspectorOpen
  ? "lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px]"
  : "lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]";

return (
  <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Theater Seat Builder</p>
          <p className="text-sm text-slate-500">Pick a row from the strip below, toggle seats directly on the canvas, and refine details in the inspector.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Seats</p>
            <p className="text-2xl font-bold text-slate-800">{summary.capacity}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">Active Rows</p>
            <p className="text-2xl font-bold text-slate-800">{seatedRowCount}</p>
          </div>
          {venueMaxCapacity ? (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-slate-500">Venue Max</p>
              <p className="text-2xl font-bold text-indigo-600">{venueMaxCapacity}</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Rows</label>
          <Input
            type="number"
            min={1}
            value={state.rows.length}
            onChange={(event) => setRowCount(parseInt(event.target.value || "0", 10))}
            className="h-9 w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Columns</label>
          <Input
            type="number"
            min={1}
            value={state.columnCount}
            onChange={(event) => setColumnCount(parseInt(event.target.value || "0", 10))}
            className="h-9 w-20"
          />
        </div>
        <Button variant="outline" size="sm" onClick={addSection}>
          <SquarePlus size={16} className="mr-2" /> Add Section
        </Button>
        {capacityWarning ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600">
            {capacityWarning}
          </div>
        ) : null}
      </div>
    </div>

    <div className={cn("grid gap-6 grid-cols-1", gridTemplate)}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500">Rows</h3>
            <p className="text-xs text-slate-500">Select a row to edit its details or assign a section.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addRowAfter(state.rows.length - 1, false)}>
              <Plus size={14} className="mr-1" /> Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={() => addRowAfter(state.rows.length - 1, true)}>
              <Plus size={14} className="mr-1" /> Add Walkway
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Row list</p>
            <Button variant="outline" size="sm" onClick={() => setInspectorOpen((prev) => !prev)}>
              {inspectorOpen ? "Hide" : "Show"} row details
            </Button>
          </div>
          <div className="mt-2 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {state.rows.map((row, index) => {
              const isSelected = row.id === selectedRowId;
              const section = sectionMap.get(row.sectionId);
              return (
                <button
                  type="button"
                  key={row.id}
                  onClick={() => updateSelection(row.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold shadow-sm transition",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{row.label || `Row ${index + 1}`}</span>
                    {row.isWalkway ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                        Walkway
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {row.seats.filter((seat) => seat.enabled).length} seats
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{section?.name ?? "Unassigned"}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-slate-700 px-6 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Stage
          </div>
        </div>
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-1.5"
            style={{ gridTemplateColumns: `48px repeat(${state.columnCount}, minmax(28px, 1fr))` }}
          >
            <div className="flex items-center justify-center text-[11px] font-semibold uppercase text-slate-500">
              Row
            </div>
            {headerColumns.map((label, index) => {
              const isWalkwayColumn = walkwayColumnSet.has(index);
              return (
                <div key={`column-${label}`} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleColumn(index)}
                    disabled={isWalkwayColumn}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md border text-[11px] font-semibold transition",
                      isWalkwayColumn
                        ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-600"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
                    )}
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWalkwayColumn(index)}
                    className={cn(
                      "w-full rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      isWalkwayColumn
                        ? "border-amber-400 bg-amber-50 text-amber-600"
                        : "border-slate-200 bg-white text-slate-400 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600",
                    )}
                  >
                    {isWalkwayColumn ? "Walkway" : "Add gap"}
                  </button>
                </div>
              );
            })}

            {state.rows.map((row, rowIndex) => {
              const section = sectionMap.get(row.sectionId);
              const isSelected = row.id === selectedRowId;
              return (
                <Fragment key={row.id}>
                  <div
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md border text-xs font-semibold",
                      row.isWalkway
                        ? "border-dashed border-amber-300 bg-amber-50 text-amber-600"
                        : "border-slate-200 bg-slate-100 text-slate-700",
                      isSelected ? "ring-2 ring-indigo-400 ring-offset-1" : "",
                    )}
                  >
                    {row.label || String.fromCharCode(65 + rowIndex)}
                  </div>
                    {row.seats.map((seat, columnIndex) => {
                      const isColumnWalkway = walkwayColumnSet.has(columnIndex);
                      const seatNumber = getSeatNumberForColumn(row, columnIndex);
                      const isWalkwayCell = row.isWalkway || isColumnWalkway;
                      const isSeat = seat.enabled && !isWalkwayCell;
                      const cellTitle = isWalkwayCell
                        ? "Walkway"
                        : isSeat && seatNumber
                          ? `${row.label}${seatNumber}`
                          : "Toggle seat / aisle";
                      return (
                        <button
                          type="button"
                          key={`${row.id}-${seat.id}`}
                          onClick={() => toggleSeat(rowIndex, columnIndex)}
                          disabled={isWalkwayCell}
                          className={cn(
                            "flex h-8 w-full items-center justify-center rounded-md border text-[10px] font-semibold transition",
                            isWalkwayCell
                              ? "border-dashed border-amber-200 bg-amber-50 text-amber-400"
                              : isSeat
                                ? "border-transparent text-white shadow"
                                : "border-dashed border-slate-300 bg-slate-100 text-slate-400",
                            isSelected && !row.isWalkway && !isColumnWalkway ? "ring-1 ring-indigo-300" : "",
                          )}
                          style={isSeat ? { backgroundColor: section?.color ?? "#475569" } : undefined}
                          title={cellTitle}
                        >
                          {isSeat && seatNumber ? seatNumber : ""}
                        </button>
                      );
                    })}
                  </Fragment>
                );
              })}
          </div>
        </div>
      </div>

      {inspectorOpen && selectedRow ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Selected row</p>
              <h3 className="text-lg font-semibold text-slate-800">{selectedRow.label}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-0 text-slate-500 hover:bg-slate-100"
              onClick={() => setInspectorOpen(false)}
            >
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Label</label>
              <Input
                value={selectedRow.label}
                onChange={(event) => {
                  const label = event.target.value.slice(0, 6);
                  updateRow(selectedRow.id, (current) => ({ ...current, label }));
                }}
                className="mt-1 h-9"
              />
            </div>

            {!selectedRow.isWalkway ? (
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Starting seat number</label>
                <Input
                  type="number"
                  min={1}
                  value={selectedRow.startNumber}
                  onChange={(event) => {
                    const valueNumber = parseInt(event.target.value, 10);
                    updateRow(selectedRow.id, (current) => ({
                      ...current,
                      startNumber: Number.isNaN(valueNumber) ? 1 : Math.max(1, valueNumber),
                    }));
                  }}
                  className="mt-1 h-9"
                />
              </div>
            ) : null}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Section</label>
              <select
                value={selectedRow.sectionId}
                onChange={(event) => {
                  const sectionId = event.target.value;
                  updateRow(selectedRow.id, (current) => ({ ...current, sectionId }));
                }}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {state.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={selectedRow.isWalkway}
                onChange={() => toggleWalkway(selectedRow.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Mark as walkway / standing gap
            </label>

            {selectedRow.isWalkway ? (
              <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-600">
                Walkways help you keep realistic spacing between seat blocks and automatically reduce the total capacity.
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Row actions</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => moveRow(selectedRow.id, -1)} disabled={state.rows[0]?.id === selectedRow.id}>
                  <ArrowUp size={14} className="mr-1" /> Move up
                </Button>
                <Button variant="outline" size="sm" onClick={() => moveRow(selectedRow.id, 1)} disabled={state.rows[state.rows.length - 1]?.id === selectedRow.id}>
                  <ArrowDown size={14} className="mr-1" /> Move down
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicateRow(selectedRow.id)}>
                  <Copy size={14} className="mr-1" /> Duplicate
                </Button>
                <Button variant="outline" size="sm" onClick={() => addRowAfter(state.rows.findIndex((row) => row.id === selectedRow.id), false)}>
                  <Plus size={14} className="mr-1" /> Insert row below
                </Button>
                <Button variant="outline" size="sm" onClick={() => addRowAfter(state.rows.findIndex((row) => row.id === selectedRow.id), true)}>
                  <Plus size={14} className="mr-1" /> Insert walkway
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:border-red-400 hover:text-red-600"
                  onClick={() => removeRow(selectedRow.id)}
                  disabled={state.rows.length <= 1}
                >
                  <Trash2 size={14} className="mr-1" /> Remove row
                </Button>
              </div>
            </div>

            {summary.sections.length > 0 ? (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Sections</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  {summary.sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => renameSection(section.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-inner transition hover:border-slate-300"
                    >
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: section.color }}
                      />
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  </div>
);
};

export { TheaterLayoutDesigner, createDefaultState, createStateFromDimensions, buildSummary };

export default TheaterLayoutDesigner;
