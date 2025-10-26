export enum EventSeatStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    SOLD = 'SOLD',
}

export interface EventSeat {
    eventSeatId: string; // UUID (EventSeatEntity)
    seatId: string; // UUID (SeatEntity)
    label: string;
    row?: string;
    number?: number;
    type?: string;
    status: EventSeatStatus;
    tierCode: string;
    price?: number; // BigDecimal
}
