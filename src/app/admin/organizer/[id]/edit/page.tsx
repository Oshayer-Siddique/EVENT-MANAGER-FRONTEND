"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import BusinessOrganizationForm from "@/components/forms/BusinessOrganizationForm";
import {
  getBusinessOrganizationById,
  updateBusinessOrganization,
} from "@/services/businessOrganizationService";
import { BusinessOrganization } from "@/types/businessOrganization";

export default function EditBusinessOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [organization, setOrganization] = useState<BusinessOrganization | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      getBusinessOrganizationById(id as string)
        .then(setOrganization)
        .catch((error) => {
          console.error("Failed to fetch organization", error);
          // Handle error (e.g., show a not found message)
        });
    }
  }, [id]);

  const handleSubmit = async (data: Partial<Omit<BusinessOrganization, "id">>) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateBusinessOrganization(id as string, data);
      router.push("/admin/organizer");
    } catch (error) {
      console.error("Failed to update organization", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold mb-6">Edit Business Organization</h1>
            {organization ? (
                <BusinessOrganizationForm
                organization={organization}
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
