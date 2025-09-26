
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, Calendar, Ticket, DollarSign } from "lucide-react";
import { getEvents, deleteEvent } from "../../../services/eventService";
import { Event } from "../../../types/event";
import { Button } from "@/components/ui/button";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError("Failed to fetch events.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(id);
        setEvents(events.filter((event) => event.id !== id));
      } catch (err) {
        setError("Failed to delete event.");
        console.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Events</h1>
        <Link href="/admin/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>
      
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard key={event.id} event={event} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

const EventCard = ({ event, onDelete }: { event: Event, onDelete: (id: string) => void }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
    <div className="p-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{event.eventName}</h2>
        <div className="flex-shrink-0 space-x-2">
          <Link href={`/admin/events/${event.id}/edit`}>
            <Button variant="outline" className="px-2 py-1 text-sm">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" className="px-2 py-1 text-sm text-red-600 border-red-600 hover:bg-red-50" onClick={() => onDelete(event.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{event.typeName}</p>

      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <span>{new Date(event.eventStart).toLocaleString()} - {new Date(event.eventEnd).toLocaleString()}</span>
        </div>
        <div className="flex items-center">
          <Ticket className="w-4 h-4 mr-2 text-gray-500" />
          <span>Event Code: {event.eventCode}</span>
        </div>
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
          <span>Venue ID: {event.venueId}</span>
        </div>
      </div>
    </div>
  </div>
);

