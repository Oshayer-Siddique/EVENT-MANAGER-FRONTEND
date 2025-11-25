'use client';

import { apiClient } from './apiClient';
import type { BanquetLayout } from '@/types/banquet';

const BASE_URL = '/seat-layouts';

export const getBanquetLayout = (layoutId: string): Promise<BanquetLayout> => {
  return apiClient(`${BASE_URL}/${layoutId}/banquet`);
};

export const saveBanquetLayout = (layoutId: string, layout: BanquetLayout): Promise<BanquetLayout> => {
  return apiClient(`${BASE_URL}/${layoutId}/banquet`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  });
};
