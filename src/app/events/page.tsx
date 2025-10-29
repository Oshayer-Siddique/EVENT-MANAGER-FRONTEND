'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  Mail,
  Phone,
  Search,
  Filter,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { listEvents } from '@/services/eventService';
import type { Event } from '@/types/event';

const HERO_IMAGE = '/concert.jpg';
const CARD_BASE_CLASS =
  'rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60 transition hover:-translate-y-[1px] hover:shadow-xl';
const PAGE_SIZE = 9;

type EventStatus = 'upcoming' | 'live' | 'past';

type EventViewModel = {
  event: Event;
  status: EventStatus;
  start: Date;
  end: Date;
  lowestPrice: number | null;
};

const statusOrder: Record<EventStatus, number> = {
  upcoming: 0,
  live: 1,
  past: 2,
};

function determineStatus(start: Date, end: Date): EventStatus {
  const now = Date.now();
  if (start.getTime() > now) {
    return 'upcoming';
  }
  if (start.getTime() <= now && end.getTime() >= now) {
    return 'live';
  }
  return 'past';
}

const statusLabel: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  past: 'Past',
};

const statusBadgeClass: Record<EventStatus, string> = {
  upcoming: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  live: 'bg-orange-50 text-orange-700 border-orange-100',
  past: 'bg-slate-100 text-slate-600 border-slate-200',
};

type EventViewModel = {
  event: Event;
  status: EventStatus;
  start: Date;
  end: Date;
  lowestPrice: number | null;
  descriptionText: string;
};

const htmlToPlainText = (html?: string | null) => {
  if (!html) {
    return '';
  }

  const temporary = document.createElement('div');
  temporary.innerHTML = html;
  const text = temporary.textContent || temporary.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
};

function formatDateRange(start: Date, end: Date) {
  const sameDay = start.toDateString() === end.toDateString();
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  const formattedStartDate = start.toLocaleDateString(undefined, dateOptions);
  const formattedStartTime = start.toLocaleTimeString([], timeOptions);
  const formattedEndTime = end.toLocaleTimeString([], timeOptions);

  return {
    date: sameDay
      ? formattedStartDate
      : `${formattedStartDate} – ${end.toLocaleDateString(undefined, dateOptions)}`,
    time: `${formattedStartTime} - ${formattedEndTime}`,
  };
}

const EventsPage = () => {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsPage = await listEvents(0, 200);
        const mapped = (eventsPage.content ?? []).map<EventViewModel>(event => {
          const start = new Date(event.eventStart);
          const end = new Date(event.eventEnd);
          const status = determineStatus(start, end);
          const lowestPrice = event.ticketTiers?.length
            ? Math.min(...event.ticketTiers.map(t => Number(t.price)))
            : null;
          return {
            event,
            status,
            start,
            end,
            lowestPrice: Number.isFinite(lowestPrice) ? lowestPrice : null,
            descriptionText: htmlToPlainText(event.eventDescription),
          };
        });

        mapped.sort((a, b) => {
          const statusComparison = statusOrder[a.status] - statusOrder[b.status];
          if (statusComparison !== 0) {
            return statusComparison;
          }
          // Within same status, sort by start ascending for upcoming/live, descending for past
          if (a.status === 'past' && b.status === 'past') {
            return b.end.getTime() - a.end.getTime();
          }
          return a.start.getTime() - b.start.getTime();
        });

        setEvents(mapped);
      } catch (fetchError) {
        console.error('Failed to fetch events:', fetchError);
        setError('We could not load events right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return events.filter(({ event, status }) => {
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [event.eventName, event.typeName, event.eventDescription]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [events, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
        <p className="animate-pulse text-lg">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-900/60 bg-slate-950/95 text-slate-100 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm sm:px-6">
          <Link href="/" className="text-base font-semibold text-slate-100">
            Event Manager
          </Link>
          <nav className="hidden items-center gap-5 text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/events#events-grid" className="transition hover:text-white">
              Events
            </Link>
            <Link href="/profile" className="transition hover:text-white">
              My Tickets
            </Link>
            <a href="#events-grid" className="transition hover:text-white">
              Browse
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-full border border-slate-100/20 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-white sm:inline-flex"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <Image src={HERO_IMAGE} alt="Explore events" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/40" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-wide text-slate-200/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Ticket className="h-4 w-4" /> Discover curated experiences
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Filter className="h-4 w-4" /> Filter by status or search instantly
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Explore Events</h1>
            <p className="max-w-2xl text-sm text-slate-200/90">
              Explore the universe of experiences at your fingertips. Browse live shows, upcoming gatherings, and memorable past
              events all in one place.
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto w-full max-w-6xl -mt-10 flex-1 px-4 pb-16 sm:-mt-14 sm:px-6">
        <section className={`${CARD_BASE_CLASS} px-5 py-6`}
          aria-label="Event filters"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { label: 'All', value: 'all' as const },
                  { label: 'Upcoming', value: 'upcoming' as const },
                  { label: 'Live', value: 'live' as const },
                  { label: 'Past', value: 'past' as const },
                ] as const
              ).map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    statusFilter === filter.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="relative flex w-full max-w-sm items-center" htmlFor="event-search">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                id="event-search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search events..."
                className="w-full rounded-full border border-slate-200 bg-white px-10 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
        </section>

        <section id="events-grid" className="mt-10">
          {paginatedEvents.length === 0 ? (
            <div className={`${CARD_BASE_CLASS} flex items-center justify-center px-6 py-16 text-center`}>
              <p className="text-sm text-slate-500">
                {error ?? 'No events match your filters yet. Try adjusting the filters or check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginatedEvents.map(({ event, status, start, end, lowestPrice, descriptionText }) => {
                const { date, time } = formatDateRange(start, end);
                const coverImage = event.imageUrls?.[0] ?? HERO_IMAGE;
                return (
                  <article key={event.id} className={`${CARD_BASE_CLASS} flex h-full flex-col overflow-hidden`}>
                    <div className="relative h-44 overflow-hidden">
                      <Image src={coverImage} alt={event.eventName} fill className="object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
                          {event.typeName}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusBadgeClass[status]}`}
                        >
                          {statusLabel[status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 px-5 py-6">
                      <div className="space-y-2">
                        <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{event.eventName}</h2>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {descriptionText || 'Detailed description coming soon. Stay tuned for more info.'}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{event.typeName} · {event.venueId ? 'Venue confirmed' : 'Venue TBA'}</span>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          {lowestPrice !== null ? (
                            <>
                              Starts from{' '}
                              <span className="text-base font-semibold text-slate-900">${lowestPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            'Pricing to be announced'
                          )}
                        </p>
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                        >
                          View Event
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  currentPage === page
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-900/60 bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-4">
              <Link href="/" className="text-lg font-semibold text-white">
                Event Manager
              </Link>
              <p className="text-sm text-slate-400">
                Seamless ticketing for unforgettable experiences. Discover, book, and enjoy events curated just for you.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Quick links</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>
              <Link href="/events#events-grid" className="transition hover:text-white">
                Browse events
              </Link>
                </li>
                <li>
                  <Link href="/profile" className="transition hover:text-white">
                    My account
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-white">
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <a href="mailto:support@eventmanager.com" className="hover:text-white">
                    support@eventmanager.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <a href="tel:+1234567890" className="hover:text-white">
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>123 Event Lane, Suite 500, New York, NY</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-900/60 pt-6 text-xs text-slate-500 sm:flex-row">
            <p className="text-slate-400">© {new Date().getFullYear()} Event Manager. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventsPage;
