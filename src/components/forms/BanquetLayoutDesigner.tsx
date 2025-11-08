"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { banquetTablesToSeatPlan } from "@/lib/banquet";
import type { BanquetLayoutConfiguration, BanquetTable } from "@/types/banquetPlan";
import type { TheaterPlanSummary } from "@/types/theaterPlan";

const createTable = (index: number): BanquetTable => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  label: `Table ${index + 1}`,
  seatCount: 8,
  x: 0.5,
  y: 0.5,
  radius: 0.08,
});

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

interface BanquetLayoutDesignerProps {
  value?: BanquetLayoutConfiguration | null;
  onChange?: (configuration: BanquetLayoutConfiguration, seatPlan: TheaterPlanSummary) => void;
}

export const BanquetLayoutDesigner = ({ value, onChange }: BanquetLayoutDesignerProps) => {
  const [tables, setTables] = useState<BanquetTable[]>(() => value?.tables ?? [createTable(0)]);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragTableId, setDragTableId] = useState<string | null>(null);

  useEffect(() => {
    if (value?.tables) {
      setTables(value.tables);
    }
  }, [value?.tables]);

  useEffect(() => {
    const configuration: BanquetLayoutConfiguration = { kind: "banquet", tables };
    const summary = banquetTablesToSeatPlan(tables);
    onChange?.(configuration, summary);
  }, [tables, onChange]);

  const beginDrag = useCallback((tableId: string, clientX: number, clientY: number) => {
    const container = canvasRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const offsetX = clientX - bounds.left - table.x * bounds.width;
    const offsetY = clientY - bounds.top - table.y * bounds.height;

    const handleMove = (event: PointerEvent) => {
      const newX = clamp((event.clientX - bounds.left - offsetX) / bounds.width);
      const newY = clamp((event.clientY - bounds.top - offsetY) / bounds.height);
      setTables(prev => prev.map(t => (t.id === tableId ? { ...t, x: newX, y: newY } : t)));
    };

    const handleUp = () => {
      setDragTableId(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [tables]);

  const handlePointerDown = (tableId: string) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragTableId(tableId);
    beginDrag(tableId, event.clientX, event.clientY);
  };

  const addTable = () => {
    setTables(prev => [...prev, createTable(prev.length)]);
  };

  const updateTable = (tableId: string, updates: Partial<BanquetTable>) => {
    setTables(prev => prev.map(table => (table.id === tableId ? { ...table, ...updates } : table)));
  };

  const removeTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
  };

  const totalCapacity = useMemo(() => tables.reduce((sum, table) => sum + Math.max(table.seatCount, 0), 0), [tables]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-1/3 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Tables</h3>
              <button
                type="button"
                onClick={addTable}
                className="rounded-lg border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Add table
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {tables.map((table, index) => (
                <div key={table.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={table.label}
                      onChange={event => updateTable(table.id, { label: event.target.value || `Table ${index + 1}` })}
                      className="w-full rounded border border-slate-200 px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeTable(table.id)}
                      className="text-xs text-rose-500 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <label className="flex flex-col gap-1">
                      Seats
                      <input
                        type="number"
                        min={1}
                        value={table.seatCount}
                        onChange={event => updateTable(table.id, { seatCount: Math.max(1, Number(event.target.value)) })}
                        className="rounded border border-slate-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Size
                      <input
                        type="number"
                        min={0.04}
                        max={0.2}
                        step={0.01}
                        value={table.radius}
                        onChange={event => updateTable(table.id, { radius: clamp(Number(event.target.value), 0.04, 0.2) })}
                        className="rounded border border-slate-200 px-2 py-1"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">Total capacity: {totalCapacity}</p>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="relative aspect-square w-full" ref={canvasRef}>
            {tables.map(table => {
              const diameter = `${Math.max(6, table.radius * 100)}%`;
              return (
              <div
                key={table.id}
                onPointerDown={handlePointerDown(table.id)}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-move flex-col items-center justify-center rounded-full border-2 border-slate-300 bg-white text-xs font-semibold shadow ${
                  dragTableId === table.id ? 'border-emerald-500 shadow-lg' : ''
                }`}
                style={{
                  left: `${table.x * 100}%`,
                  top: `${table.y * 100}%`,
                  width: diameter,
                  height: diameter,
                }}
              >
                <span>{table.label}</span>
                <span className="text-[10px] text-slate-500">{table.seatCount} seats</span>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanquetLayoutDesigner;
