'use client';

// src/services/authService.ts
import { apiClient } from "./apiClient";
import { UserProfile } from "@/types/user";

export const signIn = async (credentials: { email: string; password: string }) => {
  const response = await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (response.token) {
    localStorage.setItem("token", response.token);
  }

  return response;
};

export const signUp = async (user: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}) => {
  return apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify(user),
  });
};

export const logout = async () => {
  try {
    await apiClient("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    // The endpoint might not exist yet; swallow the error so we always clear the session client-side.
    console.warn("Server logout failed or is unavailable", error);
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  return apiClient("/users/me");
};
