"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { BanquetLayout } from "@/types/banquet";
import type { EventSeatMapSeat } from "@/types/seatMap";
import { EventSeatStatus } from "@/types/eventSeat";
import { cn } from "@/lib/utils/utils";

const sanitizeTableLabel = (value?: string | null) => {
  const cleaned = (value ?? 'T')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!cleaned) {
    return 'T';
  }
  if (cleaned.startsWith('TABLE')) {
    const suffix = cleaned.slice(5);
    return `T${suffix || ''}`;
  }
  return cleaned;
};

interface BanquetAdminSeatMapProps {
  layout: BanquetLayout;
  seats: EventSeatMapSeat[];
  selectedSeatIds: Set<string>;
  selectableStatuses: Set<EventSeatStatus>;
  tierColorMap: Map<string, string>;
  onToggleSeat: (seat: EventSeatMapSeat) => void;
}

const BanquetAdminSeatMap = ({
  layout,
  seats,
  selectedSeatIds,
  selectableStatuses,
  tierColorMap,
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

  const tableMetrics = useMemo(() => {
    if (!layout.tables.length) {
      return [] as Array<Required<BanquetLayout>["tables"][number]>;
    }
    return layout.tables.map(table => ({
      id: table.id,
      label: table.label,
      tierCode: table.tierCode,
      x: table.x ?? 0,
      y: table.y ?? 0,
      rotation: table.rotation ?? 0,
      radius: table.radius ?? 60,
      chairCount: table.chairCount ?? table.chairs?.length ?? 0,
      chairs: table.chairs ?? [],
    }));
  }, [layout.tables]);

  const isCompact = canvasWidth < 640;
  const padding = isCompact ? 80 : 120;
  const bounds = useMemo(() => {
    if (!tableMetrics.length) {
      return { minX: 0, maxX: canvasWidth, minY: 0, maxY: 520 };
    }
    return tableMetrics.reduce(
      (acc, table) => {
        const radius = table.radius ?? 60;
        const minX = table.x - radius;
        const maxX = table.x + radius;
        const minY = table.y - radius;
        const maxY = table.y + radius;
        return {
          minX: Math.min(acc.minX, minX),
          maxX: Math.max(acc.maxX, maxX),
          minY: Math.min(acc.minY, minY),
          maxY: Math.max(acc.maxY, maxY),
        };
      },
      { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY },
    );
  }, [tableMetrics, canvasWidth]);

  const viewWidth = Math.max(1, bounds.maxX - bounds.minX) + padding * 2;
  const viewHeight = Math.max(1, bounds.maxY - bounds.minY) + padding * 2;
  const derivedHeight = Math.max(420, Math.min(720, (viewHeight / viewWidth) * canvasWidth));
  const canvasHeight = Number.isFinite(derivedHeight) ? derivedHeight : 520;
  const scale = Math.min(canvasWidth / viewWidth, canvasHeight / viewHeight);
  const offsetX = (canvasWidth - viewWidth * scale) / 2 - (bounds.minX - padding) * scale;
  const offsetY = (canvasHeight - viewHeight * scale) / 2 - (bounds.minY - padding) * scale;

  if (!tableMetrics.length) {
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
      {tableMetrics.map(table => {
        const tableLabel = sanitizeTableLabel(table.label);
        const tableSeats = seatsByTable.get(tableLabel) ?? [];
        const radiusScaleAdjustment = isCompact ? 0.8 : 1;
        const scaledRadius = Math.max(32, table.radius * scale * radiusScaleAdjustment);
        const diameter = scaledRadius * 2;
        const tableX = offsetX + table.x * scale;
        const tableY = offsetY + table.y * scale;
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
                if (seat.status === EventSeatStatus.AVAILABLE && isSelected) {
                  return { bg: '#DBEAFE', border: '#2563EB', text: 'text-blue-900' };
                }
                if (seat.status === EventSeatStatus.SOLD) {
                  return { bg: '#FECACA', border: '#DC2626', text: 'text-red-800' };
                }
                if (seat.status === EventSeatStatus.RESERVED || seat.status === EventSeatStatus.BLOCKED) {
                  return { bg: '#FEE2E2', border: '#F87171', text: 'text-red-700' };
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
                    left: scaledRadius + scaledRadius * chairOffsetX,
                    top: scaledRadius + scaledRadius * chairOffsetY,
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
