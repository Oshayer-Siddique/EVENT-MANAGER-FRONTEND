import { apiClient } from "./apiClient";

export const createEventManager = async (userData: any) => {
  return apiClient("/users/event-manager", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getEventManagers = async () => {
  return apiClient("/users/event-managers");
};

export const deleteEventManager = async (id: string) => {
  return apiClient(`/users/event-manager/${id}`, {
    method: "DELETE",
  });
};

export const createOperator = async (userData: any) => {
  return apiClient("/users/operator", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getOperators = async () => {
  return apiClient("/users/operators");
};

export const deleteOperator = async (id: string) => {
  return apiClient(`/users/operator/${id}`, {
    method: "DELETE",
  });
};

export const getEventCheckers = async () => {
  return apiClient("/users/event-checkers");
};

export const createEventChecker = async (userData: any) => {
  return apiClient("/users/event-checker", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const deleteEventChecker = async (id: string) => {
  return apiClient(`/users/event-checker/${id}`, {
    method: "DELETE",
  });
};
