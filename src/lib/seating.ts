import { createSeatForLayout, deleteSeatForLayout, getSeatsForLayout } from "@/services/seatService";
import type { TheaterPlanSummary } from "@/types/theaterPlan";

const SEAT_CHUNK_SIZE = 25;

export const createSeatsFromPlan = async (layoutId: string, plan: TheaterPlanSummary) => {
  for (let index = 0; index < plan.seats.length; index += SEAT_CHUNK_SIZE) {
    const chunk = plan.seats.slice(index, index + SEAT_CHUNK_SIZE);
    for (const seat of chunk) {
      // Keep seat creation sequential within each chunk to avoid hammering the API and failing mid-run.
      await createSeatForLayout(layoutId, {
        row: seat.rowLabel,
        number: seat.seatNumber,
        label: seat.label,
        type: seat.sectionName || undefined,
      });
    }
  }
};

export const replaceSeatsFromPlan = async (layoutId: string, plan: TheaterPlanSummary) => {
  const existingSeats = await getSeatsForLayout(layoutId);
  for (const seat of existingSeats) {
    await deleteSeatForLayout(layoutId, seat.id);
  }

  await createSeatsFromPlan(layoutId, plan);
};
