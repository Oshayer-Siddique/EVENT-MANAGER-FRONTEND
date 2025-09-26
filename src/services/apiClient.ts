// src/services/apiClient.ts

/**
 * A lightweight wrapper around the Fetch API for making requests to the backend API.
 * It automatically adds the base URL and the Authorization header with a JWT token
 * if it's available in localStorage.
 *
 * @param url - The endpoint to call (e.g., "/users/me").
 * @param options - Optional request options (e.g., method, body).
 * @returns The JSON response from the API.
 * @throws An error if the API response is not ok.
 */
export const apiClient = async (url: string, options: RequestInit = {}) => {
  const baseUrl = "http://localhost:5010/api";
  // Ensure this code only runs on the client-side
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const publicRoutes = ["/auth/login", "/auth/signup"];
  const shouldSendToken = token && !publicRoutes.includes(url);

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(shouldSendToken ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || "An error occurred with the API request.");
  }

  // Handle cases where response might be empty
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }
  
  return {}; // Return empty object for non-json responses or handle as needed
};
