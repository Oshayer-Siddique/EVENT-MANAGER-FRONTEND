
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "../../../../services/eventService";
import { Event } from "../../../../types/event";
import { Button } from "@/components/ui/button";

export default function NewEventPage() {
  const router = useRouter();
  const [event, setEvent] = useState<Omit<Event, 'id'>>({
    typeCode: "",
    typeName: "",
    eventCode: "",
    eventName: "",
    eventStart: "",
    eventEnd: "",
    venueId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createEvent(event);
      router.push("/admin/events");
    } catch (err) {
      setError("Failed to create event.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Event</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input type="text" name="eventName" id="eventName" value={event.eventName} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="eventCode" className="block text-sm font-medium text-gray-700 mb-1">Event Code</label>
              <input type="text" name="eventCode" id="eventCode" value={event.eventCode} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="typeCode" className="block text-sm font-medium text-gray-700 mb-1">Type Code</label>
              <input type="text" name="typeCode" id="typeCode" value={event.typeCode} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
              <input type="text" name="typeName" id="typeName" value={event.typeName} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="venueId" className="block text-sm font-medium text-gray-700 mb-1">Venue ID</label>
              <input type="text" name="venueId" id="venueId" value={event.venueId} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" name="eventStart" id="eventStart" value={event.eventStart} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" name="eventEnd" id="eventEnd" value={event.eventEnd} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-4 text-right">{error}</p>}
        </form>
      </div>
    </div>
  );
}
