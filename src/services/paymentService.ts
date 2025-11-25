'use client';

import { apiClient } from './apiClient';
import type { CreatePaymentIntentRequest, CreatePaymentIntentResponse } from '@/types/payment';

const PAYMENT_API_URL = '/payments';

export const paymentService = {
  createPaymentIntent(payload: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    return apiClient(`${PAYMENT_API_URL}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

export default paymentService;
