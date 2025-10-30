"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import LayoutForm, { LayoutFormSubmitData } from "@/components/forms/LayoutForm";
import { Layout } from "@/types/layout";
import { Venue } from "@/types/venue";
import { deleteVenueLayout, getSeatLayoutById, getVenueById, updateVenueLayout } from "@/services/venueService";
import { replaceSeatsFromPlan } from "@/lib/seating";

const EditLayoutPage = () => {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  const layoutId = params.layoutId as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId || !layoutId) return;

    const load = async () => {
      try {
        const [venueData, layoutData] = await Promise.all([
          getVenueById(venueId),
          getSeatLayoutById(layoutId),
        ]);
        setVenue(venueData);
        setLayout(layoutData);
      } catch (error) {
        console.error("Failed to load layout for editing:", error);
        alert("Unable to load this seating layout. Please try again.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [layoutId, router, venueId]);

  const handleSubmit = async ({ layout: updatedLayout, theaterPlan }: LayoutFormSubmitData) => {
    if (!venueId || !layoutId) return;
    try {
      await updateVenueLayout(venueId, layoutId, updatedLayout);

      if (theaterPlan) {
        try {
          await replaceSeatsFromPlan(layoutId, theaterPlan);
        } catch (seatError) {
          console.error("Failed to update seats:", seatError);
          alert(
            "Layout details saved, but seats could not be regenerated. If this layout is attached to an active event or existing tickets, please detach it first and try again.",
          );
        }
      }

      router.push(`/admin/venue/${venueId}/layout/${layoutId}`);
    } catch (error) {
      console.error("Failed to update layout:", error);
      alert("Failed to update layout. Please try again.");
    }
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!venue || !layout) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><p>Layout not found.</p></div>;
  }

  const handleDelete = async () => {
    if (!window.confirm("Delete this seating layout? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteVenueLayout(venueId, layoutId);
      router.push(`/admin/venue/${venueId}`);
    } catch (error) {
      console.error("Failed to delete layout:", error);
      alert("Failed to delete layout. Please try again.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-4 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl bg-white px-6 py-8 shadow-lg lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Edit Seating Layout</h1>
            <p className="text-lg text-gray-600">{layout.layoutName} · {venue.venueName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin/venue/${venueId}`)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              ← Back to layouts
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white"
            >
              Delete Layout
            </button>
          </div>
        </div>
        <div className="mt-8">
          <LayoutForm onSubmit={handleSubmit} initialData={layout} venueMaxCapacity={venue?.maxCapacity ? parseInt(venue.maxCapacity, 10) : 0} />
        </div>
      </div>
    </div>
  );
};

export default EditLayoutPage;
