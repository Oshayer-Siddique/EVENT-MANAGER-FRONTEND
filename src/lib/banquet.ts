import type { BanquetLayoutConfiguration, BanquetTable } from "@/types/banquetPlan";
import type { TheaterPlanSummary } from "@/types/theaterPlan";

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const banquetTablesToSeatPlan = (tables: BanquetTable[]): TheaterPlanSummary => {
  const seats: TheaterPlanSummary["seats"] = [];

  tables.forEach((table, tableIndex) => {
    const seatCount = Math.max(1, table.seatCount);
    for (let index = 0; index < seatCount; index += 1) {
      const angle = (2 * Math.PI * index) / seatCount;
      const seatX = clamp(table.x + Math.cos(angle) * table.radius);
      const seatY = clamp(table.y + Math.sin(angle) * table.radius);
      seats.push({
        rowId: table.id,
        rowIndex: tableIndex,
        rowLabel: table.label,
        columnIndex: index,
        seatNumber: index + 1,
        label: `${table.label}-${index + 1}`,
        sectionId: table.id,
        sectionName: table.label,
        sectionColor: "#f97316",
        tableLabel: table.label,
        tableIndex,
        positionX: seatX,
        positionY: seatY,
        rotation: angle,
      });
    }
  });

  return {
    seats,
    rows: [],
    columns: seats.length,
    sections: [],
    capacity: seats.length,
    walkwayColumns: [],
  };
};

export const summarizeBanquetConfiguration = (configuration: BanquetLayoutConfiguration) => ({
  configuration,
  seatPlan: banquetTablesToSeatPlan(configuration.tables),
  capacity: configuration.tables.reduce((sum, table) => sum + Math.max(table.seatCount, 0), 0),
});

export type BanquetSummary = ReturnType<typeof summarizeBanquetConfiguration>;
