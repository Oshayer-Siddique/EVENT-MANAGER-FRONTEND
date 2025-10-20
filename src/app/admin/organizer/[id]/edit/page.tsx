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
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Edit Business Organization</h1>
        <button
          type="submit"
          form="business-organization-form"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
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
  );
}
