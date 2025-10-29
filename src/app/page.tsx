"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  Clock,
  Tag,
  Ticket,
  MapPin,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Clapperboard,
  Music,
  Dumbbell,
  PartyPopper,
  HandCoins,
  Hammer,
  Shirt,
  GalleryVerticalEnd,
  Presentation,
  BookOpen,
  Trophy,
  Mic,
} from "lucide-react";

import { listEvents } from "@/services/eventService";
import { getArtists } from "@/services/artistService";
import { getVenues } from "@/services/venueService";
import { RichTextContent } from "@/components/ui/RichTextContent";

import type { Event } from "@/types/event";
import type { Artist } from "@/types/artist";
import type { Venue } from "@/types/venue";
import type { LucideIcon } from "lucide-react";

const FALLBACK_EVENT_IMAGE = "/concert.jpg";
const FALLBACK_ARTIST_IMAGE = "/pictures/image.png";

const getEventStatus = (eventStart: string, eventEnd: string) => {
  const now = new Date();
  const start = new Date(eventStart);
  const end = new Date(eventEnd);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return "Scheduled";
  }

  if (now >= start && now <= end) {
    return "Live Now";
  }

  if (now > end) {
    return "Event Ended";
  }

  return "Coming Soon";
};

const getDateParts = (isoDate?: string) => {
  const parsed = isoDate ? new Date(isoDate) : null;
  if (!parsed || !Number.isFinite(parsed.getTime())) {
    return { day: "--", month: "--" };
  }

  return {
    day: parsed.getDate().toString().padStart(2, "0"),
    month: parsed.toLocaleDateString(undefined, { month: "short" }),
  };
};

const getTimeRangeLabel = (startIso?: string, endIso?: string) => {
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;

  const hasValidStart = start && Number.isFinite(start.getTime());
  const hasValidEnd = end && Number.isFinite(end.getTime());

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (hasValidStart && hasValidEnd) {
    return `${formatTime(start!)} - ${formatTime(end!)}`;
  }

  if (hasValidStart) {
    return formatTime(start!);
  }

  if (hasValidEnd) {
    return formatTime(end!);
  }

  return "Time TBA";
};

