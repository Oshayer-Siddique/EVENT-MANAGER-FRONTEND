import { apiClient } from "./apiClient";
import type { Seat, SeatCreateRequest, SeatUpdateRequest } from "@/types/seat";

export const getSeatsForLayout = async (layoutId: string): Promise<Seat[]> => {
  return apiClient(`/seat-layouts/${layoutId}/seats`);
};

export const createSeatForLayout = async (
  layoutId: string,
  payload: SeatCreateRequest,
): Promise<Seat> => {
  return apiClient(`/seat-layouts/${layoutId}/seats`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateSeatForLayout = async (
  layoutId: string,
  seatId: string,
  payload: SeatUpdateRequest,
): Promise<Seat> => {
  return apiClient(`/seat-layouts/${layoutId}/seats/${seatId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteSeatForLayout = async (layoutId: string, seatId: string): Promise<void> => {
  await apiClient(`/seat-layouts/${layoutId}/seats/${seatId}`, {
    method: "DELETE",
  });
};

