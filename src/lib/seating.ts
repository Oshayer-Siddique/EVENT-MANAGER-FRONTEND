import { createSeatForLayout, deleteSeatForLayout, getSeatsForLayout, updateSeatForLayout } from "@/services/seatService";
import type { TheaterPlanSummary } from "@/types/theaterPlan";
import type { Seat, SeatUpdateRequest } from "@/types/seat";

type SeatPlanError = Error & {
  code?: string;
  details?: string[];
};

const MAX_SEAT_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 200;
const BETWEEN_REQUEST_DELAY_MS = 40;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetrySeat = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return normalized.includes("429") || normalized.includes("too many requests") || normalized.includes("rate limit");
};

const createSeatWithRetry = async (
  layoutId: string,
  seat: TheaterPlanSummary["seats"][number],
): Promise<void> => {
  let attempt = 0;
  // Ensure we always wait slightly before the first request to stagger bulk operations.
  await sleep(BETWEEN_REQUEST_DELAY_MS);

  while (attempt < MAX_SEAT_RETRIES) {
    try {
      await createSeatForLayout(layoutId, {
        row: seat.rowLabel,
        number: seat.seatNumber,
        label: seat.label,
        type: seat.sectionName || undefined,
      });
      return;
    } catch (error) {
      attempt += 1;
      if (!shouldRetrySeat(error) || attempt >= MAX_SEAT_RETRIES) {
        throw error;
      }

      const backoff = RETRY_BASE_DELAY_MS * attempt * attempt; // quadratic backoff
      await sleep(backoff);
    }
  }
};

const deleteSeatWithRetry = async (layoutId: string, seatId: string): Promise<void> => {
  let attempt = 0;
  await sleep(BETWEEN_REQUEST_DELAY_MS);

  while (attempt < MAX_SEAT_RETRIES) {
    try {
      await deleteSeatForLayout(layoutId, seatId);
      return;
    } catch (error) {
      attempt += 1;
      if (!shouldRetrySeat(error) || attempt >= MAX_SEAT_RETRIES) {
        throw error;
      }

      const backoff = RETRY_BASE_DELAY_MS * attempt * attempt;
      await sleep(backoff);
    }
  }
};

const updateSeatWithRetry = async (
  layoutId: string,
  seatId: string,
  payload: SeatUpdateRequest,
): Promise<void> => {
  let attempt = 0;
  await sleep(BETWEEN_REQUEST_DELAY_MS);

  while (attempt < MAX_SEAT_RETRIES) {
    try {
      await updateSeatForLayout(layoutId, seatId, payload);
      return;
    } catch (error) {
      attempt += 1;
      if (!shouldRetrySeat(error) || attempt >= MAX_SEAT_RETRIES) {
        throw error;
      }

      const backoff = RETRY_BASE_DELAY_MS * attempt * attempt;
      await sleep(backoff);
    }
  }
};

const seatKey = (row: string, number: number) => `${row.trim().toUpperCase()}-${number}`;

const toSeatPayload = (seat: TheaterPlanSummary["seats"][number]): SeatUpdateRequest => ({
  row: seat.rowLabel,
  number: seat.seatNumber,
  label: seat.label,
  type: seat.sectionName || undefined,
});

const needsSeatUpdate = (existing: Seat, payload: SeatUpdateRequest) => {
  const normalizeRow = (value: string) => value.trim().toUpperCase();
  const normalizeNullable = (value?: string | null) => (value ?? "").trim();

  const rowChanged = normalizeRow(existing.row) !== normalizeRow(payload.row);
  const numberChanged = existing.number !== payload.number;
  const labelChanged = normalizeNullable(existing.label) !== normalizeNullable(payload.label);
  const typeChanged = normalizeNullable(existing.type ?? undefined) !== normalizeNullable(payload.type ?? undefined);

  return rowChanged || numberChanged || labelChanged || typeChanged;
};

export const createSeatsFromPlan = async (layoutId: string, plan: TheaterPlanSummary) => {
  const failures: string[] = [];

  for (const seat of plan.seats) {
    try {
      await createSeatWithRetry(layoutId, seat);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${seat.rowLabel}${seat.seatNumber}: ${message}`);
    }
  }

  if (failures.length > 0) {
    const aggregate: SeatPlanError = Object.assign(new Error(`Failed to generate ${failures.length} seat${failures.length > 1 ? 's' : ''}.`), {
      code: 'SEAT_CREATE_FAILED',
      details: failures,
    });
    throw aggregate;
  }
};

export const replaceSeatsFromPlan = async (layoutId: string, plan: TheaterPlanSummary) => {
  const existingSeats = await getSeatsForLayout(layoutId);
  const deleteFailures: string[] = [];

  const existingByKey = new Map(existingSeats.map((seat) => [seatKey(seat.row, seat.number), seat]));
  const desiredByKey = new Map(plan.seats.map((seat) => [seatKey(seat.rowLabel, seat.seatNumber), seat]));

  const seatsToDelete = existingSeats.filter((seat) => !desiredByKey.has(seatKey(seat.row, seat.number)));

  for (const seat of seatsToDelete) {
    try {
      await deleteSeatWithRetry(layoutId, seat.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      deleteFailures.push(`${seat.row}-${seat.number}: ${message}`);
    }
  }

  if (deleteFailures.length > 0) {
    const aggregate: SeatPlanError = Object.assign(new Error('Unable to regenerate seats because some existing seats could not be removed.'), {
      code: 'SEAT_DELETE_FAILED',
      details: deleteFailures,
    });
    throw aggregate;
  }

  const updateFailures: string[] = [];

  for (const seat of plan.seats) {
    const key = seatKey(seat.rowLabel, seat.seatNumber);
    const existing = existingByKey.get(key);
    if (!existing) {
      continue;
    }

    const payload = toSeatPayload(seat);
    if (!needsSeatUpdate(existing, payload)) {
      continue;
    }

    try {
      await updateSeatWithRetry(layoutId, existing.id, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateFailures.push(`${existing.row}-${existing.number}: ${message}`);
    }
  }

  if (updateFailures.length > 0) {
    const aggregate: SeatPlanError = Object.assign(new Error('Unable to regenerate seats because some existing seats could not be updated.'), {
      code: 'SEAT_UPDATE_FAILED',
      details: updateFailures,
    });
    throw aggregate;
  }

  const createFailures: string[] = [];

  for (const seat of plan.seats) {
    const key = seatKey(seat.rowLabel, seat.seatNumber);
    if (existingByKey.has(key)) {
      continue;
    }

    try {
      await createSeatWithRetry(layoutId, seat);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      createFailures.push(`${seat.rowLabel}${seat.seatNumber}: ${message}`);
    }
  }

  if (createFailures.length > 0) {
    const failureCount = createFailures.length;
    const aggregate: SeatPlanError = Object.assign(new Error(`Failed to generate ${failureCount} seat${failureCount > 1 ? 's' : ''}.`), {
      code: 'SEAT_CREATE_FAILED',
      details: createFailures,
    });
    throw aggregate;
  }
};
