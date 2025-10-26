'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket as TicketIcon,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listEvents } from '@/services/eventService';
import { getVenueById } from '@/services/venueService';
import type { Event } from '@/types/event';
import type { Venue } from '@/types/venue';

const EVENTS_PER_PAGE = 10;
const HERO_FALLBACK_IMAGE = '/concert.jpg';
const CARD_FALLBACK_IMAGE = '/concert.jpg';

type VenueDictionary = Record<string, Venue>;

type FetchState = 'idle' | 'loading' | 'error' | 'ready';

const formatDateParts = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { date: 'Date TBA', time: '' };
  }

  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

const getStartingPrice = (event: Event) => {
  if (!event.ticketTiers || event.ticketTiers.length === 0) {
    return null;
  }
  const prices = event.ticketTiers
    .map((tier) => tier.price)
    .filter((price) => typeof price === 'number' && !Number.isNaN(price));

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
};

const buildPageNumbers = (currentPage: number, totalPages: number) => {
  const visibleCount = 5;
  if (totalPages <= visibleCount) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, currentPage - Math.floor(visibleCount / 2));
  let end = start + visibleCount - 1;

  if (end > totalPages) {
    end = totalPages;
    start = end - visibleCount + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<VenueDictionary>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchNonce, setFetchNonce] = useState(0);

  useEffect(() => {
    let interrupted = false;

    const loadEvents = async () => {
      setFetchState('loading');
      setErrorMessage(null);

      try {
        const pageResponse = await listEvents(currentPage - 1, EVENTS_PER_PAGE);
        if (interrupted) {
          return;
        }

        const eventList = pageResponse.content ?? [];

        setEvents(eventList);
        setTotalPages(Math.max(pageResponse.totalPages ?? 1, 1));
        setTotalEvents(pageResponse.totalElements ?? eventList.length);

        const uniqueVenueIds = Array.from(
          new Set(eventList.map((event) => event.venueId).filter(Boolean))
        );

        const venueResults = await Promise.all(
          uniqueVenueIds.map(async (venueId) => {
            try {
              const venue = await getVenueById(venueId);
              return { venueId, venue };
            } catch (venueError) {
              console.error(`Failed to load venue ${venueId}`, venueError);
              return null;
            }
          })
        );

        if (interrupted) {
          return;
        }

        setVenues((previous) => {
          const next: VenueDictionary = { ...previous };
          venueResults.forEach((result) => {
            if (result) {
              next[result.venueId] = result.venue;
            }
          });
          return next;
        });

        setFetchState('ready');
      } catch (error) {
        if (interrupted) {
          return;
        }
        console.error('Failed to load events', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load events right now.');
        setFetchState('error');
      }
    };

    loadEvents();

    return () => {
      interrupted = true;
    };
  }, [currentPage, fetchNonce]);

  const heroHighlightEvent = events[0];
  const heroImage = heroHighlightEvent?.imageUrls?.[0] ?? HERO_FALLBACK_IMAGE;
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
  };

  const handleRetry = () => {
    setFetchNonce((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-bold text-blue-600">Melange</span>
            <span className="text-xs text-gray-500">Your gateway to every event</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-700 md:flex">
            <a href="#home" className="hover:text-blue-600">Home</a>
            <a href="#concerts" className="text-blue-600">Concert</a>
            <a href="#concerts" className="hover:text-blue-600">Fair</a>
            <a href="#concerts" className="hover:text-blue-600">Exhibition</a>
            <a href="#concerts" className="hover:text-blue-600">Movie</a>
          </nav>

          <Link href="/signin">
            <Button className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700">Sign In</Button>
          </Link>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="relative h-[60vh] min-h-[380px] w-full overflow-hidden"
        >
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={heroHighlightEvent?.eventName ?? 'Live event crowd'}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex h-full w-full max-w-screen-2xl items-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-lg text-left text-white">
              <p className="text-base font-semibold uppercase tracking-wider text-blue-300">
                Your ticket to every event
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-tight sm:text-6xl">
                Simple, reliable, and quick booking.
              </h1>
              <p className="mt-6 text-lg text-blue-100 sm:text-xl">
                Save time and money while securing your spot for the best events.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 py-16 sm:py-20" id="concerts">
          <div className="mx-auto w-full max-w-screen-xl flex-col gap-8 px-4">
            <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">Upcoming Concerts</h2>

            {fetchState === 'loading' && (
              <div className="space-y-10">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-2/5 bg-gray-200">
                        <div className="h-64 md:h-full" />
                      </div>
                      <div className="w-full space-y-4 p-8 md:w-3/5">
                        <div className="h-5 w-1/4 rounded bg-gray-200" />
                        <div className="h-8 w-3/4 rounded bg-gray-200" />
                        <div className="space-y-2 pt-2">
                          <div className="h-4 w-full rounded bg-gray-200" />
                          <div className="h-4 w-5/6 rounded bg-gray-200" />
                        </div>
                        <div className="h-12 w-40 rounded-lg bg-gray-300 pt-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fetchState === 'error' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
                <h3 className="text-xl font-semibold text-red-700">We hit a snag loading events.</h3>
                <p className="mt-2 text-red-600">{errorMessage}</p>
                <Button className="mt-6 bg-red-600 hover:bg-red-700" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            )}

            {fetchState === 'ready' && events.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-20 text-center">
                <h3 className="text-2xl font-semibold text-gray-700">No events yet</h3>
                <p className="mt-3 text-gray-500">
                  Events published from the admin panel will appear here.
                </p>
              </div>
            )}

            {events.length > 0 && (
              <div className="space-y-10">
                {events.map((event, index) => {
                  const venueName = venues[event.venueId]?.venueName ?? 'Venue TBA';
                  const { date, time } = formatDateParts(event.eventStart);
                  const startingPrice = getStartingPrice(event);
                  const imageUrl = event.imageUrls?.[0] ?? CARD_FALLBACK_IMAGE;
                  const reverseLayout = index % 2 === 1;

                  return (
                    <article
                      key={event.id}
                      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-shadow hover:shadow-xl md:flex-row ${
                        reverseLayout ? 'md:flex-row-reverse' : ''
                      }`}
                    >
                      <div className="relative h-64 w-full md:h-auto md:w-2/5">
                        <Image
                          src={imageUrl}
                          alt={event.eventName}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex w-full flex-col justify-between p-8 md:w-3/5">
                        <div className="flex-grow">
                          <div className="mb-2 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                              {event.typeName}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{event.eventName}</h3>
                          <p className="mt-3 text-gray-600 line-clamp-2">
                            {event.shortDescription ||
                              event.description ||
                              'An unforgettable night with rising stars.'}
                          </p>
                          <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <CalendarDays className="h-4 w-4 text-gray-500" />
                              <span>{`${date} at ${time || 'TBA'}`}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{venueName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            <span className="text-sm text-gray-500">Starts from</span>
                            <p className="text-2xl font-bold text-gray-800">
                              {startingPrice !== null
                                ? `$${startingPrice.toFixed(2)}`
                                : 'Pricing soon'}
                            </p>
                          </div>
                          <Link href={`/events/${event.id}`}>
                            <Button className="bg-blue-600 text-white hover:bg-blue-700">
                              Book Ticket
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-8 mt-12">
                <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {pageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? 'default' : 'outline'}
                      className={pageNumber === currentPage ? 'bg-blue-600 hover:bg-blue-600' : 'border-gray-300'}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-2xl font-bold">Melange</div>
              <p className="mt-3 text-sm text-gray-300">
                Your gateway to the region's best concerts, festivals, and shows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Stay Updated</h4>
              <p className="mt-3 text-sm text-gray-300">Get the latest events in your inbox.</p>
              <form className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" className="bg-blue-600 px-4 text-white hover:bg-blue-700">
                  Join
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Melange. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}