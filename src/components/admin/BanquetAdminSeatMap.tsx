"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { BanquetLayout } from "@/types/banquet";
import type { EventSeatMapSeat } from "@/types/seatMap";
import { EventSeatStatus } from "@/types/eventSeat";
import { cn } from "@/lib/utils/utils";

const sanitizeTableLabel = (value?: string | null) => (value ?? 'TABLE')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '') || 'TABLE';

interface BanquetAdminSeatMapProps {
  layout: BanquetLayout;
  seats: EventSeatMapSeat[];
  selectedSeatIds: Set<string>;
  selectableStatuses: Set<EventSeatStatus>;
  tierColorMap: Map<string, string>;
  tierPriceMap: Map<string, number>;
  onToggleSeat: (seat: EventSeatMapSeat) => void;
}

const BanquetAdminSeatMap = ({
  layout,
  seats,
  selectedSeatIds,
  selectableStatuses,
  tierColorMap,
  tierPriceMap,
  onToggleSeat,
}: BanquetAdminSeatMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(920);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        setCanvasWidth(width);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const seatsByTable = useMemo(() => {
    const map = new Map<string, EventSeatMapSeat[]>();
    seats.forEach(seat => {
      const key = sanitizeTableLabel(seat.row);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(seat);
    });
    map.forEach(list => list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0)));
    return map;
  }, [seats]);

  const tables = useMemo(() => layout.tables ?? [], [layout.tables]);

  const tierLookup = useMemo(() => {
    const lookup = new Map<string, { color: string; price?: number }>();
    tierColorMap.forEach((color, tierCode) => lookup.set(tierCode, { color, price: tierPriceMap.get(tierCode) }));
    return lookup;
  }, [tierColorMap, tierPriceMap]);

  const isCompact = canvasWidth < 640;
  const padding = isCompact ? 80 : 120;
  const bounds = useMemo(() => {
    if (!tables.length) {
      return { minX: 0, maxX: canvasWidth, minY: 0, maxY: 520 };
    }
    return tables.reduce(
      (acc, table) => {
        const radius = table.radius ?? 60;
        const minX = (table.x ?? 0) - radius;
        const maxX = (table.x ?? 0) + radius;
        const minY = (table.y ?? 0) - radius;
        const maxY = (table.y ?? 0) + radius;
        return {
          minX: Math.min(acc.minX, minX),
          maxX: Math.max(acc.maxX, maxX),
          minY: Math.min(acc.minY, minY),
          maxY: Math.max(acc.maxY, maxY),
        };
      },
      { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY },
    );
  }, [tables, canvasWidth]);

  const viewWidth = Math.max(1, bounds.maxX - bounds.minX) + padding * 2;
  const viewHeight = Math.max(1, bounds.maxY - bounds.minY) + padding * 2;
  const canvasHeight = viewHeight;
  const scale = canvasWidth / Math.max(viewWidth, 1);
  const offsetX = (canvasWidth - viewWidth * scale) / 2 - (bounds.minX - padding) * scale;
  const offsetY = (canvasHeight - viewHeight * scale) / 2 - (bounds.minY - padding) * scale;

  if (!tables.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Banquet tables have not been configured yet.
      </div>
    );
  }

  const handleSeatClick = (seat: EventSeatMapSeat) => {
    if (!selectableStatuses.has(seat.status)) {
      return;
    }
    onToggleSeat(seat);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
      style={{ height: `${canvasHeight}px` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] [background-size:20px_20px]" />
      {tables.map(table => {
        const tableLabel = sanitizeTableLabel(table.label);
        const tableSeats = seatsByTable.get(tableLabel) ?? [];
        const radius = table.radius ?? 60;
        const scaledRadius = Math.max(32, radius * scale * (isCompact ? 0.8 : 1));
        const diameter = scaledRadius * 2;
        const tableX = offsetX + (table.x ?? 0) * scale;
        const tableY = offsetY + (table.y ?? 0) * scale;
        return (
          <div
            key={table.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-300 bg-white shadow"
            style={{
              left: tableX,
              top: tableY,
              width: diameter,
              height: diameter,
              transform: `translate(-50%, -50%) rotate(${table.rotation ?? 0}deg)`,
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-semibold text-slate-700">
              <span>{table.label}</span>
              <span className="text-[10px] text-slate-400">{tableSeats.length} seats</span>
            </div>
            {(table.chairs ?? []).map((chair, index) => {
              const seat = tableSeats[index];
              if (!seat) {
                return null;
              }
              const isSelected = selectedSeatIds.has(seat.seatId);
              const baseColor = seat.tierCode ? tierColorMap.get(seat.tierCode) ?? '#94A3B8' : '#94A3B8';
              const overrides = (() => {
                if (seat.status === EventSeatStatus.RESERVED) {
                  return { bg: '#FDE68A', border: '#F59E0B', text: 'text-amber-800' };
                }
                if (seat.status === EventSeatStatus.SOLD || seat.status === EventSeatStatus.BLOCKED) {
                  return { bg: '#FCA5A5', border: '#F87171', text: 'text-white' };
                }
                return {
                  bg: withAlpha(baseColor, isSelected ? 0.9 : 0.75),
                  border: baseColor,
                  text: 'text-white',
                };
              })();
              const seatSize = Math.max(isCompact ? 12 : 16, Math.min(28, scaledRadius * 0.4));
              const chairOffsetX = chair.offsetX ?? 0;
              const chairOffsetY = chair.offsetY ?? 0;
              return (
                <button
                  key={chair.id}
                  type="button"
                  className={cn(
                    'absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full border text-[9px] font-semibold transition',
                    selectableStatuses.has(seat.status)
                      ? 'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400'
                      : 'cursor-not-allowed opacity-60 focus:outline-none',
                    isSelected ? 'ring-2 ring-[#2F5F7F]' : '',
                    overrides.text,
                  )}
                  style={{
                    left: tableX + scaledRadius * chairOffsetX,
                    top: tableY + scaledRadius * chairOffsetY,
                    width: `${seatSize}px`,
                    height: `${seatSize}px`,
                    backgroundColor: overrides.bg,
                    borderColor: overrides.border,
                  }}
                  onClick={() => handleSeatClick(seat)}
                  aria-label={`${seat.label} · ${seat.tierCode ?? 'Seat'} · ${seat.status}`}
                >
                  {seat.number ?? chair.label ?? index + 1}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
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

export default BanquetAdminSeatMap;
