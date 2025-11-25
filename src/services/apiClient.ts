'use client';

// src/services/apiClient.ts

/**
 * A lightweight wrapper around the Fetch API for making requests to the backend API.
 * It automatically adds the base URL and the Authorization header with a JWT token
 * if it's available in localStorage.
 */
export interface ApiClientError extends Error {
  status?: number;
  body?: unknown;
  retryAfterMs?: number;
}

const API_BASE_URL = "http://localhost:5010/api";
const MIN_REQUEST_INTERVAL_MS = 200; // timer between calls so the server isn't spammed
const MAX_RETRIES = 2;
const DEFAULT_RETRY_AFTER_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let lastRequestTimestamp = 0;
let rateLimitQueue: Promise<void> = Promise.resolve();

const scheduleRequest = () => {
  rateLimitQueue = rateLimitQueue
    .then(async () => {
      const now = Date.now();
      const elapsed = now - lastRequestTimestamp;
      const waitTime = Math.max(0, MIN_REQUEST_INTERVAL_MS - elapsed);
      if (waitTime > 0) {
        await sleep(waitTime);
      }
      lastRequestTimestamp = Date.now();
    })
    .catch(() => {
      // If a previous request failed we still want the queue to keep working
      lastRequestTimestamp = Date.now();
    });

  return rateLimitQueue;
};

const performRequest = async (url: string, options: RequestInit, attempt = 0): Promise<any> => {
  await scheduleRequest();

  // Ensure this code only runs on the client-side
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const publicRoutes = ["/auth/login", "/auth/signup"];
  const shouldSendToken = token && !publicRoutes.includes(url);

  const requestHeaders = new Headers(options.headers);
  requestHeaders.set("Content-Type", "application/json");

  if (shouldSendToken) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Log the request details for easier debugging
  console.log(`[API Client] Making ${options.method || 'GET'} request to: ${API_BASE_URL}${url}`);
  console.log("[API Client] Using token:", token ? `${token.substring(0, 15)}...` : "No token");
  console.log("[API Client] Sending headers:", JSON.stringify(Object.fromEntries(requestHeaders.entries()), null, 2));

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    console.error(`[API Client] Error ${res.status} on request to ${url}:`, errorData);
    const error: ApiClientError = new Error(errorData.message || "An error occurred with the API request.");
    error.status = res.status;
    error.body = errorData;
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) {
      const retrySeconds = Number(retryAfter);
      const retryMs = Number.isFinite(retrySeconds) ? retrySeconds * 1000 : undefined;
      if (retryMs) {
        error.retryAfterMs = retryMs;
      }
    }

    if (error.status === 429 && attempt < MAX_RETRIES) {
      const waitMs = error.retryAfterMs ?? DEFAULT_RETRY_AFTER_MS;
      console.warn(`[API Client] Received 429. Waiting ${waitMs}ms before retry #${attempt + 1}`);
      await sleep(waitMs);
      return performRequest(url, options, attempt + 1);
    }

    throw error;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  return {}; // Return empty object for non-json responses or handle as needed
};

export const apiClient = async (url: string, options: RequestInit = {}) => {
  return performRequest(url, options);
};
