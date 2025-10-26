import { apiClient } from "./apiClient";
import { EventSeat } from "../types/eventSeat";

const EVENT_API_URL = "/events";

/**
 * Fetches seat inventory for an event.
 * Backend route expectation: GET /api/events/{eventId}/seats.
 */
export const getEventSeats = (eventId: string): Promise<EventSeat[]> => {
    return apiClient(`${EVENT_API_URL}/${eventId}/seats`);
};
