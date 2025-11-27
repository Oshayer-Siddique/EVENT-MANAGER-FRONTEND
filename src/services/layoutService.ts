"use client";

import { apiClient } from './apiClient';
import type { HybridLayoutConfiguration } from '@/types/hybrid';

export const getHybridLayout = (layoutId: string): Promise<HybridLayoutConfiguration> => {
  return apiClient(`/seat-layouts/${layoutId}/hybrid`);
};
