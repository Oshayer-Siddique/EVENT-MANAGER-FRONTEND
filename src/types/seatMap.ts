import { EventSeatStatus } from './eventSeat';
import { EventTicketTier } from './event';
import type { SeatLayoutSummary } from './event';

export interface EventSeatMapSeat {
  seatId: string;
  eventSeatId?: string;
  row: string;
  number: number;
  label: string;
  type?: string;
  tierCode?: string;
  price?: number;
  status: EventSeatStatus;
}

export interface EventSeatMap {
  eventId: string;
  seatLayoutId: string;
  layout: SeatLayoutSummary;
  ticketTiers: EventTicketTier[];
  seats: EventSeatMapSeat[];
}

export interface SeatAssignmentPayload {
  eventSeatId?: string;
  seatId?: string;
  tierCode: string;
  price?: number;
  status?: EventSeatStatus;
}
