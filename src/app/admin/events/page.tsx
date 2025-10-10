"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEvents, deleteEvent } from "@/services/eventService";
import { getVenues } from "@/services/venueService";
import { Event } from "@/types/event";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import Link from "next/link";

interface EnrichedEvent extends Event {
  venueName: string;
  venueAddress: string;
}

const EventsPage = () => {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, venuesData] = await Promise.all([
          getEvents(),
          getVenues(),
        ]);

        const venuesMap = new Map(venuesData.map((v) => [v.id, v]));

        const enrichedEvents = eventsData.map((event) => ({
          ...event,
          venueName: venuesMap.get(event.venueId)?.venueName || "N/A",
          venueAddress: venuesMap.get(event.venueId)?.address || "N/A",
        }));

        setEvents(enrichedEvents);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(id);
        setEvents(events.filter((event) => event.id !== id));
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venueAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Event Management</h1>
        <Link href="/admin/events/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            <PlusCircle className="mr-2" />
            Create Event
          </button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by event, type, code, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-gray-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Event</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{event.eventName}</div>
                  <div className="text-xs text-gray-500">{event.typeName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{event.venueName}</div>
                  <div className="text-xs text-gray-500">{event.venueAddress}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(event.eventStart).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(event.eventEnd).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{event.eventCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                  <button onClick={() => router.push(`/admin/events/${event.id}/edit`)} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No events found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
