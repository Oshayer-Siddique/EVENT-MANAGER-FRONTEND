'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { listEvents, deleteEvent, Page } from '@/services/eventService';
import { getVenues } from '@/services/venueService';
import { Event } from '@/types/event';
import { PlusCircle, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, CalendarDays, Sparkles, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatDateRange, formatTime } from '@/lib/utils/dateUtils';

type EnrichedEvent = Event & {
  venueName: string;
  venueAddress: string;
};

const EventsPage = () => {
  const [eventPage, setEventPage] = useState<Page<EnrichedEvent>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching events for page:', currentPage);
        const [eventsPageData, venuesData] = await Promise.all([
          listEvents(currentPage, 10),
          getVenues(),
        ]);

        console.log('Events data from API:', eventsPageData);
        console.log('Venues data from API:', venuesData);

        const venuesMap = new Map(venuesData.map((v) => [v.id, v]));

        const enrichedEvents = eventsPageData.content.map((event) => ({
          ...event,
          venueName: venuesMap.get(event.venueId)?.venueName || 'N/A',
          venueAddress: venuesMap.get(event.venueId)?.address || 'N/A',
        }));

        console.log('Enriched events:', enrichedEvents);
        setEventPage({ ...eventsPageData, content: enrichedEvents });
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (err instanceof Error) {
            setError(`Failed to load events: ${err.message}`);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  const stats = useMemo(() => {
    const total = eventPage?.totalElements ?? 0;
    const content = eventPage?.content ?? [];
    const now = Date.now();
    const upcoming = content.filter((event) => new Date(event.eventStart).getTime() > now).length;
    const live = content.filter((event) => {
      const start = new Date(event.eventStart).getTime();
      const end = new Date(event.eventEnd).getTime();
      return start <= now && end >= now;
    }).length;
    const venuesCovered = new Set(content.map((event) => event.venueId)).size;

    return [
      {
        label: 'Total Events',
        value: total,
        icon: CalendarDays,
        description: 'Scheduled experiences across your platform.',
      },
      {
        label: 'Live / Upcoming',
        value: `${live}/${upcoming}`,
        icon: Sparkles,
        description: 'Sessions currently running or about to start.',
      },
      {
        label: 'Venues Featured',
        value: venuesCovered,
        icon: MapPin,
        description: 'Unique venues represented on this page.',
      },
    ];
  }, [eventPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        // Refetch the current page
        const eventsPageData = await listEvents(currentPage, 10);
        const venuesData = await getVenues();
        const venuesMap = new Map(venuesData.map((v) => [v.id, v]));
        const enrichedEvents = eventsPageData.content.map((event) => ({
          ...event,
          venueName: venuesMap.get(event.venueId)?.venueName || 'N/A',
          venueAddress: venuesMap.get(event.venueId)?.address || 'N/A',
        }));
        setEventPage({ ...eventsPageData, content: enrichedEvents });

      } catch (err) {
        console.error("Failed to delete event:", err);
        if (err instanceof Error) {
            alert(`Failed to delete event: ${err.message}`);
        } else {
            alert('An unknown error occurred');
        }
      }
    }
  };

  const filteredEvents = eventPage?.content.filter(
    (event) =>
      event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venueAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Current eventPage state:', eventPage);
  console.log('Filtered events for rendering:', filteredEvents);

  return (
    <div className="space-y-8 p-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Experience Planner</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Event Management</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Track everything from headline festivals to curated workshops. Stay on top of timelines, venues, and codes in one dashboard.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5F7F] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            <PlusCircle className="h-4 w-4" /> Create Event
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, description }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
                <Icon className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-white/70">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event, type, code, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredEvents?.length ?? 0}</span> of {" "}
          <span className="font-semibold text-slate-700">{eventPage?.totalElements ?? 0}</span> events
        </p>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents?.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{event.eventName}</div>
                    <div className="text-xs text-gray-500">{event.typeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{event.venueName}</div>
                    <div className="text-xs text-gray-500">{event.venueAddress}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    {formatDateRange(new Date(event.eventStart), new Date(event.eventEnd))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    {formatTime(new Date(event.eventStart))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    {formatTime(new Date(event.eventEnd))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{event.eventCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                    <button onClick={() => router.push(`/admin/events/${event.id}`)} className="p-2 text-green-600 rounded-full transition" title="View"><Eye size={18} /></button>
                    <button onClick={() => router.push(`/admin/events/${event.id}/edit`)} className="p-2 text-blue-600 rounded-full transition" title="Edit"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-red-600 rounded-full transition" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!filteredEvents || filteredEvents.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found.</p>
            </div>
          )}
        </div>
      )}
      {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={!eventPage || currentPage >= eventPage.totalPages - 1}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{eventPage ? eventPage.number * eventPage.size + 1 : 0}</span> to <span className="font-medium">{eventPage ? eventPage.number * eventPage.size + eventPage.content.length : 0}</span> of {' '}
                        <span className="font-medium">{eventPage?.totalElements}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 0}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {/* Current page number could be displayed here */}
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={!eventPage || currentPage >= eventPage.totalPages - 1}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EventsPage;
