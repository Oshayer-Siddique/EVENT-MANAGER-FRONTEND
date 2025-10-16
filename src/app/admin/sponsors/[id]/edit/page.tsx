'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SponsorForm from '@/components/forms/SponsorForm';
import {
  getSponsorById,
  updateSponsor,
} from '@/services/sponsorService';
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
    <div className="container mx-auto p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold mb-6">Edit Sponsor</h1>
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
    </div>
  );
}
