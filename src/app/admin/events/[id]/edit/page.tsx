
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEventById, updateEvent } from "@/services/eventService";
import { Event } from "@/types/event";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [event, setEvent] = useState<Partial<Omit<Event, 'id'>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const data = await getEventById(id as string);
          const eventStart = new Date(data.eventStart).toISOString().slice(0, 16);
          const eventEnd = new Date(data.eventEnd).toISOString().slice(0, 16);
          setEvent({...data, eventStart, eventEnd});
        } catch (err) {
          setError("Failed to fetch event.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updateEvent(id as string, event);
        router.push("/admin/events");
      }
    } catch (err) {
      setError("Failed to update event.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Event</h1>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
              <input type="text" name="eventName" id="eventName" value={event.eventName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="eventCode" className="block text-sm font-medium text-gray-700">Event Code</label>
              <input type="text" name="eventCode" id="eventCode" value={event.eventCode || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="typeCode" className="block text-sm font-medium text-gray-700">Type Code</label>
              <input type="text" name="typeCode" id="typeCode" value={event.typeCode || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="typeName" className="block text-sm font-medium text-gray-700">Type Name</label>
              <input type="text" name="typeName" id="typeName" value={event.typeName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="venueId" className="block text-sm font-medium text-gray-700">Venue ID</label>
              <input type="text" name="venueId" id="venueId" value={event.venueId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700">Start Time</label>
              <input type="datetime-local" name="eventStart" id="eventStart" value={event.eventStart || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-.sm" required />
            </div>
            <div>
              <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700">End Time</label>
              <input type="datetime-local" name="eventEnd" id="eventEnd" value={event.eventEnd || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
}
