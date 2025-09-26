"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventManager } from "@/services/userService";

export default function NewTeamMemberPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    fullName: '',
    imageUrl: '',
    password: '',
    username: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const submissionData = { ...formData };
      if (!submissionData.imageUrl) {
        delete (submissionData as Partial<typeof submissionData>).imageUrl;
      }
      await createEventManager(submissionData);
      router.push('/admin/team');
    } catch (err: any) {
      setError(err.message || "Failed to create event manager");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Event Manager</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-blue-900">
              <InputField label="Username" id="username" value={formData.username} onChange={handleChange} required />
              <InputField label="Full Name" id="fullName" value={formData.fullName} onChange={handleChange} required />
              <InputField label="First Name" id="firstName" value={formData.firstName} onChange={handleChange} />
              <InputField label="Last Name" id="lastName" value={formData.lastName} onChange={handleChange} />
              <InputField label="Email Address" id="email" type="email" value={formData.email} onChange={handleChange} required />
              <InputField label="Phone Number" id="phone" type="tel" value={formData.phone} onChange={handleChange} required />
              <InputField label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />
              <InputField label="Image URL" id="imageUrl" value={formData.imageUrl} onChange={handleChange} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="pt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
                  {isLoading ? 'Creating...' : 'Create Manager'}
              </button>
          </div>
      </form>
    </div>
  );
}

const InputField = ({ id, label, type = "text", value, onChange, required = false }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={id} value={value} onChange={onChange} required={required} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);