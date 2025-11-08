export interface BanquetTable {
  id: string;
  label: string;
  seatCount: number;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  radius: number; // normalized relative size
}

export interface BanquetLayoutConfiguration {
  kind: 'banquet';
  tables: BanquetTable[];
}

export interface BanquetPlanSummary {
  tables: BanquetTable[];
  capacity: number;
}
