export interface Seat {
  id: string;
  layoutId: string;
  row: string;
  number: number;
  label: string;
  type?: string | null;
}

export interface SeatCreateRequest {
  row: string;
  number: number;
  label?: string;
  type?: string | null;
}

export type SeatUpdateRequest = SeatCreateRequest;
