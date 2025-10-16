import { apiClient } from './apiClient';
import { BusinessOrganization } from '../types/businessOrganization';

export const getBusinessOrganizations = async (): Promise<BusinessOrganization[]> => {
  return apiClient('/business-organizations');
};

export const getBusinessOrganizationById = async (id: string): Promise<BusinessOrganization> => {
  return apiClient(`/business-organizations/${id}`);
};

export const createBusinessOrganization = async (organization: Omit<BusinessOrganization, 'id'>): Promise<BusinessOrganization> => {
  return apiClient('/business-organizations', {
    method: 'POST',
    body: JSON.stringify(organization),
  });
};

export const updateBusinessOrganization = async (id: string, organization: Partial<Omit<BusinessOrganization, 'id'>>): Promise<BusinessOrganization> => {
  return apiClient(`/business-organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(organization),
  });
};

export const deleteBusinessOrganization = async (id: string): Promise<void> => {
  await apiClient(`/business-organizations/${id}`, { method: 'DELETE' });
};
