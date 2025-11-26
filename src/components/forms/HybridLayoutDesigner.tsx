"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Circle,
  DoorClosed,
  DoorOpen,
  Grid2x2,
  LayoutTemplate,
  MousePointer2,
  Shapes,
  Square,
  Trash2,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  HybridElement,
  HybridLayoutConfiguration,
  HybridSeat,
  HybridSection,
} from "@/types/hybrid";

const DEFAULT_SECTION_COLORS = ["#0EA5E9", "#EC4899", "#22C55E", "#F97316", "#6366F1"];
const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type Selection =
  | { kind: "section"; id: string }
  | { kind: "element"; id: string }
  | { kind: "seat"; id: string };

interface HybridLayoutDesignerProps {
  value: HybridLayoutConfiguration;
  onChange: (layout: HybridLayoutConfiguration) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const HybridLayoutDesigner = ({ value, onChange }: HybridLayoutDesignerProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    selection: Selection;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [seatGrid, setSeatGrid] = useState({ rows: 4, cols: 8 });

  const updateLayout = useCallback(
    (updater: (layout: HybridLayoutConfiguration) => HybridLayoutConfiguration) => {
      onChange(updater(value));
    },
    [onChange, value],
  );

  const select = (next: Selection | null) => {
    setSelection(next);
  };

  const handlePointerDown = (event: React.PointerEvent, target: Selection) => {
    select(target);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    let baseX = 0;
    let baseY = 0;

    if (target.kind === "section") {
      const section = value.sections.find(section => section.id === target.id);
      if (!section) return;
      baseX = section.x;
      baseY = section.y;
    } else if (target.kind === "element") {
      const element = value.elements.find(el => el.id === target.id);
      if (!element) return;
      baseX = element.x;
      baseY = element.y;
    } else {
      const seat = value.seats.find(seat => seat.id === target.id);
      if (!seat) return;
      baseX = seat.x;
      baseY = seat.y;
    }

    dragRef.current = {
      selection: target,
      offsetX: pointerX - baseX,
      offsetY: pointerY - baseY,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const x = clamp(pointerX - dragRef.current.offsetX, 0, value.canvas.width);
    const y = clamp(pointerY - dragRef.current.offsetY, 0, value.canvas.height);

    updateLayout(previous => {
      const next: HybridLayoutConfiguration = JSON.parse(JSON.stringify(previous));
      const target = dragRef.current!.selection;
      if (target.kind === "section") {
        const section = next.sections.find(section => section.id === target.id);
        if (section) {
          section.x = x;
          section.y = y;
        }
      } else if (target.kind === "element") {
        const element = next.elements.find(element => element.id === target.id);
        if (element) {
          element.x = x;
          element.y = y;
        }
      } else {
        const seat = next.seats.find(seat => seat.id === target.id);
        if (seat) {
          seat.x = x;
          seat.y = y;
        }
      }
      return next;
    });
  };

  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    dragRef.current = null;
  };

  const addSection = (shape: "rectangle" | "circle") => {
    updateLayout(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: createId(),
          label: shape === "rectangle" ? "Zone" : "Circle",
          shape,
          x: value.canvas.width / 2 - 80,
          y: value.canvas.height / 2 - 60,
          width: shape === "rectangle" ? 180 : undefined,
          height: shape === "rectangle" ? 140 : undefined,
          radius: shape === "circle" ? 90 : undefined,
          rotation: 0,
          color: DEFAULT_SECTION_COLORS[(prev.sections.length + 1) % DEFAULT_SECTION_COLORS.length],
        } satisfies HybridSection,
      ],
    }));
  };

  const addElement = (type: HybridElement["type"], label?: string) => {
    updateLayout(prev => ({
      ...prev,
      elements: [
        ...prev.elements,
        {
          id: createId(),
          type,
          label: label ?? type.replace("-", " ").replace(/\b\w/g, char => char.toUpperCase()),
          x: value.canvas.width / 2,
          y: 60,
          width: type === "stage" ? 260 : 140,
          height: type === "walkway" ? 60 : 80,
          color: type === "stage" ? "#0f172a" : type.includes("door") ? "#0891b2" : "#475569",
        } satisfies HybridElement,
      ],
    }));
  };

  const removeSelection = () => {
    if (!selection) return;
    updateLayout(prev => {
      if (selection.kind === "section") {
        return {
          ...prev,
          sections: prev.sections.filter(section => section.id !== selection.id),
          seats: prev.seats.filter(seat => seat.sectionId !== selection.id),
        };
      }
      if (selection.kind === "element") {
        return {
          ...prev,
          elements: prev.elements.filter(element => element.id !== selection.id),
        };
      }
      return {
        ...prev,
        seats: prev.seats.filter(seat => seat.id !== selection.id),
      };
    });
    setSelection(null);
  };

  const generateSeatsForSection = (sectionId: string, rows: number, cols: number) => {
    const section = value.sections.find(section => section.id === sectionId);
    if (!section || rows <= 0 || cols <= 0) return;
    const seats: HybridSeat[] = [];
    const width = section.width ?? section.radius ?? 180;
    const height = section.height ?? section.radius ?? 140;
    const startX = section.x;
    const startY = section.y;
    const padding = 20;
    const usableWidth = Math.max(20, width - padding * 2);
    const usableHeight = Math.max(20, height - padding * 2);
    const stepX = usableWidth / cols;
    const stepY = usableHeight / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        seats.push({
          id: createId(),
          sectionId,
          rowLabel: section.label || "ZONE",
          number: row * cols + col + 1,
          x: startX + padding + col * stepX + stepX / 2,
          y: startY + padding + row * stepY + stepY / 2,
          type: "STANDARD",
        });
      }
    }

    updateLayout(prev => ({
      ...prev,
      seats: prev.seats.filter(seat => seat.sectionId !== sectionId).concat(seats),
    }));
  };

  const selectedSection = useMemo(() => {
    if (selection?.kind !== "section") return undefined;
    return value.sections.find(section => section.id === selection.id);
  }, [selection, value.sections]);

  const selectedElement = useMemo(() => {
    if (selection?.kind !== "element") return undefined;
    return value.elements.find(element => element.id === selection.id);
  }, [selection, value.elements]);

  const selectedSeat = useMemo(() => {
    if (selection?.kind !== "seat") return undefined;
    return value.seats.find(seat => seat.id === selection.id);
  }, [selection, value.seats]);

  const totalSeats = value.seats.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => addSection("rectangle")} className="inline-flex items-center gap-2">
          <Square className="h-4 w-4" /> Section
        </Button>
        <Button type="button" onClick={() => addSection("circle")} className="inline-flex items-center gap-2">
          <Circle className="h-4 w-4" /> Circle zone
        </Button>
        <Button type="button" onClick={() => addElement("stage")} className="inline-flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" /> Stage
        </Button>
        <Button type="button" onClick={() => addElement("walkway")} className="inline-flex items-center gap-2">
          <Shapes className="h-4 w-4" /> Walkway
        </Button>
        <Button type="button" onClick={() => addElement("entry-door", "Entry")} className="inline-flex items-center gap-2">
          <DoorOpen className="h-4 w-4" /> Entry
        </Button>
        <Button type="button" onClick={() => addElement("exit-door", "Exit")} className="inline-flex items-center gap-2">
          <DoorClosed className="h-4 w-4" /> Exit
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!selection}
          onClick={removeSelection}
          className="inline-flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Remove
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MousePointer2 className="h-3.5 w-3.5" /> Drag any section, element, or seat to reposition.
            </span>
            <span className="inline-flex items-center gap-1">
              <Grid2x2 className="h-3.5 w-3.5" /> Seats: {totalSeats}
            </span>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <svg
              ref={svgRef}
              width={value.canvas.width}
              height={value.canvas.height}
              className="block h-[520px] w-full"
              viewBox={`0 0 ${value.canvas.width} ${value.canvas.height}`}
            >
              <defs>
                <pattern id="hybrid-grid" width={value.canvas.gridSize ?? 20} height={value.canvas.gridSize ?? 20} patternUnits="userSpaceOnUse">
                  <rect width="100%" height="100%" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hybrid-grid)" />

              {value.sections.map(section => {
                const isSelected = selection?.kind === "section" && selection.id === section.id;
                const radius = section.radius ?? 90;
                const width = section.width ?? (section.shape === "circle" ? radius * 2 : 180);
                const height = section.height ?? (section.shape === "circle" ? radius * 2 : 140);
                const cx = section.shape === "circle" ? section.x + radius : section.x + width / 2;
                const cy = section.shape === "circle" ? section.y + radius : section.y + height / 2;
                const rotation = section.rotation ?? 0;

                return (
                  <g
                    key={section.id}
                    onPointerDown={event => handlePointerDown(event, { kind: "section", id: section.id })}
                    transform={`rotate(${rotation}, ${cx}, ${cy})`}
                  >
                    {section.shape === "circle" ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={section.color ?? "#cbd5f5"}
                        fillOpacity={0.35}
                        stroke={isSelected ? "#0f172a" : section.color ?? "#64748b"}
                        strokeWidth={isSelected ? 4 : 2}
                      />
                    ) : (
                      <rect
                        x={section.x}
                        y={section.y}
                        width={width}
                        height={height}
                        fill={section.color ?? "#cbd5f5"}
                        fillOpacity={0.35}
                        stroke={isSelected ? "#0f172a" : section.color ?? "#64748b"}
                        strokeWidth={isSelected ? 4 : 2}
                      />
                    )}
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#0f172a"
                    >
                      {section.label}
                    </text>
                  </g>
                );
              })}

              {value.elements.map(element => {
                const isSelected = selection?.kind === "element" && selection.id === element.id;
                const width = element.width ?? 200;
                const height = element.height ?? 80;
                return (
                  <g
                    key={element.id}
                    onPointerDown={event => handlePointerDown(event, { kind: "element", id: element.id })}
                    transform={`rotate(${element.rotation ?? 0}, ${element.x}, ${element.y})`}
                  >
                    <rect
                      x={element.x - width / 2}
                      y={element.y - height / 2}
                      width={width}
                      height={height}
                      rx={12}
                      ry={12}
                      fill={element.color ?? "#1e293b"}
                      opacity={isSelected ? 0.9 : 0.75}
                    />
                    <text
                      x={element.x}
                      y={element.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#fff"
                    >
                      {element.label ?? element.type}
                    </text>
                  </g>
                );
              })}

              {value.seats.map(seat => {
                const isSelected = selection?.kind === "seat" && selection.id === seat.id;
                return (
                  <g
                    key={seat.id}
                    onPointerDown={event => handlePointerDown(event, { kind: "seat", id: seat.id })}
                    transform={`rotate(${seat.rotation ?? 0}, ${seat.x}, ${seat.y})`}
                  >
                    <circle
                      cx={seat.x}
                      cy={seat.y}
                      r={isSelected ? 9 : 7}
                      fill={isSelected ? "#0ea5e9" : "#0f172a"}
                      fillOpacity={0.9}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold text-slate-900">Details</h3>
          {!selection && (
            <p className="text-slate-600">
              Select a section, element, or seat to edit its properties. Use the toolbar to add new zones, seats, or
              fixtures.
            </p>
          )}

          {selectedSection && (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase text-slate-600">Label</label>
                <input
                  type="text"
                  value={selectedSection.label}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      sections: prev.sections.map(section =>
                        section.id === selectedSection.id ? { ...section, label: event.target.value } : section,
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </div>
              {selectedSection.shape === 'circle' ? (
                <div>
                  <label className="text-xs uppercase text-slate-600">Radius</label>
                  <input
                    type="number"
                    min={10}
                    value={selectedSection.radius ?? 90}
                    onChange={event =>
                      updateLayout(prev => ({
                        ...prev,
                        sections: prev.sections.map(section =>
                          section.id === selectedSection.id ? { ...section, radius: Number(event.target.value), width: undefined, height: undefined } : section,
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs uppercase text-slate-600">Width</label>
                    <input
                      type="number"
                      value={selectedSection.width ?? 180}
                      onChange={event =>
                        updateLayout(prev => ({
                          ...prev,
                          sections: prev.sections.map(section =>
                            section.id === selectedSection.id ? { ...section, width: Number(event.target.value) } : section,
                          ),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-slate-600">Height</label>
                    <input
                      type="number"
                      value={selectedSection.height ?? 140}
                      onChange={event =>
                        updateLayout(prev => ({
                          ...prev,
                          sections: prev.sections.map(section =>
                            section.id === selectedSection.id ? { ...section, height: Number(event.target.value) } : section,
                          ),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs uppercase text-slate-600">Color</label>
                <input
                  type="color"
                  value={selectedSection.color ?? "#0ea5e9"}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      sections: prev.sections.map(section =>
                        section.id === selectedSection.id ? { ...section, color: event.target.value } : section,
                      ),
                    }))
                  }
                  className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-600">Rotation ({Math.round(selectedSection.rotation ?? 0)}°)</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={selectedSection.rotation ?? 0}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      sections: prev.sections.map(section =>
                        section.id === selectedSection.id ? { ...section, rotation: Number(event.target.value) } : section,
                      ),
                    }))
                  }
                  className="mt-1 w-full"
                />
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-600">Seat grid</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-700">
                    Rows
                    <input
                      type="number"
                      min={1}
                      value={seatGrid.rows}
                      onChange={event => setSeatGrid(prev => ({ ...prev, rows: Number(event.target.value) }))}
                      className="w-16 rounded border border-slate-200 px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-slate-700">
                    Columns
                    <input
                      type="number"
                      min={1}
                      value={seatGrid.cols}
                      onChange={event => setSeatGrid(prev => ({ ...prev, cols: Number(event.target.value) }))}
                      className="w-16 rounded border border-slate-200 px-2 py-1"
                    />
                  </label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 inline-flex items-center gap-2"
                  onClick={() => generateSeatsForSection(selectedSection.id, seatGrid.rows, seatGrid.cols)}
                >
                  <Wand2 className="h-4 w-4" /> Generate seats
                </Button>
              </div>
            </div>
          )}

          {selectedElement && (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase text-slate-600">Label</label>
                <input
                  type="text"
                  value={selectedElement.label ?? ''}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      elements: prev.elements.map(element =>
                        element.id === selectedElement.id ? { ...element, label: event.target.value } : element,
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs uppercase text-slate-600">
                  Width
                  <input
                    type="number"
                    value={selectedElement.width ?? 200}
                    onChange={event =>
                      updateLayout(prev => ({
                        ...prev,
                        elements: prev.elements.map(element =>
                          element.id === selectedElement.id ? { ...element, width: Number(event.target.value) } : element,
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-xs uppercase text-slate-600">
                  Height
                  <input
                    type="number"
                    value={selectedElement.height ?? 80}
                    onChange={event =>
                      updateLayout(prev => ({
                        ...prev,
                        elements: prev.elements.map(element =>
                          element.id === selectedElement.id ? { ...element, height: Number(event.target.value) } : element,
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </label>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-600">Rotation ({Math.round(selectedElement.rotation ?? 0)}°)</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={selectedElement.rotation ?? 0}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      elements: prev.elements.map(element =>
                        element.id === selectedElement.id ? { ...element, rotation: Number(event.target.value) } : element,
                      ),
                    }))
                  }
                  className="mt-1 w-full"
                />
              </div>
            </div>
          )}

          {selectedSeat && (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase text-slate-600">Label</label>
                <input
                  type="text"
                  value={selectedSeat.label ?? ''}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      seats: prev.seats.map(seat =>
                        seat.id === selectedSeat.id ? { ...seat, label: event.target.value } : seat,
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs uppercase text-slate-600">
                  Row
                  <input
                    type="text"
                    value={selectedSeat.rowLabel ?? ''}
                    onChange={event =>
                      updateLayout(prev => ({
                        ...prev,
                        seats: prev.seats.map(seat =>
                          seat.id === selectedSeat.id ? { ...seat, rowLabel: event.target.value } : seat,
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-xs uppercase text-slate-600">
                  Number
                  <input
                    type="number"
                    value={selectedSeat.number ?? 1}
                    onChange={event =>
                      updateLayout(prev => ({
                        ...prev,
                        seats: prev.seats.map(seat =>
                          seat.id === selectedSeat.id ? { ...seat, number: Number(event.target.value) } : seat,
                        ),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </label>
              </div>
              <label className="text-xs uppercase text-slate-600">
                Tier
                <input
                  type="text"
                  value={selectedSeat.tierCode ?? ''}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      seats: prev.seats.map(seat =>
                        seat.id === selectedSeat.id ? { ...seat, tierCode: event.target.value } : seat,
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <div>
                <label className="text-xs uppercase text-slate-600">Rotation ({Math.round(selectedSeat.rotation ?? 0)}°)</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={selectedSeat.rotation ?? 0}
                  onChange={event =>
                    updateLayout(prev => ({
                      ...prev,
                      seats: prev.seats.map(seat =>
                        seat.id === selectedSeat.id ? { ...seat, rotation: Number(event.target.value) } : seat,
                      ),
                    }))
                  }
                  className="mt-1 w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HybridLayoutDesigner;
