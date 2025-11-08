'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getEventSeats } from '@/services/eventSeatService';
import type { ApiClientError } from '@/services/apiClient';
import type { EventSeat } from '@/types/eventSeat';

interface CacheEntry {
  seats: EventSeat[];
  loading: boolean;
  error: Error | null;
  updatedAt: number | null;
  rateLimitedUntil?: number;
  rateLimitBackoffMs?: number;
  promise?: Promise<EventSeat[]>;
}

interface RefreshOptions {
  ignoreRateLimit?: boolean;
}

export interface UseEventSeatsOptions {
  enabled?: boolean;
  refreshInterval?: number;
  cacheDurationMs?: number;
}

export interface UseEventSeatsResult {
  seats: EventSeat[];
  loading: boolean;
  error: Error | null;
  lastUpdatedAt: number | null;
  rateLimitedUntil?: number;
  refresh: (options?: RefreshOptions) => Promise<EventSeat[]>;
}

const DEFAULT_CACHE_TTL = 15000;
const MIN_BACKOFF_MS = 15000;
const MAX_BACKOFF_MS = 120000;

const cache = new Map<string, CacheEntry>();
const subscribers = new Map<string, Set<() => void>>();

const getEntry = (eventId: string): CacheEntry => {
  if (!cache.has(eventId)) {
    cache.set(eventId, {
      seats: [],
      loading: false,
      error: null,
      updatedAt: null,
    });
  }
  return cache.get(eventId)!;
};

const notify = (eventId: string) => {
  const listeners = subscribers.get(eventId);
  if (!listeners) {
    return;
  }
  listeners.forEach(listener => listener());
};

const subscribe = (eventId: string, listener: () => void) => {
  if (!subscribers.has(eventId)) {
    subscribers.set(eventId, new Set());
  }
  const set = subscribers.get(eventId)!;
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      subscribers.delete(eventId);
    }
  };
};

const scheduleBackoff = (eventId: string, error: ApiClientError) => {
  const entry = getEntry(eventId);
  const retryAfterMs = error.retryAfterMs;
  const nextBackoff = retryAfterMs ?? Math.min(entry.rateLimitBackoffMs ? entry.rateLimitBackoffMs * 2 : MIN_BACKOFF_MS, MAX_BACKOFF_MS);
  entry.rateLimitedUntil = Date.now() + nextBackoff;
  entry.rateLimitBackoffMs = nextBackoff;
};

const fetchSeatsForEvent = async (eventId: string, options: RefreshOptions = {}) => {
  const { ignoreRateLimit = false } = options;
  const entry = getEntry(eventId);

  if (entry.promise) {
    return entry.promise;
  }

  const now = Date.now();
  if (!ignoreRateLimit && entry.rateLimitedUntil && entry.rateLimitedUntil > now) {
    return Promise.reject(Object.assign(new Error('Rate limited'), { status: 429 }));
  }

  const promise = getEventSeats(eventId)
    .then(seats => {
      const current = getEntry(eventId);
      current.seats = seats;
      current.loading = false;
      current.error = null;
      current.updatedAt = Date.now();
      current.rateLimitedUntil = undefined;
      current.rateLimitBackoffMs = MIN_BACKOFF_MS;
      notify(eventId);
      return seats;
    })
    .catch(error => {
      const current = getEntry(eventId);
      current.loading = false;
      current.error = error instanceof Error ? error : new Error('Failed to load seats');
      if ((error as ApiClientError)?.status === 429) {
        scheduleBackoff(eventId, error as ApiClientError);
      }
      notify(eventId);
      throw error;
    })
    .finally(() => {
      const current = getEntry(eventId);
      current.promise = undefined;
    });

  entry.promise = promise;
  entry.loading = true;
  entry.error = null;
  notify(eventId);

  return promise;
};

export const useEventSeats = (eventId: string | null | undefined, options: UseEventSeatsOptions = {}): UseEventSeatsResult => {
  const { enabled = true, refreshInterval, cacheDurationMs = DEFAULT_CACHE_TTL } = options;
  const resolvedId = eventId ?? '';
  const [, forceRender] = useState(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    if (!resolvedId) {
      return;
    }
    return subscribe(resolvedId, () => {
      forceRender(prev => prev + 1);
    });
  }, [resolvedId]);

  const refresh = useCallback(
    (refreshOptions?: RefreshOptions) => {
      if (!resolvedId) {
        return Promise.resolve([]);
      }
      return fetchSeatsForEvent(resolvedId, refreshOptions);
    },
    [resolvedId],
  );

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!resolvedId || !enabled) {
      return;
    }
    const entry = getEntry(resolvedId);
    const isStale = !entry.updatedAt || Date.now() - entry.updatedAt > cacheDurationMs;
    if (isStale && !entry.loading) {
      void refresh();
    }
  }, [cacheDurationMs, enabled, refresh, resolvedId]);

  useEffect(() => {
    if (!resolvedId || !enabled || !refreshInterval) {
      return;
    }
    const id = window.setInterval(() => {
      const entry = getEntry(resolvedId);
      if (entry.rateLimitedUntil && entry.rateLimitedUntil > Date.now()) {
        return;
      }
      void refresh();
    }, refreshInterval);
    return () => window.clearInterval(id);
  }, [enabled, refresh, refreshInterval, resolvedId]);

  const entry = resolvedId ? getEntry(resolvedId) : { seats: [], loading: false, error: null, updatedAt: null };

  return {
    seats: entry.seats,
    loading: enabled ? entry.loading : false,
    error: entry.error,
    lastUpdatedAt: entry.updatedAt,
    rateLimitedUntil: entry.rateLimitedUntil,
    refresh,
  };
};
