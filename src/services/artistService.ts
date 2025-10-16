import { apiClient } from './apiClient';
import { Artist } from '../types/artist';

export const getArtists = async (): Promise<Artist[]> => {
  return apiClient('/artists');
};

export const getArtistById = async (id: string): Promise<Artist> => {
  return apiClient(`/artists/${id}`);
};

export const createArtist = async (artist: Omit<Artist, 'id'>): Promise<Artist> => {
  return apiClient('/artists', {
    method: 'POST',
    body: JSON.stringify(artist),
  });
};

export const updateArtist = async (id: string, artist: Partial<Omit<Artist, 'id'>>): Promise<Artist> => {
  return apiClient(`/artists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(artist),
  });
};

export const deleteArtist = async (id: string): Promise<void> => {
  await apiClient(`/artists/${id}`, { method: 'DELETE' });
};
