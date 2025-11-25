'use client';

import { apiClient } from "./apiClient";
import { EventSeat } from "../types/eventSeat";
import { EventSeatMap, SeatAssignmentPayload } from "../types/seatMap";

const EVENT_API_URL = "/events";

/**
 * Fetches seat inventory for an event.
 * Backend route expectation: GET /api/events/{eventId}/seats.
 */
export const getEventSeats = (eventId: string): Promise<EventSeat[]> => {
    return apiClient(`${EVENT_API_URL}/${eventId}/seats`);
};

export const getEventSeatMap = (eventId: string): Promise<EventSeatMap> => {
    return apiClient(`${EVENT_API_URL}/${eventId}/seat-map`);
};

export const updateSeatAssignments = (
    eventId: string,
    seats: SeatAssignmentPayload[],
): Promise<EventSeat[]> => {
    return apiClient(`${EVENT_API_URL}/${eventId}/seats/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats }),
    });
};
