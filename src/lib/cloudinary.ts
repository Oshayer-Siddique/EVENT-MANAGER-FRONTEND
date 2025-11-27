'use client';

import { clientEnv, getCloudinaryUploadUrl } from './env';

const CLOUDINARY_UPLOAD_URL = getCloudinaryUploadUrl();

export const CLOUDINARY_CONFIG_ERROR_MESSAGE =
  'Cloudinary configuration is missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.';

const ensureConfig = () => {
  if (!CLOUDINARY_UPLOAD_URL || !clientEnv.cloudinaryUploadPreset) {
    throw new Error(CLOUDINARY_CONFIG_ERROR_MESSAGE);
  }
};

export const uploadImageToCloudinary = async (file: File) => {
  ensureConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', clientEnv.cloudinaryUploadPreset);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Failed to upload image');
  }

  return data.secure_url as string;
};

export const isCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_UPLOAD_URL && clientEnv.cloudinaryUploadPreset);
