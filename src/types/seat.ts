export interface Seat {
    id: string; // UUID
    venueId: string; // UUID
    seatNumber: string;
    row: string;
    section: string;
    // Add any other relevant seat properties
}
