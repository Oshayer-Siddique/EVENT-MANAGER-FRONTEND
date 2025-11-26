"use client";

import { apiClient } from "./apiClient";
import type { HybridLayoutConfiguration } from "@/types/hybrid";

export const getHybridLayout = (layoutId: string): Promise<HybridLayoutConfiguration> => {
  return apiClient(`/seat-layouts/${layoutId}/hybrid`);
};

export const saveHybridLayout = (
  layoutId: string,
  configuration: HybridLayoutConfiguration,
): Promise<HybridLayoutConfiguration> => {
  return apiClient(`/seat-layouts/${layoutId}/hybrid`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configuration),
  });
};
