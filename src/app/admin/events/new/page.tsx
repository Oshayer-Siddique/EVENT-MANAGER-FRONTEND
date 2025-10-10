"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/services/eventService";
import { getVenues } from "@/services/venueService";
import { Event } from "@/types/event";
import { Venue } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

interface EventFormData {
  typeCode: string;
  typeName: string;
  eventCode: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  venueId: string;
}

// A more refined and professional style for form inputs
const inputClasses = "block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";

export default function NewEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({ /* ... */ });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenuesData = async () => {
      try {
        const venuesData = await getVenues();
        setVenues(venuesData);
      } catch (err) {
        console.error("Failed to fetch venues:", err);
        setError("Error: Could not load venue data.");
      }
    };
    fetchVenuesData();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, venueId: selectedVenueId || "" }));
  }, [selectedVenueId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.venueId) {
      setError("A venue must be selected.");
      return;
    }
    setLoading(true);
    const dataToSend = {
      ...formData,
      eventStart: new Date(formData.eventStart).toISOString(),
      eventEnd: new Date(formData.eventEnd).toISOString(),
    };
    try {
      await createEvent(dataToSend);
      router.push("/admin/events");
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 ml-2">Create New Event</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Column: Event Form */}
            <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold leading-7 text-gray-900">Event Information</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Fill in the details for your new event.</p>
              <div className="mt-8 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="eventName" className="block text-sm font-medium leading-6 text-gray-900">Event Name</label>
                  <div className="mt-2">
                    <input type="text" name="eventName" id="eventName" value={formData.eventName} onChange={handleInputChange} className={inputClasses} placeholder="e.g., Annual Tech Conference" required />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="eventCode" className="block text-sm font-medium leading-6 text-gray-900">Event Code</label>
                  <div className="mt-2">
                    <input type="text" name="eventCode" id="eventCode" value={formData.eventCode} onChange={handleInputChange} className={inputClasses} placeholder="e.g., TC2025" required />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="typeName" className="block text-sm font-medium leading-6 text-gray-900">Type Name</label>
                  <div className="mt-2">
                    <input type="text" name="typeName" id="typeName" value={formData.typeName} onChange={handleInputChange} className={inputClasses} placeholder="e.g., Conference" required />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="typeCode" className="block text-sm font-medium leading-6 text-gray-900">Type Code</label>
                  <div className="mt-2">
                    <input type="text" name="typeCode" id="typeCode" value={formData.typeCode} onChange={handleInputChange} className={inputClasses} placeholder="e.g., CONF" required />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="eventStart" className="block text-sm font-medium leading-6 text-gray-900">Start Time</label>
                  <div className="mt-2">
                    <input type="datetime-local" name="eventStart" id="eventStart" value={formData.eventStart} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="eventEnd" className="block text-sm font-medium leading-6 text-gray-900">End Time</label>
                  <div className="mt-2">
                    <input type="datetime-local" name="eventEnd" id="eventEnd" value={formData.eventEnd} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Venue Selection */}
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold leading-7 text-gray-900">Venue</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Choose a venue for this event.</p>
                <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 -mr-2">
                    {venues.length > 0 ? venues.map((venue) => (
                    <div
                        key={venue.id}
                        onClick={() => setSelectedVenueId(venue.id)}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedVenueId === venue.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <div>
                            <div className="font-semibold text-sm text-gray-900">{venue.venueName}</div>
                            <p className="text-sm text-gray-600 mt-1">{venue.address}</p>
                        </div>
                        {selectedVenueId === venue.id && <Check className="h-5 w-5 text-indigo-600" />}
                    </div>
                    )) : <p className="text-sm text-gray-500">Loading venues...</p>}
                </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-x-6">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="button" variant="ghost" onClick={() => router.push("/admin/events")}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
              {loading ? "Saving..." : "Save Event"}
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
}