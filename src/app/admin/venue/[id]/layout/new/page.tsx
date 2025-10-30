"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createVenueLayout, getVenueById } from "@/services/venueService";
import LayoutForm, { LayoutFormSubmitData } from "@/components/forms/LayoutForm";
import { Venue } from "@/types/venue";
import { createSeatsFromPlan } from "@/lib/seating";

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

  const handleSubmit = async ({ layout, theaterPlan }: LayoutFormSubmitData) => {
    if (!venueId) return;
    try {
      const createdLayout = await createVenueLayout(venueId, layout);

      if (theaterPlan && theaterPlan.seats.length > 0) {
        try {
          await createSeatsFromPlan(createdLayout.id, theaterPlan);
        } catch (seatError) {
          console.error("Failed to persist seats:", seatError);
          alert("Layout saved, but seats could not be generated automatically. Please review the layout manually.");
        }
      }

      router.push(`/admin/venue/${venueId}/layout/${createdLayout.id}`);
    } catch (error) {
      console.error("Failed to create layout:", error);
      alert("Failed to create layout. Please try again.");
    }
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen px-4 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl bg-white px-6 py-8 shadow-lg lg:px-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Create New Seating Layout</h1>
        <p className="text-lg text-gray-600 mb-8">For: {venue?.venueName}</p>
        <LayoutForm onSubmit={handleSubmit} venueMaxCapacity={venue?.maxCapacity ? parseInt(venue.maxCapacity, 10) : 0} />
      </div>
    </div>
  );
};

export default NewLayoutPage;
