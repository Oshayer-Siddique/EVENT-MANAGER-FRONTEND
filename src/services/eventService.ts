
import { apiClient } from './apiClient';
import { Event } from '../types/event';

export const getEvents = async (): Promise<Event[]> => {
  return apiClient('/events');
};

export const getEventById = async (id: string): Promise<Event> => {
  return apiClient(`/events/${id}`);
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<Event> => {
  return apiClient('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

export const updateEvent = async (id: string, event: Partial<Omit<Event, 'id'>>): Promise<Event> => {
  return apiClient(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient(`/events/${id}`, { method: 'DELETE' });
};
