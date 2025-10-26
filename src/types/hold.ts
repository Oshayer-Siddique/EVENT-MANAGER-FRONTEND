export interface HeldSeatInfo {
    seatId: string; // UUID
    seatLabel: string;
    tierCode: string;
}

export interface Hold {
    id: string; // UUID
    eventId: string; // UUID
    buyerId?: string; // UUID
    status: string;
    heldSeats: HeldSeatInfo[];
    expiresAt: string; // OffsetDateTime
    finalizedPaymentId?: string; // UUID
    createdAt: string; // OffsetDateTime
    updatedAt: string; // OffsetDateTime
}

export interface HoldCreate {
    eventId: string;
    buyerId?: string;
    seatIds: string[];
    expiresAt: string;
}

export interface HoldReleaseRequest {
    holdId: string;
    reason?: string;
}

export interface HoldConvertRequest {
    holdId: string;
    paymentId: string;
}
