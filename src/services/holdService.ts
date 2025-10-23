import { apiClient } from "./apiClient";
import { Hold, HoldCreateRequest, HoldReleaseRequest, HoldConvertRequest } from "../types/hold";

const HOLD_API_URL = "/api/holds";

export const createHold = (data: HoldCreateRequest): Promise<Hold> => {
    return apiClient(HOLD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const releaseHold = (data: HoldReleaseRequest): Promise<Hold> => {
    return apiClient(`${HOLD_API_URL}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const convertHold = (data: HoldConvertRequest): Promise<Hold> => {
    return apiClient(`${HOLD_API_URL}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const getHold = (holdId: string): Promise<Hold> => {
    return apiClient(`${HOLD_API_URL}/${holdId}`);
};

export const listActiveHoldsByEvent = (eventId: string): Promise<Hold[]> => {
    return apiClient(`${HOLD_API_URL}/events/${eventId}`);
};

