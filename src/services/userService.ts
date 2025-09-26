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
