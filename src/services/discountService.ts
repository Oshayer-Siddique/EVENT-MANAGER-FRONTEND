'use client';

import { apiClient } from './apiClient';
import type {
  DiscountRequest,
  DiscountResponse,
  DiscountValidationRequest,
  DiscountValidationResponse,
} from '@/types/discount';

const BASE_URL = '/discounts';

const discountService = {
  validate(request: DiscountValidationRequest): Promise<DiscountValidationResponse> {
    return apiClient(`${BASE_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        includeAutomaticDiscounts: request.includeAutomaticDiscounts ?? true,
      }),
    });
  },

  list(eventId?: string): Promise<DiscountResponse[]> {
    const query = eventId ? `?eventId=${eventId}` : '';
    return apiClient(`${BASE_URL}${query}`);
  },

  create(payload: DiscountRequest): Promise<DiscountResponse> {
    return apiClient(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: DiscountRequest): Promise<DiscountResponse> {
    return apiClient(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

export default discountService;
