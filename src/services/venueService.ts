import { apiClient } from './apiClient';
import { Venue } from '../types/venue';
import { Layout } from '../types/layout';

export const getVenues = async (): Promise<Venue[]> => {
  return apiClient('/venues');
};

export const getVenueById = async (id: string): Promise<Venue> => {
  return apiClient(`/venues/${id}`);
};

export const createVenue = async (venue: Omit<Venue, 'id'>): Promise<Venue> => {
  return apiClient('/venues', {
    method: 'POST',
    body: JSON.stringify(venue),
  });
};

export const updateVenue = async (id: string, venue: Partial<Omit<Venue, 'id'>>): Promise<Venue> => {
  return apiClient(`/venues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(venue),
  });
};

export const deleteVenue = async (id: string): Promise<void> => {
  await apiClient(`/venues/${id}`, { method: 'DELETE' });
};

export const getVenueLayouts = async (venueId: string): Promise<Layout[]> => {
  return apiClient(`/venues/${venueId}/layouts`);
};

export const createVenueLayout = async (venueId: string, layout: Omit<Layout, 'id' | 'venueId'>): Promise<Layout> => {
  return apiClient(`/venues/${venueId}/layouts`, {
    method: 'POST',
    body: JSON.stringify(layout),
  });
};
