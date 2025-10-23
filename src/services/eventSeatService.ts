import { apiClient } from "./apiClient";
import { EventSeat } from "../types/eventSeat";

const EVENT_API_URL = "/api/events";

/**
 * Fetches the seat inventory for a specific event.
 * NOTE: This assumes the existence of a backend endpoint at `/api/events/{eventId}/seats`,
 * which should return the list of all seats for that event with their status.
 */
export const getEventSeats = (eventId: string): Promise<EventSeat[]> => {
    return apiClient(`${EVENT_API_URL}/${eventId}/seats`);
};
