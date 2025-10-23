import { Event } from "./event";
import { Seat } from "./seat"; // Assuming a seat type exists

export enum EventSeatStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    SOLD = 'SOLD',
}

export interface EventSeat {
    id: string; // UUID
    event: Event;
    seat: Seat;
    status: EventSeatStatus;
    tierCode: string;
    price: number; // BigDecimal
    createdAt: string; // OffsetDateTime
    updatedAt: string; // OffsetDateTime
}
