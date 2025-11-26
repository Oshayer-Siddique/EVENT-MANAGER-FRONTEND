import type { TheaterLayoutConfiguration } from "./theaterPlan";
import type { HybridLayoutConfiguration } from "./hybrid";

export type LayoutConfiguration = TheaterLayoutConfiguration | HybridLayoutConfiguration | null;

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
  configuration?: LayoutConfiguration;
}
