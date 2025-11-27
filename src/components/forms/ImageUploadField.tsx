'use client'

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface ImageUploadFieldProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ value, onChange }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const uploadedUrl = await uploadImageToCloudinary(file);
            onChange([...value, uploadedUrl]);
        } catch (error) {
            console.error('Cloudinary upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                Upload Images
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    {isLoading ? (
                        <p>Uploading...</p>
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
            <div className="mt-4 flex flex-wrap gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative w-32 h-32">
                        <img src={url} alt={`Uploaded image ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
};
