export interface TheaterPlanSection {
  id: string;
  name: string;
  color: string;
}

export interface TheaterSeatCell {
  id: string;
  enabled: boolean;
}

export interface TheaterRowState {
  id: string;
  label: string;
  sectionId: string;
  startNumber: number;
  isWalkway: boolean;
  seats: TheaterSeatCell[];
}

export interface TheaterDesignerState {
  rows: TheaterRowState[];
  sections: TheaterPlanSection[];
  columnCount: number;
}

export interface TheaterSeatDefinition {
  rowId: string;
  rowIndex: number;
  rowLabel: string;
  columnIndex: number;
  seatNumber: number;
  label: string;
  sectionId: string;
  sectionName: string;
  sectionColor: string;
}

export interface TheaterRowSummary {
  rowId: string;
  rowIndex: number;
  rowLabel: string;
  sectionId: string;
  sectionName: string;
  sectionColor: string;
  startNumber: number;
  activeSeatCount: number;
  isWalkway: boolean;
}

export interface TheaterPlanSummary {
  seats: TheaterSeatDefinition[];
  rows: TheaterRowSummary[];
  columns: number;
  sections: TheaterPlanSection[];
  capacity: number;
}

export interface TheaterLayoutConfiguration {
  kind: "theater";
  state: TheaterDesignerState;
  summary: TheaterPlanSummary;
}
