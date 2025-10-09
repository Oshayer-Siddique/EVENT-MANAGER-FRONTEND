"use client";

import { useRouter } from "next/navigation";
import { createVenue } from "@/services/venueService";
import VenueForm from "@/components/forms/VenueForm";
import { Venue } from "@/types/venue";

const NewVenuePage = () => {
  const router = useRouter();

  const handleSubmit = async (data: Omit<Venue, "id">) => {
    try {
      await createVenue(data);
      router.push("/admin/venue");
    } catch (error) {
      console.error("Failed to create venue:", error);
      // Handle error (e.g., show notification)
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-700 mb-8">Create Venue</h1>
        <VenueForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewVenuePage;
