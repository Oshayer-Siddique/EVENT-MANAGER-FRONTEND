'use client';

import { apiClient } from './apiClient';
import { Hold, HoldCreate } from '@/types/hold';

const HOLD_API_URL = '/holds';

const holdService = {
  createHold(holdCreate: HoldCreate): Promise<Hold> {
    return apiClient(`${HOLD_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holdCreate),
    });
  },

  releaseHold(holdId: string): Promise<Hold> {
    return apiClient(`${HOLD_API_URL}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId }),
    });
  },

  convertHold(holdId: string, paymentId: string): Promise<Hold> {
    return apiClient(`${HOLD_API_URL}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId, paymentId }),
    });
  },

  getHold(holdId: string): Promise<Hold> {
    return apiClient(`${HOLD_API_URL}/${holdId}`);
  },

  getActiveHoldsForEvent(eventId: string): Promise<Hold[]> {
    return apiClient(`${HOLD_API_URL}/events/${eventId}`);
  },
};

export default holdService;
