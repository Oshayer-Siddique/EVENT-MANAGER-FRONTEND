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
  email: string;
  phone: string;
  password: string;
}) => {
  return apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify(user),
  });
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  return apiClient("/users/me");
};
