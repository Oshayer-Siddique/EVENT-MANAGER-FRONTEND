"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getVenueById, updateVenue } from "@/services/venueService";
import VenueForm from "@/components/forms/VenueForm";
import { Venue } from "@/types/venue";

const EditVenuePage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchVenue = async () => {
        try {
          const data = await getVenueById(id);
          setVenue(data);
        } catch (error) {
          console.error("Failed to fetch venue:", error);
          // Handle error
        } finally {
          setLoading(false);
        }
      };
      fetchVenue();
    }
  }, [id]);

  const handleSubmit = async (data: Omit<Venue, "id">) => {
    if (!id) return;
    try {
      await updateVenue(id, data);
      router.push("/admin/venue");
    } catch (error) {
      console.error("Failed to update venue:", error);
      // Handle error
    }
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!venue) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center">Venue not found.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-700 mb-8">Edit Venue</h1>
        <VenueForm onSubmit={handleSubmit} initialData={venue} />
      </div>
    </div>
  );
};

export default EditVenuePage;
