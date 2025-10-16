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
              <InputField label="Image URL" id="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.png" />
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