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

  const requestHeaders = new Headers(options.headers);
  requestHeaders.set("Content-Type", "application/json");

  if (shouldSendToken) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Log the request details for easier debugging
  console.log(`[API Client] Making ${options.method || 'GET'} request to: ${baseUrl}${url}`);
  console.log("[API Client] Using token:", token ? `${token.substring(0, 15)}...` : "No token");
  // The Headers object is not directly serializable with JSON.stringify, so we convert it to an object first.
  console.log("[API Client] Sending headers:", JSON.stringify(Object.fromEntries(requestHeaders.entries()), null, 2));


  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    console.error(`[API Client] Error ${res.status} on request to ${url}:`, errorData);
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
