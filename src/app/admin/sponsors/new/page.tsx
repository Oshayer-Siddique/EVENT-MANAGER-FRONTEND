'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SponsorForm from '@/components/forms/SponsorForm';
import { createSponsor } from '@/services/sponsorService';
import { Sponsor } from '@/types/sponsor';

export default function NewSponsorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<Sponsor, 'id'>) => {
    setIsSubmitting(true);
    try {
      await createSponsor(data);
      router.push('/admin/sponsors');
    } catch (error) {
      console.error('Failed to create sponsor', error);
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Create Sponsor</h1>
            <button
                type="submit"
                form="sponsor-form"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                {isSubmitting ? 'Saving...' : 'Save'}
            </button>
        </div>
      <SponsorForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
