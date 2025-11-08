'use client';

import { useCallback, useEffect, useMemo, useRef, useState, use } from 'react';
import type { ComponentType, MouseEvent, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Share2,
  Twitter,
  Link as LinkIcon,
} from 'lucide-react';

import { getEvent, getEventTicketDetails, listEvents } from '@/services/eventService';
import { getBusinessOrganizationById } from '@/services/businessOrganizationService';
import { getArtistById } from '@/services/artistService';
import { getVenueById } from '@/services/venueService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEventSeats } from '@/hooks/useEventSeats';

import type { Event, EventTicketDetails, EventTicketTier } from '@/types/event';
import type { BusinessOrganization } from '@/types/businessOrganization';
import type { Artist } from '@/types/artist';
import type { Venue } from '@/types/venue';
import { Button } from '@/components/ui/button';

import { EventSeat, EventSeatStatus } from '@/types/eventSeat';
import { RichTextContent } from '@/components/ui/RichTextContent';

interface EventDetailPageProps {
  params: { id: string };
}

const FALLBACK_HERO = '/concert.jpg';
const ORGANIZER_PLACEHOLDER = '/globe.svg';
const CARD_BASE_CLASS = 'rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-slate-200/60';

// Simple accordion using <details>/<summary>
const Accordion = ({
  title,
  children,
  defaultOpen = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) => (
  <details
    className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60 transition hover:-translate-y-[1px] hover:shadow-xl focus-within:shadow-xl ${className}`}
    {...(defaultOpen ? { open: true } : {})}
  >
    <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition group-open:bg-slate-50">
      {title}
      <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-slate-600">{children}</div>
  </details>
);


function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [organizers, setOrganizers] = useState<BusinessOrganization[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const { user: currentUser } = useCurrentUser();

  const router = useRouter();
  const suggestionsScrollRef = useRef<HTMLDivElement | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);

  useEffect(() => {
    if (!id) return;
    let interrupted = false;

    const loadEvent = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const eventData = await getEvent(id);
        if (interrupted) return;
        setEvent(eventData);

        const [details, venueData] = await Promise.all([
          getEventTicketDetails(id).catch(() => null),
          eventData?.venueId ? getVenueById(eventData.venueId).catch(() => null) : Promise.resolve(null),
        ]);
        if (interrupted) return;
        setTicketDetails(details);
        setVenue(venueData);
      } catch (error) {
        if (interrupted) return;
        console.error('Failed to load event', error);
        setErrorMessage('We could not load this event right now. Please try again later.');
        setEvent(null);
      } finally {
        if (!interrupted) setLoading(false);
      }
    };

    loadEvent();
    return () => {
      interrupted = true;
    };
  }, [id]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!event) {
      return;
    }

    let interrupted = false;

    const loadUpcoming = async () => {
      setLoadingUpcoming(true);
      try {
        const upcomingPage = await listEvents(0, 20);
        if (interrupted) return;

        const now = Date.now();
        const suggestions = upcomingPage.content
          .filter(item => item.id !== event.id && new Date(item.eventStart).getTime() >= now)
          .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime())
          .slice(0, 8);

        setUpcomingEvents(suggestions);
      } catch (upcomingError) {
        if (interrupted) return;
        console.error('Failed to load upcoming events', upcomingError);
        setUpcomingEvents([]);
      } finally {
        if (!interrupted) {
          setLoadingUpcoming(false);
        }
      }
    };

    const loadOrganizers = async () => {
      setLoadingOrganizers(true);
      try {
        if (!event.organizerIds || event.organizerIds.length === 0) {
          if (!interrupted) {
            setOrganizers([]);
          }
          return;
        }

        const results = await Promise.all(
          event.organizerIds.map(organizerId =>
            getBusinessOrganizationById(organizerId).catch(error => {
              console.error('Failed to load organizer', organizerId, error);
              return null;
            }),
          ),
        );

        if (!interrupted) {
          setOrganizers(results.filter(Boolean) as BusinessOrganization[]);
        }
      } finally {
        if (!interrupted) {
          setLoadingOrganizers(false);
        }
      }
    };

    const loadArtists = async () => {
      if (!event.artistIds || event.artistIds.length === 0) {
        setArtists([]);
        return;
      }

      setLoadingArtists(true);
      try {
        const results = await Promise.all(
          event.artistIds.map(artistId =>
            getArtistById(artistId).catch(error => {
              console.error('Failed to load artist', artistId, error);
              return null;
            }),
          ),
        );
        if (!interrupted) {
          setArtists(results.filter(Boolean) as Artist[]);
        }
      } finally {
        if (!interrupted) {
          setLoadingArtists(false);
        }
      }
    };

    loadUpcoming();
    loadOrganizers();
    loadArtists();

    return () => {
      interrupted = true;
    };
  }, [event]);

  const tiers: EventTicketTier[] = useMemo(() => {
    return ticketDetails?.ticketTiers ?? event?.ticketTiers ?? [];
  }, [event?.ticketTiers, ticketDetails?.ticketTiers]);

  const seatLayoutTypeName = ticketDetails?.seatLayout?.typeName?.toLowerCase();
  const seatLayoutTypeCode = ticketDetails?.seatLayout?.typeCode;
  const isFreestyleLayout = seatLayoutTypeName === 'freestyle' || seatLayoutTypeCode === '220';
  const allowDirectPurchase = isFreestyleLayout || (!ticketDetails?.seatLayout && !event?.seatLayoutId);
  const normalizeTierKey = useCallback((value?: string | null) => (value ?? '').trim().toLowerCase(), []);
  const fallbackTierKey = '__default__';

  const {
    seats: liveSeatInventory,
    loading: liveSeatLoading,
    error: liveSeatError,
    rateLimitedUntil: seatRateLimitedUntil,
    refresh: refreshSeatInventory,
  } = useEventSeats(allowDirectPurchase ? id : null, {
    enabled: allowDirectPurchase,
    refreshInterval: allowDirectPurchase ? 15000 : undefined,
  });
  const freestyleSeats = useMemo(() => (allowDirectPurchase ? liveSeatInventory : []), [allowDirectPurchase, liveSeatInventory]);
  const loadingFreestyleSeats = allowDirectPurchase ? liveSeatLoading : false;



  const availableFreestyleSeatsByTier = useMemo(() => {
    if (!allowDirectPurchase) {
      return new Map<string, EventSeat[]>();
    }
    const lookup = new Map<string, EventSeat[]>();
    freestyleSeats.forEach(seat => {
      if (seat.status !== EventSeatStatus.AVAILABLE) {
        return;
      }
      const seatCodeKey = normalizeTierKey(seat.tierCode);
      const seatTypeKey = normalizeTierKey(seat.type);
      const keys = new Set<string>();
      if (seatCodeKey) keys.add(seatCodeKey);
      if (seatTypeKey) keys.add(seatTypeKey);
      if (keys.size === 0) {
        keys.add(fallbackTierKey);
      }
      keys.forEach(key => {
        if (!lookup.has(key)) {
          lookup.set(key, []);
        }
        lookup.get(key)!.push(seat);
      });
    });
    return lookup;
  }, [allowDirectPurchase, freestyleSeats, normalizeTierKey]);

  const getMaxSelectableForTier = useCallback(
    (tier: EventTicketTier) => {
      const remainingSeats = Math.max(tier.totalQuantity - tier.soldQuantity, 0);
      if (!allowDirectPurchase) {
        return remainingSeats;
      }
      const tierKey = normalizeTierKey(tier.tierCode) || normalizeTierKey(tier.tierName) || fallbackTierKey;
      const tierSeats = availableFreestyleSeatsByTier.get(tierKey);
      if (!tierSeats) {
        return remainingSeats;
      }
      return Math.min(remainingSeats, tierSeats.length);
    },
    [allowDirectPurchase, availableFreestyleSeatsByTier, normalizeTierKey],
  );


  // Offer a simplified filter set that always shows all tiers
  const dynamicFilters = useMemo(() => ['All Tiers'], []);

  const sharePlatforms = useMemo(() => {
    if (!shareUrl) {
      return [] as Array<{ name: string; href: string; icon: ComponentType<{ className?: string }>; color: string }>;
    }
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Check out ${event?.eventName ?? 'this event'} via Event Manager`);
    return [
      {
        name: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        icon: Facebook,
        color: 'hover:border-blue-600 hover:text-blue-600',
      },
      {
        name: 'Twitter',
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        icon: Twitter,
        color: 'hover:border-sky-500 hover:text-sky-500',
      },
      {
        name: 'LinkedIn',
        href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedText}`,
        icon: Linkedin,
        color: 'hover:border-blue-500 hover:text-blue-500',
      },
      {
        name: 'Instagram',
        href: 'https://www.instagram.com/',
        icon: Instagram,
        color: 'hover:border-pink-500 hover:text-pink-500',
      },
      {
        name: 'Copy Link',
        href: '#',
        icon: LinkIcon,
        color: 'hover:border-slate-600 hover:text-slate-700',
      },
    ];
  }, [shareUrl, event?.eventName]);

  const signedInName = useMemo(() => {
    if (!currentUser) {
      return '';
    }
    if (currentUser.fullName && currentUser.fullName.trim().length > 0) {
      const [first] = currentUser.fullName.trim().split(' ');
      return first || currentUser.fullName;
    }
    return currentUser.username ?? currentUser.email;
  }, [currentUser]);

  const handleSuggestionScroll = (direction: 'left' | 'right') => {
    const container = suggestionsScrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.7;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="animate-pulse text-lg text-gray-700">Loading Event Details...</p>
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
        <p className="mt-2 text-red-600">{errorMessage || 'Event not found.'}</p>
        <Link href="/">
          <Button variant="outline" className="mt-6">
            Back to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  const heroImages = ticketDetails?.imageUrls ?? event.imageUrls ?? [];
  const heroImage = heroImages.length > 0 ? heroImages[0] : FALLBACK_HERO;
  const eventDate = new Date(event.eventStart);
  const eventEndDate = new Date(event.eventEnd);
  const isSameDayEvent = eventDate.toDateString() === eventEndDate.toDateString();
  const dateRangeLabel = isSameDayEvent
    ? eventDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : `${eventDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} – ${eventEndDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
  const timeRangeLabel = `${eventDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${eventEndDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
  const venueName = venue?.venueName ?? 'Venue TBA';
  const venueAddress = venue?.address ?? null;
  const handleCopyShareLink = async (copyEvent?: MouseEvent<HTMLAnchorElement>) => {
    copyEvent?.preventDefault();
    if (!shareUrl || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy share link', error);
    }
  };

  const filteredTiers = tiers.filter(tier => {
    if (tierFilter === 'All Tiers') return true;
    return tier.tierName.includes(tierFilter);
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-900/60 bg-slate-950/95 text-slate-100 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm sm:px-6">
          <Link href="/" className="text-base font-semibold text-slate-100">
            Event Manager
          </Link>
          <nav className="hidden items-center gap-5 text-slate-300 md:flex">
            <Link href="/events#events-grid" className="transition hover:text-white">
              Events
            </Link>
            <a href="#ticket-tiers" className="transition hover:text-white">
              Tickets
            </a>
            <a href="#seat-map" className="transition hover:text-white">
              Seat Map
            </a>
            <a href="#contact-footer" className="transition hover:text-white">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <Link href="/profile" className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:inline">
                  My tickets
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-full border border-white/40 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Hi, {signedInName || 'there'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden rounded-full border border-slate-100/20 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-white sm:inline-flex"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <Image src={heroImage} alt={event.eventName} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/40" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-200/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <CalendarDays className="h-4 w-4" /> {dateRangeLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Clock className="h-4 w-4" /> {timeRangeLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <MapPin className="h-4 w-4" /> {venueName}
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{event.eventName}</h1>
            {venueAddress && <p className="max-w-2xl text-sm text-slate-200/90">{venueAddress}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#ticket-tiers"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore Ticket Options
            </a>
            {!allowDirectPurchase && (
              <a
                href="#seat-map"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Jump to Seat Map
              </a>
            )}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto w-full max-w-6xl -mt-10 flex-1 px-4 pb-16 sm:-mt-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7 xl:col-span-8">
            <section className="space-y-4">
              <Accordion title="Event Description" defaultOpen>
                <RichTextContent
                  content={event.eventDescription}
                  className="rich-text-body text-sm leading-relaxed text-slate-600"
                  emptyFallback="Details for this event will be available soon."
                />
              </Accordion>
              <Accordion title="Privacy Policy">
                <RichTextContent
                  content={event.privacyPolicy}
                  className="rich-text-body text-sm leading-relaxed text-slate-600"
                  emptyFallback="All ticket sales are final. Please review our terms and conditions for more details regarding event policies, cancellations, and refunds. Your privacy is important to us."
                />
              </Accordion>
            </section>

            <section id="ticket-tiers" className={CARD_BASE_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Ticket Options</h2>
                  <p className="text-sm text-slate-500">
                    {allowDirectPurchase
                      ? 'Select how many tickets you need—no seat map required for this freestyle event.'
                      : 'Choose the experience that fits your night out.'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dynamicFilters.map(filter => (
                  <Button
                    key={filter}
                    variant={tierFilter === filter ? 'default' : 'outline'}
                    onClick={() => setTierFilter(filter)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                      tierFilter === filter
                        ? 'bg-slate-900 text-white hover:bg-slate-950'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
              {allowDirectPurchase && (
                <div className="mt-2 text-sm text-emerald-700">
                  {loadingFreestyleSeats
                    ? 'Checking live availability...'
                    : liveSeatError
                      ? seatRateLimitedUntil && seatRateLimitedUntil > Date.now()
                        ? 'Seat availability is temporarily rate limited. Please try again in a few seconds.'
                        : (
                            <button
                              type="button"
                              onClick={() => void refreshSeatInventory({ ignoreRateLimit: true })}
                              className="underline"
                            >
                              Refresh seat availability
                            </button>
                          )
                      : 'Pick ticket quantities below and continue when you are ready.'}
                </div>
              )}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTiers.map(tier => {
                  const remainingSeats = Math.max(tier.totalQuantity - tier.soldQuantity, 0);
                  const tierKey = normalizeTierKey(tier.tierCode) || normalizeTierKey(tier.tierName) || fallbackTierKey;
                  const liveCount = allowDirectPurchase
                    ? availableFreestyleSeatsByTier.get(tierKey)?.length ?? remainingSeats
                    : remainingSeats;
                  const maxSelectable = allowDirectPurchase
                    ? Math.min(liveCount, getMaxSelectableForTier(tier))
                    : remainingSeats;
                  const isSoldOut = maxSelectable === 0;
                  const disableSelection = allowDirectPurchase && isSoldOut;
                  return (
                    <div
                      key={tier.id}
                      className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-[#2F5F7F] bg-[#2F5F7F] p-5 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">{tier.tierName}</h3>
                        <p className="text-sm text-white/80">Perfect for guests looking for a {tier.tierName.toLowerCase()} experience.</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-2xl font-bold text-white">${tier.price.toFixed(2)}</p>
                        <p
                          className={`text-sm font-medium ${
                            isSoldOut ? 'text-rose-200' : 'text-emerald-200'
                          }`}
                        >
                          {isSoldOut
                            ? 'Sold out'
                            : allowDirectPurchase
                              ? `${liveCount} tickets remaining`
                              : `${remainingSeats} seats remaining`}
                        </p>
                      </div>
                      {allowDirectPurchase && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            onClick={() => router.push(`/events/${id}/ticket/${tier.id}`)}
                            disabled={disableSelection}
                            className="w-full rounded-xl bg-white/95 text-sm font-semibold text-[#2F5F7F] hover:bg-white"
                          >
                            {disableSelection ? 'Unavailable' : 'Select tickets'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredTiers.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
                    No tiers found for “{tierFilter}”.
                  </div>
                )}
              </div>
            </section>

            {!allowDirectPurchase && (
              <section id="seat-map" className={CARD_BASE_CLASS}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Preferred seating</p>
                    <h2 className="text-xl font-semibold text-slate-900">Choose exact seats</h2>
                    <p className="text-sm text-slate-500">
                      Use the interactive seat map on the next page to reserve the perfect view before checkout.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={() => router.push(`/events/${id}/seat-selection`)}
                  >
                    Open seat selection
                  </Button>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-5 xl:col-span-4">
            <section className={CARD_BASE_CLASS}>
              <h2 className="text-lg font-semibold text-slate-900">Event Snapshot</h2>
              <dl className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500" />
                  <div>
                    <dt className="text-slate-500">Schedule</dt>
                    <dd className="font-medium text-slate-900">{dateRangeLabel}</dd>
                    <dd className="text-slate-500">{timeRangeLabel}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500" />
                  <div>
                    <dt className="text-slate-500">Venue</dt>
                    <dd className="font-medium text-slate-900">{venueName}</dd>
                    {venueAddress && <dd className="text-slate-500">{venueAddress}</dd>}
                  </div>
                </div>
              </dl>
            </section>

            <section className={CARD_BASE_CLASS}>
              <h2 className="text-lg font-semibold text-slate-900">Event Organizer</h2>
              {loadingOrganizers ? (
                <p className="mt-4 text-sm text-slate-500">Gathering organizer details...</p>
              ) : organizers.length > 0 ? (
                <div className="mt-4 space-y-5">
                  {organizers.map(organizer => {
                    const socialLinks = [
                      // { label: 'Website', icon: Globe, url: organizer.websiteLink },
                      // { label: 'Facebook', icon: Facebook, url: organizer.facebookLink },
                      // { label: 'Instagram', icon: Instagram, url: organizer.instagramLink },
                      // { label: 'YouTube', icon: Youtube, url: organizer.youtubeLink },
                    ].filter(link => link.url);

                    return (
                      <div key={organizer.id} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200">
                            <Image
                              src={organizer.imageUrl || ORGANIZER_PLACEHOLDER}
                              alt={`${organizer.name} logo`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">{organizer.name}</h3>

                            </div>
                            <div className="space-y-2 text-xs text-slate-500">
                              {organizer.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  <a href={`mailto:${organizer.email}`} className="text-slate-600 hover:text-slate-900">
                                    {organizer.email}
                                  </a>
                                </div>
                              )}


                            </div>
                            {socialLinks.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {socialLinks.map(link => {
                                  const Icon = link.icon;
                                  return (
                                    <a
                                      key={link.label}
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                    >
                                      <Icon className="h-3.5 w-3.5" />
                                      {link.label}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Organizer details will be announced soon.</p>
              )}
            </section>

            <section className={CARD_BASE_CLASS}>
              <h2 className="text-lg font-semibold text-slate-900">Featured Artists</h2>
              {loadingArtists ? (
                <p className="mt-4 text-sm text-slate-500">Gathering artist lineup...</p>
              ) : artists.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {artists.map(artist => (
                    <div key={artist.id} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200">
                        <Image
                          src={artist.imageUrl || ORGANIZER_PLACEHOLDER}
                          alt={`${artist.name} portrait`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{artist.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Artist lineup will be announced soon.</p>
              )}
            </section>

          </aside>
        </div>

        {(loadingUpcoming || upcomingEvents.length > 0) && (
          <section
            className={`${CARD_BASE_CLASS} mt-12`}
            aria-labelledby="upcoming-suggestions"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="upcoming-suggestions" className="text-2xl font-semibold text-slate-900">
                  Upcoming Events You May Like
                </h2>
                <p className="text-sm text-slate-500">Discover what&apos;s happening next and keep the excitement going.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSuggestionScroll('left')}
                  disabled={loadingUpcoming || upcomingEvents.length === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Scroll suggestions left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionScroll('right')}
                  disabled={loadingUpcoming || upcomingEvents.length === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Scroll suggestions right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={suggestionsScrollRef}
              className="mt-6 flex gap-4 overflow-x-auto pb-2"
            >
              {loadingUpcoming && (
                <div className="flex h-40 w-full items-center justify-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm">Gathering upcoming events...</span>
                </div>
              )}
              {!loadingUpcoming &&
                upcomingEvents.map(item => {
                  const suggestionImage = item.imageUrls?.[0] ?? FALLBACK_HERO;
                  const suggestionStart = new Date(item.eventStart);
                  const suggestionEnd = new Date(item.eventEnd);
                  const suggestionSameDay = suggestionStart.toDateString() === suggestionEnd.toDateString();
                  const suggestionDate = suggestionSameDay
                    ? suggestionStart.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : `${suggestionStart.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} – ${suggestionEnd.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`;
                  const suggestionTime = `${suggestionStart.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${suggestionEnd.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;

                  return (
                    <Link
                      key={item.id}
                      href={`/events/${item.id}`}
                      className="group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={suggestionImage}
                          alt={`${item.eventName} preview`}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.typeName}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900">{item.eventName}</h3>
                        <div className="mt-auto space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            <span>{suggestionDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{suggestionTime}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              {!loadingUpcoming && upcomingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No upcoming events to suggest just yet.</p>
              )}
            </div>
          </section>
        )}

        <section className={`${CARD_BASE_CLASS} mt-12`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200">
                <Image src={heroImage} alt={`${event.eventName} hero`} fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Share this experience</h2>
                <p className="text-sm text-slate-500">Invite friends and let them know about {event.eventName}.</p>
              </div>
            </div>
            <Share2 className="hidden h-10 w-10 text-slate-300 sm:block" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {sharePlatforms.length > 0 ? (
              sharePlatforms.map(platform => {
                const Icon = platform.icon;
                const isCopyAction = platform.name === 'Copy Link';
                return (
                  <a
                    key={platform.name}
                    href={isCopyAction ? '#' : platform.href}
                    onClick={isCopyAction ? handleCopyShareLink : undefined}
                    target={isCopyAction ? undefined : '_blank'}
                    rel={isCopyAction ? undefined : 'noopener noreferrer'}
                    className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition ${
                      platform.color
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {isCopyAction && copiedLink ? 'Link copied!' : platform.name}
                  </a>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Preparing share links...</p>
            )}
          </div>
        </section>

        {heroImages.length > 1 && (
          <section className={`${CARD_BASE_CLASS} mt-12`} id="gallery">
            <h2 className="text-2xl font-semibold text-slate-900">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {heroImages.map((url, index) => (
                <div key={`${url}-${index}`} className="relative aspect-video overflow-hidden rounded-xl">
                  <Image src={url} alt={`${event.eventName} image ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="mt-auto border-t border-slate-900/60 bg-slate-950 text-slate-100" id="contact-footer">
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
                  <a href="#ticket-tiers" className="transition hover:text-white">
                    Ticket options
                  </a>
                </li>
                <li>
                  <a href="#seat-map" className="transition hover:text-white">
                    Seating map
                  </a>
                </li>
                <li>
                  <Link href="/profile" className="transition hover:text-white">
                    My account
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
              <div className="flex items-center gap-3 pt-2">
                {[Facebook, Instagram, Linkedin, Twitter].map((Icon, index) => (
                  <a
                    key={Icon.displayName ?? index}
                    href="#"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-900/60 pt-6 text-xs text-slate-500 sm:flex-row">
            <p className="text-slate-400">© {new Date().getFullYear()} Event Manager. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default EventDetailPage;
