"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import LayoutForm, { LayoutFormSubmitData } from "@/components/forms/LayoutForm";
import { Layout } from "@/types/layout";
import { Venue } from "@/types/venue";
import { deleteVenueLayout, getSeatLayoutById, getVenueById, updateVenueLayout } from "@/services/venueService";
import { replaceSeatsFromPlan } from "@/lib/seating";
import { saveHybridLayout } from '@/services/hybridLayoutService';

const EditLayoutPage = () => {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  const layoutId = params.layoutId as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingSeats, setIsRegeneratingSeats] = useState(false);
  const [isDeletingLayout, setIsDeletingLayout] = useState(false);

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

  const handleSubmit = async ({ layout: updatedLayout, theaterPlan, hybridLayout }: LayoutFormSubmitData) => {
    if (!venueId || !layoutId) return;
    setIsSubmitting(true);
    try {
      await updateVenueLayout(venueId, layoutId, updatedLayout);

      if (updatedLayout.typeName === 'Hybrid' && hybridLayout) {
        try {
          setIsRegeneratingSeats(true);
          await saveHybridLayout(layoutId, hybridLayout);
        } finally {
          setIsRegeneratingSeats(false);
        }
      } else if (theaterPlan) {
        try {
          setIsRegeneratingSeats(true);
          await replaceSeatsFromPlan(layoutId, theaterPlan);
        } catch (seatError) {
          console.error("Failed to update seats:", seatError);
          const seatErrorDetails =
            seatError && typeof seatError === "object" && "details" in seatError && Array.isArray((seatError as Record<string, unknown>).details)
              ? (seatError as { details: string[] }).details
              : [];

          let alertMessage =
            "Layout details saved, but seats could not be regenerated. If this layout is attached to an active event or existing tickets, please detach it first and try again.";

          if (seatError && typeof seatError === "object" && "code" in seatError) {
            const code = (seatError as Record<string, unknown>).code;
            if (code === "SEAT_DELETE_FAILED") {
              alertMessage =
                seatErrorDetails.length > 0
                  ? `Layout details saved, but some existing seats could not be removed (first issue: ${seatErrorDetails[0]}). This can happen if a seat is reserved, assigned to an event, or already removed in a concurrent update. Refresh and try again once the seat is free.`
                  : "Layout details saved, but some existing seats could not be removed. This usually means the layout is tied to active events or issued tickets. Detach those assignments, then retry.";
            } else if (code === "SEAT_CREATE_FAILED") {
              alertMessage =
                seatErrorDetails.length > 0
                  ? `Layout details saved, but ${seatErrorDetails.length} seat${seatErrorDetails.length === 1 ? "" : "s"} failed to regenerate (first issue: ${seatErrorDetails[0]}). Review the seat map manually.`
                  : "Layout details saved, but some seats failed to regenerate. Review the seat map manually.";
            }
          }

          alert(alertMessage);
        } finally {
          setIsRegeneratingSeats(false);
        }
      }

      router.push(`/admin/venue/${venueId}/layout/${layoutId}`);
    } catch (error) {
      console.error("Failed to update layout:", error);
      alert("Failed to update layout. Please try again.");
    } finally {
      setIsSubmitting(false);
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
    setIsDeletingLayout(true);
    try {
      await deleteVenueLayout(venueId, layoutId);
      router.push(`/admin/venue/${venueId}`);
    } catch (error) {
      console.error("Failed to delete layout:", error);
      alert("Failed to delete layout. Please try again.");
    } finally {
      setIsDeletingLayout(false);
    }
  };

  return (
    <div className="relative bg-gray-50 min-h-screen px-4 py-8 lg:px-8">
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
              disabled={isDeletingLayout}
              className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-red-500 disabled:hover:text-white"
            >
              {isDeletingLayout ? "Deleting…" : "Delete Layout"}
            </button>
          </div>
        </div>
        <div className="mt-8">
          <LayoutForm onSubmit={handleSubmit} initialData={layout} venueMaxCapacity={venue?.maxCapacity ? parseInt(venue.maxCapacity, 10) : 0} />
        </div>
      </div>

      {(isSubmitting || isRegeneratingSeats || isDeletingLayout) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-6 py-4 text-center shadow-lg">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {isDeletingLayout ? "Deleting layout" : isRegeneratingSeats ? "Regenerating seats" : "Updating layout"}
            </p>
            <p className="mt-2 text-lg font-bold text-slate-800">
              {isDeletingLayout
                ? "Seats and seating layout are getting deleted. This may take a moment."
                : isRegeneratingSeats
                  ? "Hang tight while we rebuild every seat for this layout."
                  : "Please wait…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLayoutPage;
