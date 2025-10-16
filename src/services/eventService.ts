
import { apiClient } from './apiClient';
import { Event } from '../types/event';

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getEvents = async (page = 0, size = 20): Promise<Page<Event>> => {
  return apiClient(`/events?page=${page}&size=${size}`);
};

export const getEvent = async (id: string): Promise<Event> => {
  return apiClient(`/events/${id}`);
};

export const createEvent = async (event: Partial<Event>): Promise<Event> => {
  return apiClient('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<Event> => {
  return apiClient(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient(`/events/${id}`, { method: 'DELETE' });
};