const getStartingPrice = (event: Event) => {
  if (!event.ticketTiers || event.ticketTiers.length === 0) {
    return "Free";
  }

  const prices = event.ticketTiers
    .map((tier) => Number(tier.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return "Free";
  }

  const minPrice = Math.min(...prices);
  if (minPrice <= 0) {
    return "Free";
  }

  return `Starts at ${minPrice.toLocaleString(undefined, {
    minimumFractionDigits: minPrice % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const EVENT_TYPES: { name: string; Icon: LucideIcon }[] = [
  { name: "Movie", Icon: Clapperboard },
  { name: "Concert", Icon: Music },
  { name: "Sports", Icon: Dumbbell },
  { name: "Festival", Icon: PartyPopper },
  { name: "Fundraising", Icon: HandCoins },
  { name: "Workshop", Icon: Hammer },
  { name: "Fashion Show", Icon: Shirt },
  { name: "Exhibition", Icon: GalleryVerticalEnd },
  { name: "Conference", Icon: Presentation },
  { name: "Seminar", Icon: BookOpen },
  { name: "Competitions", Icon: Trophy },
  { name: "Stand-up Comedy", Icon: Mic },
];

export default function MelangeHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venueLookup, setVenueLookup] = useState<Record<string, Venue>>({});
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSectionNavOpen, setIsSectionNavOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadHomepageData = async () => {
      const [eventsResult, artistsResult, venuesResult] = await Promise.allSettled([
        listEvents(0, 20),
        getArtists(),
        getVenues(),
      ]);

      if (!isActive) {
        return;
      }

      if (eventsResult.status === "fulfilled") {
        setEvents(eventsResult.value.content ?? []);
        setEventsError(null);
      } else {
        console.error("Failed to fetch events for homepage", eventsResult.reason);
        setEvents([]);
        setEventsError("We couldn't load events right now.");
      }
      setIsLoadingEvents(false);

      if (artistsResult.status === "fulfilled") {
        setArtists(artistsResult.value ?? []);
      } else {
        console.warn("Failed to fetch artists for homepage", artistsResult.reason);
        setArtists([]);
      }
      setIsLoadingArtists(false);

      if (venuesResult.status === "fulfilled") {
        const venues = venuesResult.value ?? [];
        setVenueLookup(
          venues.reduce<Record<string, Venue>>((acc, venue) => {
            acc[venue.id] = venue;
            return acc;
          }, {})
        );
      } else {
        console.info("Could not load venues for homepage cards", venuesResult.reason);
        setVenueLookup({});
      }
    };

    loadHomepageData();

    return () => {
      isActive = false;
    };
  }, []);

  const { upcomingEvents, pastEventImages } = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter((event) => {
        const eventEnd = new Date(event.eventEnd);
        return Number.isFinite(eventEnd.getTime()) && eventEnd >= now;
      })
      .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime())
      .slice(0, 12);

    const pastImages = events
      .filter((event) => {
        const eventEnd = new Date(event.eventEnd);
        return Number.isFinite(eventEnd.getTime()) && eventEnd < now;
      })
      .sort((a, b) => new Date(b.eventEnd).getTime() - new Date(a.eventEnd).getTime())
      .flatMap((event) => (event.imageUrls?.[0] ? [event.imageUrls[0]] : []))
      .slice(0, 16);

    return { upcomingEvents: upcoming, pastEventImages: pastImages };
  }, [events]);

  const displayedArtists = useMemo(() => artists.slice(0, 6), [artists]);

  const heroEvent = useMemo(() => {
    const now = new Date();
    const liveEvent = upcomingEvents.find((event) => {
      const start = new Date(event.eventStart);
      const end = new Date(event.eventEnd);
      return (
        Number.isFinite(start.getTime()) &&
        Number.isFinite(end.getTime()) &&
        start <= now &&
        now <= end
      );
    });

    if (liveEvent) {
      return liveEvent;
    }

    return upcomingEvents[0] ?? events[0] ?? null;
  }, [upcomingEvents, events]);
  const heroImage = heroEvent?.imageUrls?.[0] || FALLBACK_EVENT_IMAGE;
  const heroVenueName = heroEvent ? venueLookup[heroEvent.venueId]?.venueName ?? "Venue TBA" : null;
  const heroStart = heroEvent ? new Date(heroEvent.eventStart) : null;
  const heroEnd = heroEvent ? new Date(heroEvent.eventEnd) : null;

  const heroDateLabel = heroEvent
    ? (() => {
        const startLabel = heroStart && Number.isFinite(heroStart.getTime())
          ? heroStart.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
          : null;
        const endLabel = heroEnd && Number.isFinite(heroEnd.getTime())
          ? heroEnd.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
          : null;
        if (startLabel && endLabel && startLabel !== endLabel) {
          return `${startLabel} — ${endLabel}`;
        }
        return startLabel || endLabel || "Discover unforgettable events";
      })()
    : "Discover unforgettable events";

  const heroTimeLabel = heroEvent
    ? getTimeRangeLabel(heroEvent.eventStart, heroEvent.eventEnd)
    : "Seamless ticketing for any occasion";

  const heroCategory = heroEvent?.typeName ?? "Featured Event";
  const heroEventUrl = heroEvent ? `/events/${heroEvent.id}` : "/events";

  const filteredUpcomingEvents = useMemo(() => {
    if (!searchTerm.trim()) {
      return upcomingEvents;
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    return upcomingEvents.filter((event) => {
      const venueName = venueLookup[event.venueId]?.venueName ?? "";
      const haystack = [
        event.eventName,
        event.typeName,
        event.eventDescription,
        venueName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedTerm);
    });
  }, [searchTerm, upcomingEvents, venueLookup]);

  const handleScrollTo = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  }, []);

  const sectionNavItems = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "events", label: "Events" },
      { id: "artists", label: "Artists" },
      { id: "past-events", label: "Highlights" },
      { id: "offerings", label: "Services" },
      { id: "footer", label: "Contact" },
    ],
    []
  );

  const handleCategoryScroll = (direction: "left" | "right") => {
    const container = categoryScrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top utility bar */}
      <div className="bg-gray-900 text-gray-100">
        <div className="mx-auto flex items-center justify-between gap-4 px-4 py-2 text-[11px] sm:text-xs sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="hidden items-center gap-1 text-gray-300 sm:inline-flex">
              <MapPin className="h-3.5 w-3.5" /> Dhaka, Bangladesh
            </span>
            <span className="hidden items-center gap-1 text-gray-300 md:inline-flex">
              <Clock className="h-3.5 w-3.5" /> Serving events round the clock
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <Tag className="h-3.5 w-3.5" /> Exclusive experiences made simple
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleScrollTo("events")}
              className="hidden text-gray-300 transition hover:text-white sm:inline"
            >
              Browse Events
            </button>
            <Link href="/admin" className="hidden text-gray-300 transition hover:text-white sm:inline">
              Become an Organizer
            </Link>
            <a href="mailto:support@melange.com" className="rounded-full border border-white/20 px-3 py-1 text-gray-100 transition hover:border-white hover:text-white">
              Customer Support
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Melange</h1>
                <p className="text-xs text-gray-500">Tickets Made Easy</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => handleScrollTo("overview")} className="text-sm font-medium text-gray-700 transition hover:text-gray-900">
                Overview
              </button>
              <button onClick={() => handleScrollTo("events")} className="text-sm font-medium text-gray-700 transition hover:text-gray-900">
                Events
              </button>
              <button onClick={() => handleScrollTo("artists")} className="text-sm font-medium text-gray-700 transition hover:text-gray-900">
                Artists
              </button>
              <button onClick={() => handleScrollTo("past-events")} className="text-sm font-medium text-gray-700 transition hover:text-gray-900">
                Highlights
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/signin" className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full transition-colors hover:bg-gray-800">
                Sign In
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" aria-label="Toggle navigation">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <button onClick={() => handleScrollTo("overview")} className="block w-full px-3 py-2 text-left text-base font-medium text-gray-700">
                Overview
              </button>
              <button onClick={() => handleScrollTo("events")} className="block w-full px-3 py-2 text-left text-base font-medium text-gray-700">
                Events
              </button>
              <button onClick={() => handleScrollTo("artists")} className="block w-full px-3 py-2 text-left text-base font-medium text-gray-700">
                Artists
              </button>
              <button onClick={() => handleScrollTo("past-events")} className="block w-full px-3 py-2 text-left text-base font-medium text-gray-700">
                Highlights
              </button>
              <Link href="/signin" className="mt-2 block w-full rounded-full bg-gray-900 px-6 py-2 text-center text-sm font-medium text-white">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="overview" className="relative isolate overflow-hidden border-b border-gray-100 bg-gray-950">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={heroEvent?.eventName ?? "Melange Event Poster"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/65 to-black/25" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-center lg:px-8 lg:py-28">
          <div className="max-w-3xl space-y-6 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              <CalendarDays className="h-3.5 w-3.5" /> {heroCategory}
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {heroEvent?.eventName ?? "Explore Upcomings!"}
            </h1>
            <RichTextContent
              content={heroEvent?.eventDescription}
              className="rich-text-body rich-text-light text-sm text-gray-100/80 sm:text-base"
              emptyFallback="Explore the universe of events at your fingertips. Discover the latest concerts, conferences, and cultural moments curated for you."
            />
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-100/80 sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <CalendarDays className="h-4 w-4" /> {heroDateLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Clock className="h-4 w-4" /> {heroTimeLabel}
              </span>
              {heroVenueName && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <MapPin className="h-4 w-4" /> {heroVenueName}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={heroEventUrl}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Explore Event <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/events#events-grid"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Browse All Events
              </Link>
            </div>

            <div className="max-w-lg rounded-full bg-white/20 p-1 backdrop-blur">
              <div className="flex items-center rounded-full bg-white/80 px-3 py-2">
                <Search className="mr-2 h-4 w-4 text-gray-500" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search events, venues, or categories"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {heroEvent && (
            <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-6 text-white/90 backdrop-blur lg:block">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/70">Event Snapshot</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-white/60" />
                  <div>
                    <p className="font-semibold text-white">{heroDateLabel}</p>
                    <p className="text-white/70">{heroTimeLabel}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-white/60" />
                  <div>
                    <p className="font-semibold text-white">{heroVenueName}</p>
                    <p className="text-white/70">Secure entry with digital ticketing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket className="mt-0.5 h-4 w-4 text-white/60" />
                  <div>
                    <p className="font-semibold text-white">Tickets</p>
                    <p className="text-white/70">{getStartingPrice(heroEvent)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Event Type Carousel */}
      <section className="border-b border-gray-100 bg-white">
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900"></h2>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => handleCategoryScroll("left")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:text-gray-900"
                aria-label="Scroll event types left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCategoryScroll("right")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:text-gray-900"
                aria-label="Scroll event types right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent" />
            <div
              ref={categoryScrollRef}
              className="category-scroll flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-2"
            >
              {EVENT_TYPES.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex min-w-[90px] flex-col items-center justify-center gap-2 text-center text-gray-700 transition hover:text-gray-900"
                >
                  <Icon className="h-8 w-8" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section - Compact Tickify Style */}
      <section id="events" className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-lg border border-gray-200 bg-white">
                  <div className="h-40 w-full bg-gray-100" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="h-3 w-1/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUpcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredUpcomingEvents.map((event) => {
                const { day: startDay, month: startMonth } = getDateParts(event.eventStart);
                const { day: endDay, month: endMonth } = getDateParts(event.eventEnd);
                const status = getEventStatus(event.eventStart, event.eventEnd);
                const category = event.typeName || "Event";
                const coverImage = event.imageUrls?.[0] || FALLBACK_EVENT_IMAGE;
                const venueName = venueLookup[event.venueId]?.venueName ?? "Venue TBA";
                const priceLabel = getStartingPrice(event);
                const timeRange = getTimeRangeLabel(event.eventStart, event.eventEnd);
                const showsDistinctEnd = endDay !== "--" && (endDay !== startDay || endMonth !== startMonth);

                return (
                  <Link
                    href={`/events/${event.id}`}
                    key={event.id}
                    className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative h-40">
                      <img
                        src={coverImage}
                        alt={event.eventName}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 flex gap-2">
                        <div className="min-w-[52px] rounded bg-white px-2 py-1 text-center shadow-md">
                          <div className="text-xl font-bold text-gray-900 leading-tight">{startDay}</div>
                          <div className="text-[10px] uppercase text-gray-600">{startMonth}</div>
                        </div>
                        {showsDistinctEnd && (
                          <div className="min-w-[52px] rounded bg-white/90 px-2 py-1 text-center shadow-md">
                            <div className="text-xl font-bold text-gray-900 leading-tight">{endDay}</div>
                            <div className="text-[10px] uppercase text-gray-600">{endMonth}</div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {category}
                      </div>
                      <div
                        className={`absolute top-2 left-2 rounded px-2 py-1 text-xs font-semibold text-white ${
                          status === "Live Now" ? "bg-red-500" : status === "Coming Soon" ? "bg-blue-500" : "bg-gray-500"
                        }`}
                      >
                        {status}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{venueName}</span>
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
                        {event.eventName}
                      </h3>
                      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeRange}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{priceLabel}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              {searchTerm.trim()
                ? "No events match your search yet. Try a different keyword or clear the search."
                : eventsError ?? "There are no upcoming events right now. Check back soon!"}
            </div>
          )}
        </div>
      </section>

      {/* Past Events Gallery - Tickify Style */}
      <section id="past-events" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Flagship Events in Review: Made Easy with Melange Ticketing
            </h2>
            <p className="text-gray-600 text-sm">
              We&apos;re proud to showcase the success of our previous flagship events
            </p>
          </div>
          
          {/* Scrolling Gallery */}
          {pastEventImages.length > 0 ? (
            <div className="relative overflow-hidden">
              <div className="flex gap-3 animate-scroll">
                {[...pastEventImages, ...pastEventImages].map((img, idx) => (
                  <div key={`${img}-${idx}`} className="w-64 flex-shrink-0">
                    <img
                      src={img || FALLBACK_EVENT_IMAGE}
                      alt={`Past event ${idx + 1}`}
                      className="h-40 w-full rounded-lg object-cover shadow-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              We will update this space as soon as events wrap up.
            </div>
          )}
        </div>
      </section>

      {/* Featured Artists Section - Smaller Cards */}
      <section id="artists" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Artists & Performers</h2>
            <p className="mt-2 text-gray-600 text-sm">Meet the talent behind the unforgettable experiences</p>
          </div>
          {isLoadingArtists ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="animate-pulse text-center">
                  <div className="aspect-square w-full rounded-xl bg-gray-100" />
                  <div className="mt-3 h-3 rounded bg-gray-100" />
                  <div className="mt-2 h-2 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : displayedArtists.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {displayedArtists.map((artist) => (
                <div key={artist.id} className="group cursor-pointer text-center">
                  <div className="relative mb-3 overflow-hidden rounded-xl">
                    <img
                      src={artist.imageUrl || FALLBACK_ARTIST_IMAGE}
                      alt={artist.name}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {(artist.facebookLink || artist.instagramLink || artist.youtubeLink || artist.websiteLink) && (
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pb-4">
                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-900">
                          Connect
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{artist.name}</h3>
                  {artist.description && (
                    <p className="mb-1 text-xs text-gray-600 line-clamp-2">{artist.description}</p>
                  )}
                  <p className="text-[10px] uppercase text-gray-500">{artist.mobile || artist.email || "Stay tuned"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              Artists will appear here once they are published in the dashboard.
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Tickify Style */}
      <section id="offerings" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Offerings</h2>
            <p className="mt-2 text-gray-600 text-sm">Explore the key features that make Melange the perfect choice!</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-gray-900 rounded-full flex items-center justify-center">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Easy Ticket Purchase</h3>
              <p className="text-gray-600 text-sm">Browse and purchase tickets for a variety of events with ease.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-gray-900 rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Instant Delivery</h3>
              <p className="text-gray-600 text-sm">Receive tickets immediately via email or WhatsApp.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-gray-900 rounded-full flex items-center justify-center">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Multiple Payment Methods</h3>
              <p className="text-gray-600 text-sm">Flexible payment options for secure transactions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-3">Melange</h3>
              <p className="text-sm text-gray-400">
                Your gateway to unforgettable experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Newsletter</h4>
              <p className="text-xs text-gray-400 mb-3">Get event updates</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-500"
                />
                <button className="px-4 py-2 bg-white text-gray-900 text-xs font-medium rounded-full hover:bg-gray-100">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-800 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Melange. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Section Navigation */}
      <div className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 md:block">
        <div className="flex items-center gap-3 pl-0">
          <button
            type="button"
            onClick={() => setIsSectionNavOpen(open => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-gray-900/90 text-white shadow-lg transition hover:bg-gray-800"
            aria-label={isSectionNavOpen ? "Hide section navigation" : "Show section navigation"}
          >
            {isSectionNavOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div
            className={`transform rounded-2xl border border-white/20 bg-gray-900/95 p-4 text-xs uppercase tracking-wide text-white shadow-xl transition-all duration-300 ${
              isSectionNavOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0"
            }`}
          >
            <nav className="flex flex-col gap-3">
              {sectionNavItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScrollTo(item.id)}
                  className="text-left font-semibold text-white/80 transition hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <Link
                href="/signup"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-400"
              >
                Register Interest
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .category-scroll {
          scrollbar-width: none;
        }
        .category-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
