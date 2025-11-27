'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { BusinessOrganization } from '@/types/businessOrganization';
import { Upload } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  facebookLink: z.string().url().optional().or(z.literal('')),
  instagramLink: z.string().url().optional().or(z.literal('')),
  youtubeLink: z.string().url().optional().or(z.literal('')),
  websiteLink: z.string().url().optional().or(z.literal('')),
  imageUrl: z.any().optional(),
});

interface BusinessOrganizationFormProps {
  organization?: BusinessOrganization;
  onSubmit: (data: Omit<BusinessOrganization, 'id'>) => void;
  isSubmitting: boolean;
}

export default function BusinessOrganizationForm({
  organization,
  onSubmit,
  isSubmitting,
}: BusinessOrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: organization || {},
  });

  const imageUrl = watch('imageUrl');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setValue("imageUrl", uploadedUrl);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="business-organization-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Organizer Name
          </label>
          <input
            id="name"
            {...register("name")}
            placeholder="Enter name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="facebookLink" className="block text-sm font-medium text-gray-700">
            Facebook Link
          </label>
          <input
            id="facebookLink"
            {...register("facebookLink")}
            placeholder="Enter facebook link"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.facebookLink && <p className="text-red-500 text-xs mt-1">{errors.facebookLink.message}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description/Bio
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="Enter bio"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="instagramLink" className="block text-sm font-medium text-gray-700">
            Instagram Link
          </label>
          <input
            id="instagramLink"
            {...register("instagramLink")}
            placeholder="Enter instagram link"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.instagramLink && <p className="text-red-500 text-xs mt-1">{errors.instagramLink.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="youtubeLink" className="block text-sm font-medium text-gray-700">
            YouTube Link
          </label>
          <input
            id="youtubeLink"
            {...register("youtubeLink")}
            placeholder="Enter youtube link"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.youtubeLink && <p className="text-red-500 text-xs mt-1">{errors.youtubeLink.message}</p>}
        </div>
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
            Mobile No
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <select className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                <option>+61</option>
            </select>
            <input
                id="mobile"
                {...register("mobile")}
                placeholder="Enter mobile no"
                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="websiteLink" className="block text-sm font-medium text-gray-700">
            Website Link
          </label>
          <input
            id="websiteLink"
            {...register("websiteLink")}
            placeholder="Enter website link"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.websiteLink && <p className="text-red-500 text-xs mt-1">{errors.websiteLink.message}</p>}
        </div>
        <div className="md:col-span-1">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            {...register("address")}
            rows={4}
            placeholder="Enter address"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
            Upload Logo
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {isLoading ? (
                <p>Uploading...</p>
              ) : imageUrl ? (
                <img src={imageUrl} alt="Uploaded image" className="w-32 h-32 object-cover rounded-lg mx-auto" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
              )}
                <div className="flex text-sm text-gray-600">
                    <label htmlFor="imageUrl" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="imageUrl" type="file" className="sr-only" onChange={handleImageUpload} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
