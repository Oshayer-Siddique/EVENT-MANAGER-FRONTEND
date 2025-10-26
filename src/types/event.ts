export interface EventTicketTier {
    id: string; // UUID
    tierCode: string;
    tierName: string;
    totalQuantity: number;
    price: number; // BigDecimal
    cost: number; // BigDecimal
    visible: boolean;
    soldQuantity: number;
    usedQuantity: number;
}

export interface Event {
    id: string; // UUID
    typeCode: string;
    typeName: string;
    eventCode: string;
    eventName: string;
    eventDescription?: string;
    privacyPolicy?: string;
    eventStart: string; // ZonedDateTime -> string
    eventEnd: string; // ZonedDateTime -> string
    venueId: string; // UUID
    seatLayoutId?: string; // UUID
    eventManager: string; // UUID
    eventOperator1: string; // UUID
    eventOperator2?: string; // UUID
    eventChecker1: string; // UUID
    eventChecker2?: string; // UUID
    organizerIds: string[]; // List<UUID>
    imageUrls: string[];
    ticketTiers: EventTicketTier[];
    artistIds: string[]; // List<UUID>
    sponsorIds: string[]; // List<UUID>
}

export interface CreateEventTicketTierRequest {
    tierCode: string;
    tierName: string;
    totalQuantity: number;
    price: number;
    cost: number;
    visible?: boolean;
}

export interface CreateEventRequest {
    typeCode: string;
    typeName: string;
    eventCode: string;
    eventName: string;
    eventDescription?: string;
    privacyPolicy?: string;
    eventStart: string; // ZonedDateTime
    eventEnd: string; // ZonedDateTime
    venueId: string; // UUID
    seatLayoutId?: string; // UUID
    eventManager: string; // UUID
    eventOperator1: string; // UUID
    eventOperator2?: string; // UUID
    eventChecker1: string; // UUID
    eventChecker2?: string; // UUID
    imageUrls?: string[];
    ticketTiers?: CreateEventTicketTierRequest[];
    artistIds?: string[]; // List<UUID>
    sponsorIds?: string[]; // List<UUID>
    organizerIds?: string[]; // List<UUID>
}

export interface UpdateEventTicketTierRequest {
    id: string; // UUID
    tierCode?: string;
    tierName?: string;
    totalQuantity?: number;
    price?: number;
    cost?: number;
    visible?: boolean;
}

export interface UpdateEventRequest {
    typeCode?: string;
    typeName?: string;
    eventCode?: string;
    eventName?: string;
    eventDescription?: string;
    privacyPolicy?: string;
    eventStart?: string; // ZonedDateTime
    eventEnd?: string; // ZonedDateTime
    venueId?: string; // UUID
    seatLayoutId?: string; // UUID
    eventManager?: string; // UUID
    eventOperator1?: string; // UUID
    eventOperator2?: string; // UUID
    eventChecker1?: string; // UUID
    eventChecker2?: string; // UUID
    imageUrls?: string[];
    ticketTiers?: UpdateEventTicketTierRequest[];
    artistIds?: string[]; // List<UUID>
    sponsorIds?: string[]; // List<UUID>
    organizerIds?: string[]; // List<UUID>
}

export interface SeatLayoutSummary {
    id: string;
    typeCode: string;
    typeName: string;
    layoutName: string;
    totalRows?: number;
    totalCols?: number;
    totalTables?: number;
    chairsPerTable?: number;
    standingCapacity?: number;
    totalCapacity: number;
    active: boolean;
}

export interface EventTicketDetails {
    eventId: string;
    ticketTiers: EventTicketTier[];
    imageUrls: string[];
    seatLayout: SeatLayoutSummary | null;
}

export interface SeatInventorySyncRequest {
    tierCode?: string;
    price?: number;
    overwriteExisting?: boolean;
    removeMissing?: boolean;
}
