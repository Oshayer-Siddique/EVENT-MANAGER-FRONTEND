"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BusinessOrganizationForm from "@/components/forms/BusinessOrganizationForm";
import { createBusinessOrganization } from "@/services/businessOrganizationService";
import { BusinessOrganization } from "@/types/businessOrganization";

export default function NewBusinessOrganizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<BusinessOrganization, "id">) => {
    setIsSubmitting(true);
    try {
      await createBusinessOrganization(data);
      router.push("/admin/organizer");
    } catch (error) {
      console.error("Failed to create organization", error);
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Create Organizer</h1>
            <button
                type="submit"
                form="business-organization-form"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                {isSubmitting ? "Saving..." : "Save"}
            </button>
        </div>
      <BusinessOrganizationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
