import { apiClient } from './apiClient';
import { deleteSeatForLayout, getSeatsForLayout } from './seatService';
import { Venue } from '../types/venue';
import { Layout } from '../types/layout';

const SEAT_DELETE_CHUNK_SIZE = 25;

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

export const getSeatLayoutById = async (layoutId: string): Promise<Layout> => {
  return apiClient(`/seat-layouts/${layoutId}`);
};

export const createVenueLayout = async (venueId: string, layout: Omit<Layout, 'id' | 'venueId'>): Promise<Layout> => {
  return apiClient(`/venues/${venueId}/layouts`, {
    method: 'POST',
    body: JSON.stringify(layout),
  });
};

export const updateVenueLayout = async (
  venueId: string,
  layoutId: string,
  layout: Partial<Omit<Layout, 'id' | 'venueId'>>,
): Promise<Layout> => {
  return apiClient(`/venues/${venueId}/layouts/${layoutId}`, {
    method: 'PUT',
    body: JSON.stringify(layout),
  });
};

export const deleteVenueLayout = async (venueId: string, layoutId: string): Promise<void> => {
  try {
    const seats = await getSeatsForLayout(layoutId);
    for (let index = 0; index < seats.length; index += SEAT_DELETE_CHUNK_SIZE) {
      const chunk = seats.slice(index, index + SEAT_DELETE_CHUNK_SIZE);
      await Promise.all(chunk.map(seat => deleteSeatForLayout(layoutId, seat.id)));
    }
  } catch (error) {
    console.warn(`Failed to fetch seats for layout ${layoutId} before deletion. Continuing with layout delete.`, error);
  }

  await apiClient(`/venues/${venueId}/layouts/${layoutId}`, {
    method: 'DELETE',
  });
};
