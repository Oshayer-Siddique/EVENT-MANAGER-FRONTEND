"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventManager, createOperator, createEventChecker } from "@/services/userService";
import { ArrowLeft } from "lucide-react";

export default function NewTeamMemberPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    imageUrl: '',
    password: '',
    username: '',
    role: 'EVENT_MANAGER', // Default role
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'EVENT_MANAGEMENT'); // REPLACE WITH YOUR UPLOAD PRESET

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dyqlighvo/image/upload', { // REPLACE WITH YOUR CLOUD NAME
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
    } catch (error) {
      setError('Image upload failed. Please try again.');
      console.error('Cloudinary upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { role, ...rest } = formData;
      const submissionData = { 
        ...rest,
        fullName 
      };

      if (!submissionData.imageUrl) {
        delete (submissionData as Partial<typeof submissionData>).imageUrl;
      }

      if (role === 'EVENT_MANAGER') {
        await createEventManager(submissionData);
      } else if (role === 'OPERATOR') {
        await createOperator(submissionData);
      } else {
        await createEventChecker(submissionData);
      }

      router.push('/admin/team');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create team member";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Team
          </button>
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Add New Team Member</h1>
            <p className="mt-1 text-lg text-slate-500">Create a new event manager or operator profile.</p>
          </div>
        </header>

        <main className="bg-white shadow-lg rounded-xl border border-slate-200">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <SelectField label="Role" id="role" value={formData.role} onChange={handleChange} required>
                <option value="EVENT_MANAGER">Event Manager</option>
                <option value="OPERATOR">Operator</option>
                <option value="EVENT_CHECKER">Event Checker</option>
              </SelectField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="First Name" id="firstName" value={formData.firstName} onChange={handleChange} required />
                <InputField label="Last Name" id="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="Username" id="username" value={formData.username} onChange={handleChange} required />
                <InputField label="Email Address" id="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="Phone Number" id="phone" type="tel" value={formData.phone} onChange={handleChange} />
                <InputField label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Image
                </label>
                <input
                  type="file"
                  id="image"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                {formData.imageUrl && (
                  <div className="mt-4">
                    <img src={formData.imageUrl} alt="Uploaded image" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex justify-end items-center space-x-3">
              {error && <p className="text-sm text-red-600 mr-auto">Error: {error}</p>}
              <button type="button" onClick={() => router.back()} className="px-5 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
                {isLoading ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

const InputField = ({ id, label, type = "text", value, onChange, required = false, placeholder = '' }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input 
          type={type} 
          id={id} 
          value={value} 
          onChange={onChange} 
          required={required} 
          placeholder={placeholder}
          className="block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
        />
    </div>
);

const SelectField = ({ id, label, value, onChange, required = false, children }: any) => (
  <div>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select 
        id={id} 
        value={value} 
        onChange={onChange} 
        required={required} 
        className="block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
      >
        {children}
      </select>
  </div>
);