"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";

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

const normalizeText = (value?: string | null) => (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

type EventCategory = {
  name: string;
  Icon: LucideIcon;
  gradient: string;
  iconClass: string;
  ringClass: string;
  keywords: string[];
};

const EVENT_TYPES: EventCategory[] = [

  {
    name: "Concert",
    Icon: Music,
    gradient: "from-rose-500/20 via-rose-500/10 to-rose-500/0",
    iconClass: "text-rose-500",
    ringClass: "ring-rose-200/70",
    keywords: ["concert", "music", "live"],
  },
  {
    name: "Movie",
    Icon: Clapperboard,
    gradient: "from-indigo-500/20 via-indigo-500/10 to-indigo-500/0",
    iconClass: "text-indigo-600",
    ringClass: "ring-indigo-200/70",
    keywords: ["movie", "film", "cinema", "premiere"],
  },
    {
    name: "Fashion Show",
    Icon: Shirt,
    gradient: "from-pink-500/20 via-pink-500/10 to-pink-500/0",
    iconClass: "text-pink-500",
    ringClass: "ring-pink-200/70",
    keywords: ["fashion", "runway", "style"],
  },

  {
    name: "Festival",
    Icon: PartyPopper,
    gradient: "from-amber-500/20 via-amber-500/10 to-amber-500/0",
    iconClass: "text-amber-500",
    ringClass: "ring-amber-200/70",
    keywords: ["festival", "fest", "fair"],
  },
  {
    name: "Fundraising",
    Icon: HandCoins,
    gradient: "from-purple-500/20 via-purple-500/10 to-purple-500/0",
    iconClass: "text-purple-500",
    ringClass: "ring-purple-200/70",
    keywords: ["fundraising", "fundraiser", "charity", "donation"],
  },
    {
    name: "Sports",
    Icon: Dumbbell,
    gradient: "from-emerald-500/20 via-emerald-500/10 to-emerald-500/0",
    iconClass: "text-emerald-500",
    ringClass: "ring-emerald-200/70",
    keywords: ["sport", "match", "game", "fitness"],
  },
    {
    name: "Exhibition",
    Icon: GalleryVerticalEnd,
    gradient: "from-cyan-500/20 via-cyan-500/10 to-cyan-500/0",
    iconClass: "text-cyan-500",
    ringClass: "ring-cyan-200/70",
    keywords: ["exhibition", "expo", "gallery", "art"],
  },
  {
    name: "Workshop",
    Icon: Hammer,
    gradient: "from-sky-500/20 via-sky-500/10 to-sky-500/0",
    iconClass: "text-sky-500",
    ringClass: "ring-sky-200/70",
    keywords: ["workshop", "training", "class", "bootcamp"],
  },


  {
    name: "Conference",
    Icon: Presentation,
    gradient: "from-teal-500/20 via-teal-500/10 to-teal-500/0",
    iconClass: "text-teal-500",
    ringClass: "ring-teal-200/70",
    keywords: ["conference", "business", "summit", "forum"],
  },
  {
    name: "Seminar",
    Icon: BookOpen,
    gradient: "from-blue-500/20 via-blue-500/10 to-blue-500/0",
    iconClass: "text-blue-500",
    ringClass: "ring-blue-200/70",
    keywords: ["seminar", "talk", "lecture"],
  },

];

export default function MelangeHomepage() {
  const { user: currentUser } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venueLookup, setVenueLookup] = useState<Record<string, Venue>>({});
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSectionNavOpen, setIsSectionNavOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const signedInName = useMemo(() => {
    if (!currentUser) {
      return "";
    }
    if (currentUser.fullName && currentUser.fullName.trim().length > 0) {
      const [first] = currentUser.fullName.trim().split(" ");
      return first || currentUser.fullName;
    }
    return currentUser.username ?? currentUser.email;
  }, [currentUser]);
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
      .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime());

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

  const categoryKeywordLookup = useMemo(() => {
    return EVENT_TYPES.reduce<Record<string, string[]>>((acc, category) => {
      acc[category.name] = category.keywords.map(keyword => normalizeText(keyword));
      return acc;
    }, {});
  }, []);

  const filteredUpcomingEvents = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    const baseEvents = trimmedSearch
      ? upcomingEvents.filter((event) => {
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
          return haystack.includes(trimmedSearch.toLowerCase());
        })
      : upcomingEvents;

    if (!selectedCategory) {
      return baseEvents.slice(0, 12);
    }

    const normalizedCategorySlug = normalizeText(selectedCategory);
    const categoryKeywords = categoryKeywordLookup[selectedCategory] ?? [];
    const matches: Event[] = [];
    const others: Event[] = [];
    baseEvents.forEach((event) => {
      const eventCategory = event.typeName?.toLowerCase() ?? '';
      const eventCategorySlug = normalizeText(event.typeName);
      const eventCode = event.typeCode?.toLowerCase() ?? '';
      const eventCodeSlug = normalizeText(event.typeCode);
      const eventNameSlug = normalizeText(event.eventName);
      const normalizedNameMatch = Boolean(eventCategorySlug)
        ? eventCategorySlug.includes(normalizedCategorySlug) || normalizedCategorySlug.includes(eventCategorySlug)
        : false;
      const normalizedCodeMatch = Boolean(eventCodeSlug)
        ? eventCodeSlug.includes(normalizedCategorySlug) || normalizedCategorySlug.includes(eventCodeSlug)
        : false;
      const keywordMatch = categoryKeywords.some((keyword) => {
        const normalizedKeyword = keyword;
        return (
          eventCategorySlug.includes(normalizedKeyword) ||
          eventCodeSlug.includes(normalizedKeyword) ||
          eventNameSlug.includes(normalizedKeyword)
        );
      });

      if (normalizedNameMatch || normalizedCodeMatch || keywordMatch) {
        matches.push(event);
      } else {
        others.push(event);
      }
    });

    const prioritized = matches.length > 0 ? [...matches, ...others] : baseEvents;
    return prioritized.slice(0, 12);
  }, [searchTerm, upcomingEvents, venueLookup, selectedCategory, categoryKeywordLookup]);

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
  const primaryNavItems = sectionNavItems.slice(0, 4);

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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 md:py-4">
            <div className="flex min-w-[200px] flex-1 items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full px-4 py-2 transition hover:opacity-90"
                aria-label="Ticketify homepage"
              >
                <Image
                  src="/pictures/ticketify%20logo-01.svg"
                  alt="Ticketify logo"
                  width={100}
                  height={20}
                  priority
                />
              </Link>
              <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                {/* <span className="text-sm font-semibold tracking-tight text-gray-900">Ticketify</span> */}
                <span className="text-xs font-semibold text-gray-500">GET IN GET EXCITED</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-inner lg:flex">
              {primaryNavItems.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleScrollTo(id)}
                  className="rounded-full px-3 py-1 text-sm text-gray-600 transition hover:bg-white hover:text-gray-900"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden flex-shrink-0 items-center gap-3 md:flex">

              {currentUser ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900"
                  >
                    My tickets
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                  >
                    Hi, {signedInName || 'there'}
                  </Link>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex flex-shrink-0 items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-700 shadow-sm transition hover:bg-gray-50"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-b border-gray-200/70 bg-white/95 px-4 pb-4 pt-2 text-sm shadow-sm backdrop-blur md:hidden">
            {primaryNavItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleScrollTo(id)}
                className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left font-medium text-gray-700 last:border-none"
              >
                {label}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
            <div className="mt-3 space-y-2">
              <Link
                href="/admin"
                className="block w-full rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700"
              >
                Host with Ticketify
              </Link>
              {currentUser ? (
                <>
                  <Link
                    href="/profile"
                    className="block w-full rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-800"
                  >
                    My tickets
                  </Link>
                  <Link
                    href="/profile"
                    className="block w-full rounded-full bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white"
                  >
                    Hi, {signedInName || 'there'}
                  </Link>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="block w-full rounded-full bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
              )}
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
              // content={heroEvent?.eventDescription}
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
              {EVENT_TYPES.map(({ name, Icon, gradient, iconClass, ringClass }) => {
                const isActive = selectedCategory === name;
                return (
                  <button
                  key={name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory((prev) => (prev === name ? null : name));
                      handleScrollTo("events");
                    }}
                    className={`group flex min-w-[100px] flex-col items-center justify-center gap-3 text-center text-gray-700 transition hover:text-gray-900 ${
                      isActive ? "text-gray-900" : ""
                    }`}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${gradient} ring-2 ring-inset ${
                        isActive ? `${ringClass} ring-offset-2 ring-offset-white` : ringClass
                      } shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-md`}
                    >
                      <Icon className={`h-7 w-7 ${iconClass}`} aria-hidden />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section - Compact Tickify Style */}
      <section id="events" className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedCategory && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 mb-4">
              <span>
                Showing <span className="font-semibold">{selectedCategory}</span> events first.
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-emerald-900 underline decoration-dotted decoration-emerald-500 hover:text-emerald-700"
              >
                Clear filter
              </button>
            </div>
          )}
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
                  <div key={`${img}-${idx}`} className="w-48 flex-shrink-0 sm:w-64">
                    <img
                      src={img || FALLBACK_EVENT_IMAGE}
                      alt={`Past event ${idx + 1}`}
                      className="h-32 w-full rounded-lg object-cover shadow-md sm:h-40"
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
              <h3 className="text-lg font-bold mb-3">Ticketify</h3>
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
              <div className="flex flex-col gap-2 sm:flex-row">
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
            © {new Date().getFullYear()} Ticketify. All rights reserved.
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
