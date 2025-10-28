"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Menu, X, Clock, Tag, Ticket, MapPin } from "lucide-react";

import { listEvents } from "@/services/eventService";
import { getArtists } from "@/services/artistService";
import { getVenues } from "@/services/venueService";

import type { Event } from "@/types/event";
import type { Artist } from "@/types/artist";
import type { Venue } from "@/types/venue";

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

const getDateParts = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (!Number.isFinite(parsed.getTime())) {
    return { day: "--", month: "--", time: "" };
  }

  return {
    day: parsed.getDate().toString().padStart(2, "0"),
    month: parsed.toLocaleDateString(undefined, { month: "short" }),
    time: parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
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

export default function MelangeHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venueLookup, setVenueLookup] = useState<Record<string, Venue>>({});
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);

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

  return (
    <div className="min-h-screen bg-white">
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
              <a href="#events" className="text-sm font-medium text-gray-700 hover:text-gray-900">Events</a>
              <a href="#artists" className="text-sm font-medium text-gray-700 hover:text-gray-900">Artists</a>
              <a href="#past-events" className="text-sm font-medium text-gray-700 hover:text-gray-900">Past Events</a>
              <a href="#about" className="text-sm font-medium text-gray-700 hover:text-gray-900">About</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Search">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
                Sign In
              </button>
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
              <a href="#events" className="block px-3 py-2 text-base font-medium text-gray-700">Events</a>
              <a href="#artists" className="block px-3 py-2 text-base font-medium text-gray-700">Artists</a>
              <a href="#past-events" className="block px-3 py-2 text-base font-medium text-gray-700">Past Events</a>
              <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-700">About</a>
              <button className="w-full mt-2 px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full">
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Explore Upcomings!
            </h1>
            <p className="text-lg text-gray-600">
              Explore the Universe of Events at Your Fingertips.
            </p>
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
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingEvents.map((event) => {
                const { day, month, time } = getDateParts(event.eventStart);
                const status = getEventStatus(event.eventStart, event.eventEnd);
                const category = event.typeName || "Event";
                const coverImage = event.imageUrls?.[0] || FALLBACK_EVENT_IMAGE;
                const venueName = venueLookup[event.venueId]?.venueName ?? "Venue TBA";
                const priceLabel = getStartingPrice(event);

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
                      <div className="absolute bottom-2 left-2 min-w-[52px] rounded bg-white px-2 py-1 text-center shadow-md">
                        <div className="text-xl font-bold text-gray-900 leading-tight">{day}</div>
                        <div className="text-[10px] uppercase text-gray-600">{month}</div>
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
                        <span>{time}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{priceLabel}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              {eventsError ?? "There are no upcoming events right now. Check back soon!"}
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
      <section className="py-12 bg-gray-50">
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
      <footer className="bg-gray-900 text-white">
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
      `}</style>
    </div>
  );
}
