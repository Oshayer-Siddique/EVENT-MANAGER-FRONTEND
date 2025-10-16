"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Artist } from "@/types/artist";
import { useRouter } from "next/navigation";
import { createArtist, updateArtist } from "@/services/artistService";
import { Upload } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  description: z.string().min(1, "Description is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(1, "Mobile number is required"),
  address: z.string().min(1, "Address is required"),
  facebookLink: z.string().url().optional().or(z.literal("")),
  instagramLink: z.string().url().optional().or(z.literal("")),
  youtubeLink: z.string().url().optional().or(z.literal("")),
  websiteLink: z.string().url().optional().or(z.literal("")),
  imageUrl: z.any().optional(),
});

type ArtistFormValues = z.infer<typeof formSchema>;

interface ArtistFormProps {
  initialData?: Artist;
}

export const ArtistForm: React.FC<ArtistFormProps> = ({ initialData }) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      email: "",
      mobile: "",
      address: "",
      facebookLink: "",
      instagramLink: "",
      youtubeLink: "",
      websiteLink: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: ArtistFormValues) => {
    try {
      if (initialData) {
        await updateArtist(initialData.id, data);
      } else {
        await createArtist(data);
      }
      router.push("/admin/artist");
      router.refresh();
    } catch (error) {
      console.error("Failed to save artist:", error);
    }
  };

  return (
    <form id="artist-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Artist Name
          </label>
          <input
            id="name"
            {...register("name")}
            placeholder="Enter name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
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
            Upload Profile Picture
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                    <label htmlFor="imageUrl" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="imageUrl" {...register("imageUrl")} type="file" className="sr-only" />
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
};