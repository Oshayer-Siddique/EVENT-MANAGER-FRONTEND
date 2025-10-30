"use client";

import React from 'react';

import type { TheaterPlanSummary, TheaterLayoutConfiguration } from "@/types/theaterPlan";

type SeatDef = TheaterPlanSummary["seats"][number];

interface LayoutPreviewProps {
  typeName: string;
  totalRows?: number;
  totalCols?: number;
  totalTables?: number;
  chairsPerTable?: number;
  standingCapacity?: number;
  theaterPlan?: TheaterPlanSummary;
  configuration?: TheaterLayoutConfiguration | null;
}

const Seat = () => <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>;
const Table = ({ chairs }: { chairs: number }) => (
  <div className="relative w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center m-2">
    <div className="absolute text-white font-bold text-xs">{chairs}</div>
  </div>
);

const LayoutPreview: React.FC<LayoutPreviewProps> = ({
  typeName,
  totalRows = 0,
  totalCols = 0,
  totalTables = 0,
  chairsPerTable = 0,
  standingCapacity = 0,
  theaterPlan,
  configuration,
}) => {
  const computedPlan = theaterPlan ?? (configuration?.kind === "theater" ? configuration.summary : undefined);

  const renderTheater = () => {
    const planToUse = computedPlan;
    const hasCustomPlan = planToUse && planToUse.rows.length > 0;
    if (hasCustomPlan && planToUse) {
      const seatLookup = new Map<string, Map<number, SeatDef>>();
      planToUse.seats.forEach((seat) => {
        if (!seatLookup.has(seat.rowId)) {
          seatLookup.set(seat.rowId, new Map());
        }
        seatLookup.get(seat.rowId)!.set(seat.columnIndex, seat);
      });

      const columns = Math.max(1, planToUse.columns);

      return (
        <div className="space-y-3 rounded-lg border-2 border-dashed bg-gray-100 p-3">
          <div className="flex justify-center">
            <div className="w-2/3 rounded-full bg-gray-600 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
              Stage
            </div>
          </div>
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-1"
              style={{ gridTemplateColumns: `64px repeat(${columns}, minmax(24px, 32px))` }}
            >
              <div className="flex items-center justify-center text-[10px] font-semibold uppercase text-slate-500">
                Row
              </div>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <div
                  key={`preview-column-${columnIndex}`}
                  className="flex h-8 items-center justify-center rounded bg-slate-200 text-[10px] font-semibold text-slate-600"
                >
                  {columnIndex + 1}
                </div>
              ))}
              {planToUse.rows.map((row) => {
                const rowSeats = seatLookup.get(row.rowId) ?? new Map<number, SeatDef>();
                return (
                  <React.Fragment key={`preview-row-${row.rowIndex}`}>
                    <div className="flex h-8 items-center justify-center rounded bg-slate-200 text-xs font-semibold text-slate-700">
                      {row.rowLabel}
                    </div>
                    {Array.from({ length: columns }, (_, columnIndex) => {
                      if (row.isWalkway) {
                        return (
                          <div
                            key={`preview-walkway-${row.rowId}-${columnIndex}`}
                            className="flex h-8 items-center justify-center rounded border border-dashed border-amber-300 bg-amber-50"
                          />
                        );
                      }
                      const seat = rowSeats.get(columnIndex);
                      if (!seat) {
                        return (
                          <div
                            key={`preview-seat-${row.rowId}-${columnIndex}`}
                            className="flex h-8 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-100"
                          />
                        );
                      }
                      return (
                        <div
                          key={`preview-seat-${row.rowId}-${columnIndex}`}
                          className="flex h-8 items-center justify-center rounded border border-transparent text-[10px] font-semibold text-white shadow"
                          style={{ backgroundColor: seat.sectionColor || "#334155" }}
                        >
                          {seat.seatNumber}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          {theaterPlan.sections.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              {theaterPlan.sections.map((section) => (
                <span key={section.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm">
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  {section.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    const fallbackCols = Math.max(1, totalCols || (computedPlan?.columns ?? 1));

    return (
      <div className="rounded-lg border-2 border-dashed bg-gray-100 p-2">
        <div className="mb-2 flex justify-center">
          <div className="w-2/3 rounded-full bg-gray-600 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
            Stage
          </div>
        </div>
        <div
          className="grid justify-center gap-1.5"
          style={{ gridTemplateColumns: `repeat(${fallbackCols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: totalRows * fallbackCols }, (_, index) => (
            <Seat key={index} />
          ))}
        </div>
      </div>
    );
  };

  const renderBanquet = () => (
    <div className="p-2 bg-gray-100 rounded-lg border-2 border-dashed flex flex-wrap justify-center items-center">
      {Array.from({ length: totalTables }, (_, i) => <Table key={i} chairs={chairsPerTable} />)}
    </div>
  );

  const renderFreestyle = () => (
    <div className="p-8 bg-gray-100 rounded-lg border-2 border-dashed flex justify-center items-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-700">{standingCapacity}</p>
        <p className="text-sm text-gray-500">Standing Capacity</p>
      </div>
    </div>
  );

  switch (typeName) {
    case 'Theater':
    case 'Seminar':
    case 'Conference Hall':
      return renderTheater();
    case 'Banquet':
      return renderBanquet();
    case 'Freestyle':
      return renderFreestyle();
    default:
      return <div className="text-sm text-gray-500">Select a layout type to see a preview.</div>;
  }
};

export default LayoutPreview;
