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

  const renderSeatIcon = (
    definition: HybridLayoutConfiguration["seats"][number],
    matchedSeat: EventSeat | EventSeatMapSeat | undefined,
    status: EventSeatStatus,
    isSelected: boolean,
  ) => {
    const palette = statusStyles[status];
    const baseWidth = Math.max(18, (definition.radius ?? 8) * 2);
    const backHeight = baseWidth * 0.55;
    const cushionHeight = baseWidth * 0.45;
    const tooltipParts: string[] = [];

    if (definition.label) {
      tooltipParts.push(definition.label);
    } else if (matchedSeat?.label) {
      tooltipParts.push(matchedSeat.label);
    }
    if (matchedSeat?.tierCode) {
      tooltipParts.push(`Tier ${matchedSeat.tierCode}`);
    }
    if (typeof matchedSeat?.price === 'number') {
      tooltipParts.push(`$${matchedSeat.price.toFixed(2)}`);
    }

    return (
      <g
        key={definition.id}
        transform={`translate(${definition.x}, ${definition.y}) rotate(${definition.rotation ?? 0})`}
        className={cn(!readOnly && selectable.has(status) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}
        onPointerDown={() => handleSeatClick(matchedSeat)}
      >
        <rect
          x={-baseWidth / 2 - 1}
          y={-backHeight / 2 - 4}
          width={baseWidth + 2}
          height={backHeight + cushionHeight + 10}
          rx={baseWidth / 6}
          fill="rgba(15,23,42,0.12)"
        />
        <rect
          x={-baseWidth / 2}
          y={-backHeight / 2 - 2}
          width={baseWidth}
          height={backHeight}
          rx={baseWidth / 6}
          fill={palette.fill}
          stroke={isSelected ? '#1d4ed8' : palette.border}
          strokeWidth={isSelected ? 3 : 1.5}
        />
        <rect
          x={-baseWidth / 2}
          y={cushionHeight / 4}
          width={baseWidth}
          height={cushionHeight}
          rx={baseWidth / 4}
          fill="#f8fafc"
          fillOpacity={0.9}
          stroke={palette.border}
          strokeWidth={0.8}
        />
        <rect
          x={-baseWidth / 2}
          y={cushionHeight + cushionHeight / 3}
          width={baseWidth}
          height={4}
          rx={2}
          fill={palette.border}
        />
        {tooltipParts.length > 0 ? <title>{tooltipParts.join(' · ')}</title> : null}
      </g>
    );
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
            {configuration.sections.map(section => {
              const width = section.width ?? 180;
              const height = section.height ?? 140;
              const radius = section.shape === 'circle' ? (section.radius ?? width / 2) : 12;
              const cx = section.shape === 'circle' ? section.x + radius : section.x + width / 2;
              const cy = section.shape === 'circle' ? section.y + radius : section.y + height / 2;
              const rotation = section.rotation ?? 0;
              return (
                <g key={section.id} transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                  <rect
                    x={section.x}
                    y={section.y}
                    width={width}
                    height={height}
                    rx={section.shape === 'circle' ? radius : 12}
                    ry={section.shape === 'circle' ? radius : 12}
                    fill={section.color ?? '#bae6fd'}
                    fillOpacity={0.35}
                    stroke={section.color ?? '#38bdf8'}
                    strokeWidth={2}
                  />
                  <text
                    x={section.x + width / 2}
                    y={section.y - 6}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#0f172a"
                    transform={`rotate(${-rotation}, ${section.x + width / 2}, ${section.y - 6})`}
                  >
                    {(section.label ?? 'Zone').toUpperCase()}
                  </text>
                </g>
              );
            })}

            {configuration.elements.map(element => {
              const width = element.width ?? 200;
              const height = element.height ?? 80;
              const label = element.label ?? element.type?.replace('-', ' ').toUpperCase();
              const textY = element.type === 'walkway' ? (element.y ?? 0) : ((element.y ?? 0) - height / 2 - 8);
              const rotation = element.rotation ?? 0;

              const elementNode = (
                <rect
                  key={element.id}
                  x={(element.x ?? 0) - width / 2}
                  y={(element.y ?? 0) - height / 2}
                  width={width}
                  height={height}
                  rx={10}
                  ry={10}
                  fill={element.color ?? '#0f172a'}
                  opacity={0.85}
                />
              );

              return (
                <g key={element.id} transform={`rotate(${rotation}, ${element.x ?? 0}, ${element.y ?? 0})`}>
                  {elementNode}
                  <text
                    x={element.x ?? 0}
                    y={textY}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={element.type === 'walkway' ? '#0f172a' : '#1e293b'}
                    transform={`rotate(${-rotation}, ${element.x ?? 0}, ${textY})`}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {configuration.seats.map((definition, index) => {
              const matchedSeat = findSeatMatch(definition, index);
              const status = matchedSeat?.status ?? EventSeatStatus.AVAILABLE;
              const isSelected = !!matchedSeat && selectedSeatIds?.has(matchedSeat.seatId ?? matchedSeat.eventSeatId ?? "");
              return renderSeatIcon(definition, matchedSeat, status, isSelected);
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default HybridSeatMap;
