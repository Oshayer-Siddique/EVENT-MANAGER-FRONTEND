import { apiClient } from './apiClient';
import { Sponsor } from '../types/sponsor';

export const getSponsors = async (): Promise<Sponsor[]> => {
  return apiClient('/sponsors');
};

export const getSponsorById = async (id: string): Promise<Sponsor> => {
  return apiClient(`/sponsors/${id}`);
};

export const createSponsor = async (sponsor: Omit<Sponsor, 'id'>): Promise<Sponsor> => {
  return apiClient('/sponsors', {
    method: 'POST',
    body: JSON.stringify(sponsor),
  });
};

export const updateSponsor = async (id: string, sponsor: Partial<Omit<Sponsor, 'id'>>): Promise<Sponsor> => {
  return apiClient(`/sponsors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sponsor),
  });
};

export const deleteSponsor = async (id: string): Promise<void> => {
  await apiClient(`/sponsors/${id}`, { method: 'DELETE' });
};
