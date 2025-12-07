export interface HeldSeatInfo {
    seatId: string; // UUID
    seatLabel: string;
    tierCode: string;
}

export interface AppliedDiscountInfo {
    discountId: string;
    code: string;
    name: string;
    amount: number;
    autoApplied: boolean;
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
    subtotalAmount?: number;
    discountAmount?: number;
    totalAmount?: number;
    appliedDiscounts?: AppliedDiscountInfo[];
}

export interface HoldCreate {
    eventId: string;
    buyerId?: string;
    seatIds?: string[];
    tierSelections?: Array<{
        tierCode: string;
        quantity: number;
    }>;
    expiresAt: string;
    discountCode?: string;
}

export interface HoldReleaseRequest {
    holdId: string;
    reason?: string;
}

export interface HoldConvertRequest {
    holdId: string;
    paymentId: string;
}
