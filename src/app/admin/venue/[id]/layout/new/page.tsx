"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createVenueLayout, getVenueById } from "@/services/venueService";
import LayoutForm from "@/components/forms/LayoutForm";
import { Layout } from "@/types/layout";
import { Venue } from "@/types/venue";

const NewLayoutPage = () => {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (venueId) {
      getVenueById(venueId)
        .then(setVenue)
        .catch(err => console.error("Failed to fetch venue", err))
        .finally(() => setLoading(false));
    }
  }, [venueId]);

  const handleSubmit = async (data: Omit<Layout, "id" | "venueId">) => {
    if (!venueId) return;
    try {
      await createVenueLayout(venueId, data);
      router.push(`/admin/venue/${venueId}`);
      // Optionally, add a success notification
    } catch (error) {
      console.error("Failed to create layout:", error);
      // Handle error (e.g., show notification)
    }
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Create New Seating Layout</h1>
        <p className="text-lg text-gray-600 mb-8">For: {venue?.venueName}</p>
        <LayoutForm onSubmit={handleSubmit} venueMaxCapacity={venue?.maxCapacity ? parseInt(venue.maxCapacity, 10) : 0} />
      </div>
    </div>
  );
};

export default NewLayoutPage;
