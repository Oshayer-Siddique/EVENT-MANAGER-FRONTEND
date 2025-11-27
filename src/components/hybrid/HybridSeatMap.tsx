"use client";

import { useMemo } from "react";
import type { EventSeat } from "@/types/eventSeat";
import { EventSeatStatus } from "@/types/eventSeat";
import type { EventSeatMapSeat } from "@/types/seatMap";
import type { HybridLayoutConfiguration } from "@/types/hybrid";
import { cn } from "@/lib/utils/utils";

interface HybridSeatMapProps {
  configuration: HybridLayoutConfiguration | null;
  seats: Array<EventSeat | EventSeatMapSeat>;
  selectedSeatIds?: Set<string>;
  selectableStatuses?: Set<EventSeatStatus>;
  onToggleSeat?: (seat: EventSeat | EventSeatMapSeat) => void;
  readOnly?: boolean;
  title?: string;
}

const statusStyles = {
  [EventSeatStatus.AVAILABLE]: { fill: "#0ea5e9", border: "#0369a1" },
  [EventSeatStatus.RESERVED]: { fill: "#facc15", border: "#ca8a04" },
  [EventSeatStatus.SOLD]: { fill: "#ef4444", border: "#b91c1c" },
  [EventSeatStatus.BLOCKED]: { fill: "#94a3b8", border: "#475569" },
};

const normalizeKey = (value?: string | null) => (value ? value.trim().toLowerCase() : null);
const buildRowKey = (row?: string | null, number?: number | null) => {
  if (!row && number == null) {
    return null;
  }
  return `${row ?? ''}-${number ?? ''}`.trim().toLowerCase();
};

const HybridSeatMap = ({ configuration, seats, selectedSeatIds, selectableStatuses, onToggleSeat, readOnly, title }: HybridSeatMapProps) => {
  const sectionLabelMap = useMemo(() => {
    if (!configuration) return new Map<string, string>();
    return new Map(configuration.sections.map(section => [section.id, section.label ?? '']));
  }, [configuration]);

  const seatLookup = useMemo(() => {
    const map = new Map<string, EventSeat | EventSeatMapSeat>();
    seats.forEach(seat => {
      const labelKey = normalizeKey(seat.label);
      if (labelKey) {
        map.set(labelKey, seat);
      }

      const rowKey = buildRowKey(seat.row ?? (seat as EventSeat).type ?? null, seat.number ?? null);
      if (rowKey) {
        map.set(rowKey, seat);
      }

      if (seat.seatId) {
        map.set(seat.seatId, seat);
      }

      if ('eventSeatId' in seat && seat.eventSeatId) {
        map.set(seat.eventSeatId, seat);
      }
    });
    return map;
  }, [seats]);

  const findSeatMatch = (definition: HybridLayoutConfiguration["seats"][number], definitionIndex: number) => {
    const lookupKeys = [
      normalizeKey(definition.label),
      definition.id,
      buildRowKey(definition.rowLabel, definition.number ?? null),
      definition.sectionId ? buildRowKey(sectionLabelMap.get(definition.sectionId), definition.number ?? null) : null,
    ].filter(Boolean) as string[];

    for (const key of lookupKeys) {
      const candidate = seatLookup.get(key);
      if (candidate) {
        return candidate;
      }
    }

    const normalizedDefinitionLabel = normalizeKey(definition.label);
    const normalizedRowKey = buildRowKey(definition.rowLabel, definition.number ?? null);
    const normalizedSectionKey = definition.sectionId
      ? buildRowKey(sectionLabelMap.get(definition.sectionId), definition.number ?? null)
      : null;

    const matchedByScan = seats.find(seat => {
      if (normalizedDefinitionLabel && normalizeKey(seat.label) === normalizedDefinitionLabel) {
        return true;
      }
      if (definition.id && (seat.seatId === definition.id || ('eventSeatId' in seat && seat.eventSeatId === definition.id))) {
        return true;
      }
      if (normalizedRowKey && buildRowKey(seat.row ?? (seat as EventSeat).type ?? null, seat.number ?? null) === normalizedRowKey) {
        return true;
      }
      if (normalizedSectionKey && buildRowKey((seat as EventSeat).type ?? null, seat.number ?? null) === normalizedSectionKey) {
        return true;
      }
      return false;
    });

    if (matchedByScan) {
      return matchedByScan;
    }

    return seats[definitionIndex];
  };

  if (!configuration) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        The hybrid layout has not been saved yet.
      </div>
    );
  }

  const selectable = selectableStatuses ?? new Set([EventSeatStatus.AVAILABLE]);

  const handleSeatClick = (seat: EventSeat | EventSeatMapSeat | undefined) => {
    if (!seat || readOnly) return;
    if (!selectable.has(seat.status)) return;
    onToggleSeat?.(seat);
  };

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-semibold text-slate-800">{title}</p> : null}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="relative w-full overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <svg
            width={configuration.canvas.width}
            height={configuration.canvas.height}
            className="block h-[500px] w-full"
            viewBox={`0 0 ${configuration.canvas.width} ${configuration.canvas.height}`}
          >
            <rect width="100%" height="100%" fill="#f8fafc" />
            {configuration.sections.map(section => (
              <rect
                key={section.id}
                x={section.x}
                y={section.y}
                width={section.width ?? 180}
                height={section.height ?? 140}
                rx={section.shape === 'circle' ? (section.radius ?? 90) : 12}
                ry={section.shape === 'circle' ? (section.radius ?? 90) : 12}
                fill={section.color ?? '#bae6fd'}
                fillOpacity={0.35}
                stroke={section.color ?? '#38bdf8'}
                strokeWidth={2}
              />
            ))}

            {configuration.elements.map(element => (
              <rect
                key={element.id}
                x={(element.x ?? 0) - (element.width ?? 200) / 2}
                y={(element.y ?? 0) - (element.height ?? 80) / 2}
                width={element.width ?? 200}
                height={element.height ?? 80}
                rx={10}
                ry={10}
                fill={element.color ?? '#0f172a'}
                opacity={0.85}
              />
            ))}

            {configuration.seats.map((definition, index) => {
              const matchedSeat = findSeatMatch(definition, index);
              const status = matchedSeat?.status ?? EventSeatStatus.AVAILABLE;
              const palette = statusStyles[status];
              const isSelected = !!matchedSeat && selectedSeatIds?.has(matchedSeat.seatId ?? matchedSeat.eventSeatId ?? "");
              return (
                <circle
                  key={definition.id}
                  cx={definition.x}
                  cy={definition.y}
                  r={isSelected ? 9 : 7}
                  fill={palette.fill}
                  stroke={isSelected ? '#1d4ed8' : palette.border}
                  strokeWidth={isSelected ? 3 : 2}
                  className={cn(!readOnly && selectable.has(status) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}
                  onPointerDown={() => handleSeatClick(matchedSeat)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default HybridSeatMap;
