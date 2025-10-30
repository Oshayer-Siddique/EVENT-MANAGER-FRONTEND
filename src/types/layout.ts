import type { TheaterLayoutConfiguration } from "./theaterPlan";

export interface Layout {
  id: string;
  typeCode: string;
  typeName: string;
  venueId: string;
  layoutName: string;
  totalRows?: number;
  totalCols?: number;
  totalTables?: number;
  chairsPerTable?: number;
  standingCapacity?: number;
  totalCapacity: number;
  isActive: boolean;
  configuration?: TheaterLayoutConfiguration | null;
}
