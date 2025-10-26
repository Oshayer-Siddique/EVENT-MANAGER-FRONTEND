import { apiClient } from "./apiClient";
import { Event, CreateEventRequest, UpdateEventRequest, EventTicketDetails, SeatInventorySyncRequest } from "../types/event";
import { EventSeat } from "../types/eventSeat";

// Define a generic Page type if it's not already defined globally
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    // Add other pagination fields if your backend sends them
}

const EVENT_API_URL = "/events";

export const createEvent = (data: CreateEventRequest): Promise<Event> => {
    return apiClient(EVENT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const getEvent = (id: string): Promise<Event> => {
    return apiClient(`${EVENT_API_URL}/${id}`);
};

export const getEventTicketDetails = (id: string): Promise<EventTicketDetails> => {
    return apiClient(`${EVENT_API_URL}/${id}/ticket-details`);
};

export const listEvents = (page = 0, size = 20): Promise<Page<Event>> => {
    return apiClient(`${EVENT_API_URL}?page=${page}&size=${size}&sort=eventStart`);
};

export const updateEvent = (id: string, data: UpdateEventRequest): Promise<Event> => {
    return apiClient(`${EVENT_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const deleteEvent = (id: string): Promise<void> => {
    return apiClient(`${EVENT_API_URL}/${id}`, {
        method: 'DELETE',
    });
};

export const syncEventSeats = (id: string, payload: SeatInventorySyncRequest): Promise<EventSeat[]> => {
    return apiClient(`${EVENT_API_URL}/${id}/seats/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
};
