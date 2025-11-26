'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { BanquetLayout } from '@/types/banquet';
import { EventSeatStatus } from '@/types/eventSeat';
import type { EventSeat } from '@/types/eventSeat';
import type { EventTicketTier } from '@/types/event';
import { cn } from '@/lib/utils/utils';

const TIER_COLORS = [
  '#2F5F7F',
  '#0EA5E9',
  '#EC4899',
  '#22C55E',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#FACC15',
];

interface BanquetSeatMapProps {
  layout: BanquetLayout;
  seats: EventSeat[];
  selectedSeats: EventSeat[];
  onSeatSelect: (seat: EventSeat) => void;
  tiers: EventTicketTier[];
}

const sanitizeLabel = (value?: string | null) => (value ?? 'TABLE')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '') || 'TABLE';

const statusStyles: Record<EventSeatStatus, { className: string }> = {
  AVAILABLE: { className: '' },
  BLOCKED: { className: 'cursor-not-allowed opacity-90' },
  RESERVED: { className: 'cursor-not-allowed opacity-90' },
  SOLD: { className: 'cursor-not-allowed opacity-90' },
};

const BanquetSeatMap = ({ layout, seats, selectedSeats, onSeatSelect, tiers }: BanquetSeatMapProps) => {
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
    const map = new Map<string, EventSeat[]>();
    seats.forEach(seat => {
      const key = sanitizeLabel(seat.row);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(seat);
    });
    map.forEach(list => list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0)));
    return map;
  }, [seats]);

  const { tierLookup, tierColorMap } = useMemo(() => {
    const lookup = new Map<string, EventTicketTier>();
    const colorMap = new Map<string, string>();
    tiers.forEach((tier, index) => {
      lookup.set(tier.tierCode, tier);
      colorMap.set(tier.tierCode, TIER_COLORS[index % TIER_COLORS.length]);
    });
    return { tierLookup: lookup, tierColorMap: colorMap };
  }, [tiers]);

  const tableMetrics = useMemo(() => {
    if (!layout.tables.length) {
      return null;
    }
    return layout.tables.map(table => {
      const radius = table.radius ?? 60;
      return {
        id: table.id,
        radius,
        x: table.x ?? 0,
        y: table.y ?? 0,
        rotation: table.rotation ?? 0,
        label: table.label,
        chairs: table.chairs ?? [],
      };
    });
  }, [layout.tables]);

  const isCompact = canvasWidth < 640;
  const padding = isCompact ? 80 : 120;
  const bounds = useMemo(() => {
    if (!tableMetrics || tableMetrics.length === 0) {
      return {
        minX: 0,
        maxX: canvasWidth,
        minY: 0,
        maxY: 520,
      };
    }
    return tableMetrics.reduce(
      (acc, table) => {
        const minX = table.x - table.radius;
        const maxX = table.x + table.radius;
        const minY = table.y - table.radius;
        const maxY = table.y + table.radius;
        return {
          minX: Math.min(acc.minX, minX),
          maxX: Math.max(acc.maxX, maxX),
          minY: Math.min(acc.minY, minY),
          maxY: Math.max(acc.maxY, maxY),
        };
      },
      { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY }
    );
  }, [tableMetrics, canvasWidth]);

  const viewWidth = Math.max(1, bounds.maxX - bounds.minX) + padding * 2;
  const viewHeight = Math.max(1, bounds.maxY - bounds.minY) + padding * 2;
  const derivedHeight = Math.max(420, Math.min(720, (viewHeight / viewWidth) * canvasWidth));
  const canvasHeight = Number.isFinite(derivedHeight) ? derivedHeight : 520;
  const scale = Math.min(canvasWidth / viewWidth, canvasHeight / viewHeight);
  const offsetX = (canvasWidth - viewWidth * scale) / 2 - (bounds.minX - padding) * scale;
  const offsetY = (canvasHeight - viewHeight * scale) / 2 - (bounds.minY - padding) * scale;

  const handleSeatClick = (seat: EventSeat) => {
    if (seat.status !== EventSeatStatus.AVAILABLE) {
      return;
    }
    onSeatSelect(seat);
  };

  if (!layout.tables.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Banquet layout has no tables yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-800">Tier legend</p>
          <p className="text-xs text-slate-500">
            Colors indicate the ticket tier for each chair. Red seats are pre-reserved, blocked, or already sold.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tiers.map((tier, index) => {
              const color = tierColorMap.get(tier.tierCode) ?? TIER_COLORS[index % TIER_COLORS.length];
              return (
                <span
                  key={tier.tierCode}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-800">{tier.tierName}</span>
                  <span className="text-[11px] text-slate-500">${tier.price.toFixed(2)}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        style={{ height: `${canvasHeight}px` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] [background-size:20px_20px]" />
        {tableMetrics?.map(table => {
          const normalizedLabel = sanitizeLabel(table.label);
          const tableSeats = seatsByTable.get(normalizedLabel) ?? [];
          const chairs = table.chairs;
          const baseRadius = table.radius;
          const radiusScaleAdjustment = isCompact ? 0.8 : 1;
          const scaledRadius = Math.max(32, baseRadius * scale * radiusScaleAdjustment);
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
                transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-semibold text-slate-700">
                <span>{table.label}</span>
                <span className="text-[10px] text-slate-400">{tableSeats.length} seats</span>
              </div>

              {chairs.map((chair, index) => {
                const seat = tableSeats[index];
                if (!seat) {
                  return null;
                }
                const isSelected = selectedSeats.some(selected => selected.eventSeatId === seat.eventSeatId);
                const tierColor = seat.tierCode ? tierColorMap.get(seat.tierCode) ?? '#94A3B8' : '#94A3B8';
                const colorOverrides = (() => {
                  if (seat.status === EventSeatStatus.SOLD) {
                    return { bg: '#FECACA', border: '#DC2626' };
                  }
                  if (seat.status === EventSeatStatus.RESERVED || seat.status === EventSeatStatus.BLOCKED) {
                    return { bg: '#FEE2E2', border: '#F87171' };
                  }
                  return { bg: withAlpha(tierColor, 0.2), border: tierColor };
                })();
                const seatBg = colorOverrides.bg;
                const borderColor = colorOverrides.border;
                const statusClass = statusStyles[seat.status]?.className;
                const tier = seat.tierCode ? tierLookup.get(seat.tierCode) : undefined;
                const center = scaledRadius;
                const seatSize = Math.max(isCompact ? 12 : 16, Math.min(28, scaledRadius * 0.4));
                return (
                  <button
                    key={chair.id}
                    type="button"
                    className={cn(
                      'absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full border text-[9px] font-semibold',
                      seat.status === EventSeatStatus.AVAILABLE
                        ? 'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400'
                        : 'focus:outline-none',
                      statusClass,
                      isSelected && seat.status === EventSeatStatus.AVAILABLE ? 'ring-2 ring-[#2F5F7F]' : '',
                    )}
                    style={{
                      left: center + (scaledRadius * (chair.offsetX ?? 0)),
                      top: center + (scaledRadius * (chair.offsetY ?? 0)),
                      backgroundColor: seatBg,
                      borderColor,
                      width: `${seatSize}px`,
                      height: `${seatSize}px`,
                    }}
                    onClick={() => handleSeatClick(seat)}
                    aria-label={`${seat.label} · ${tier?.tierName ?? seat.tierCode ?? 'Seat'} · ${seat.status}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">How to book</p>
        <p>Select a chair on any table to add it to your cart. Each circle represents a guest chair.</p>
      </div>
    </div>
  );
};

export default BanquetSeatMap;

const withAlpha = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(Math.max(alpha, 0), 1)})`;
};
