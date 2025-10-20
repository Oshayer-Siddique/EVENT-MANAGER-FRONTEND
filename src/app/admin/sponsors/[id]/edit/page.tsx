'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SponsorForm from '@/components/forms/SponsorForm';
import { getSponsorById, updateSponsor } from '@/services/sponsorService';
import { Sponsor } from '@/types/sponsor';

export default function EditSponsorPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [sponsor, setSponsor] = useState<Sponsor | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      getSponsorById(id as string)
        .then(setSponsor)
        .catch((error) => {
          console.error('Failed to fetch sponsor', error);
          // Handle error (e.g., show a not found message)
        });
    }
  }, [id]);

  const handleSubmit = async (data: Partial<Omit<Sponsor, 'id'>>) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateSponsor(id as string, data);
      router.push('/admin/sponsors');
    } catch (error) {
      console.error('Failed to update sponsor', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Edit Sponsor</h1>
        <button
          type="submit"
          form="sponsor-form"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
      {sponsor ? (
        <SponsorForm
          sponsor={sponsor}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
