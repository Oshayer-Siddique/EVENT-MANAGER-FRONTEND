'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

import type { BanquetChair, BanquetLayout, BanquetTable } from '@/types/banquet';
import { Button } from '@/components/ui/button';

const CANVAS_HEIGHT = 520;

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const buildChairs = (count: number): BanquetChair[] => {
  const chairs: BanquetChair[] = [];
  const total = Math.max(1, count);
  for (let i = 0; i < total; i++) {
    const angle = (360 / total) * i;
    const radians = (angle * Math.PI) / 180;
    chairs.push({
      id: generateId(),
      label: `Chair ${i + 1}`,
      angle,
      offsetX: Math.cos(radians),
      offsetY: Math.sin(radians),
    });
  }
  return chairs;
};

const buildTable = (index: number): BanquetTable => ({
  id: generateId(),
  label: `Table ${index}`,
  x: 160 + index * 25,
  y: 140 + index * 25,
  rotation: 0,
  radius: 60,
  chairCount: 8,
  chairs: buildChairs(8),
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface BanquetLayoutBuilderProps {
  value: BanquetLayout;
  onChange: (layout: BanquetLayout) => void;
}

const BanquetLayoutBuilder = ({ value, onChange }: BanquetLayoutBuilderProps) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(value.tables[0]?.id ?? null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ tableId: string; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  useEffect(() => {
    if (!value.tables.some(table => table.id === selectedTableId)) {
      setSelectedTableId(value.tables[0]?.id ?? null);
    }
  }, [value.tables, selectedTableId]);

  const updateLayout = (updater: (layout: BanquetLayout) => BanquetLayout) => {
    onChange(updater(value));
  };

  const addTable = () => {
    updateLayout(prev => {
      const table = buildTable(prev.tables.length + 1);
      setSelectedTableId(table.id);
      return { tables: [...prev.tables, table] };
    });
  };

  const resetLayout = () => {
    onChange({ tables: [] });
    setSelectedTableId(null);
  };

  const updateTable = (tableId: string, updater: (table: BanquetTable) => BanquetTable) => {
    updateLayout(prev => ({
      tables: prev.tables.map(table => (table.id === tableId ? updater(table) : table)),
    }));
  };

  const removeTable = (id: string) => {
    updateLayout(prev => ({ tables: prev.tables.filter(table => table.id !== id) }));
    setSelectedTableId(prev => (prev === id ? null : prev));
  };

  const regenerateChairs = (table: BanquetTable, count: number) => ({
    ...table,
    chairCount: count,
    chairs: buildChairs(count),
  });

  const handlePointerDown = (tableId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    dragState.current = {
      tableId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: value.tables.find(table => table.id === tableId)?.x ?? 0,
      baseY: value.tables.find(table => table.id === tableId)?.y ?? 0,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragState.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    const nextX = clamp(dragState.current.baseX + deltaX, 60, rect.width - 60);
    const nextY = clamp(dragState.current.baseY + deltaY, 60, CANVAS_HEIGHT - 60);
    updateTable(dragState.current.tableId, table => ({ ...table, x: nextX, y: nextY }));
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragState.current = null;
  };

  useEffect(() => () => handlePointerUp(), []);

  const selectedTable = useMemo(() => value.tables.find(table => table.id === selectedTableId), [value.tables, selectedTableId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={addTable} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add table
        </Button>
        <Button type="button" variant="outline" onClick={resetLayout} className="inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_320px]">
        <div>
          <div
            ref={canvasRef}
            className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] [background-size:20px_20px]" />
            {value.tables.map(table => {
              const isSelected = table.id === selectedTableId;
              return (
                <div
                  key={table.id}
                  className={`absolute h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow transition ${
                    isSelected ? 'border-[#2F5F7F] ring-4 ring-[#2F5F7F]/20' : 'border-slate-300'
                  }`}
                  style={{ left: table.x, top: table.y, transform: `translate(-50%, -50%) rotate(${table.rotation ?? 0}deg)` }}
                  onPointerDown={event => {
                    setSelectedTableId(table.id);
                    handlePointerDown(table.id, event);
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-800">{table.label}</span>
                  </div>
                  {table.chairs.map(chair => (
                    <div
                      key={chair.id}
                      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white"
                      style={{
                        left: 60 + (table.radius ?? 60) * chair.offsetX,
                        top: 60 + (table.radius ?? 60) * chair.offsetY,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Table details</h3>
          {selectedTable ? (
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs uppercase text-slate-500">Label</label>
                <input
                  type="text"
                  value={selectedTable.label}
                  onChange={event => updateTable(selectedTable.id, table => ({ ...table, label: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Chairs</label>
                <input
                  type="range"
                  min={2}
                  max={18}
                  value={selectedTable.chairCount}
                  onChange={event =>
                    updateTable(selectedTable.id, table => regenerateChairs(table, Number(event.target.value)))
                  }
                  className="mt-2 w-full"
                />
                <p className="text-xs text-slate-500">{selectedTable.chairCount} seats</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Rotation</label>
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={selectedTable.rotation}
                  onChange={event => updateTable(selectedTable.id, table => ({ ...table, rotation: Number(event.target.value) }))}
                  className="mt-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Radius</label>
                <input
                  type="range"
                  min={40}
                  max={90}
                  value={selectedTable.radius}
                  onChange={event => updateTable(selectedTable.id, table => ({ ...table, radius: Number(event.target.value) }))}
                  className="mt-2 w-full"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeTable(selectedTable.id)}
                className="inline-flex items-center gap-2 text-rose-600"
              >
                <Trash2 className="h-4 w-4" /> Remove table
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a table to edit its details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BanquetLayoutBuilder;
