export const clientEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
};

export const getCloudinaryUploadUrl = () =>
  clientEnv.cloudinaryCloudName
    ? `https://api.cloudinary.com/v1_1/${clientEnv.cloudinaryCloudName}/image/upload`
    : '';
