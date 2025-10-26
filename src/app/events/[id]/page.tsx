'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, MapPin, ChevronDown, ShoppingCart, Loader2, X } from 'lucide-react';

import { getEvent, getEventTicketDetails } from '../../../services/eventService';
import { getVenueById } from '../../../services/venueService';
import holdService from '../../../services/holdService';

import type { Event, EventTicketDetails, EventTicketTier } from '../../../types/event';
import type { Venue } from '../../../types/venue';
import { Button } from '../../../components/ui/button';

import { EventSeat } from '../../../types/eventSeat';
import SeatMap from '../../../components/booking/SeatMap';

interface EventDetailPageProps {
  params: { id: string };
}

const FALLBACK_HERO = '/concert.jpg';

// Simple accordion using <details>/<summary>
const Accordion = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <details className="group rounded-lg border border-gray-200 bg-white">
    <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold text-gray-800">
      {title}
      <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
    </summary>
    <div className="p-4 pt-0 text-gray-600">{children}</div>
  </details>
);

function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState('All');
  const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([]);
  const [isCreatingHold, setIsCreatingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const router = useRouter();

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

  const tiers: EventTicketTier[] = useMemo(() => {
    return ticketDetails?.ticketTiers ?? event?.ticketTiers ?? [];
  }, [event?.ticketTiers, ticketDetails?.ticketTiers]);

  const handleSeatSelect = (seat: EventSeat) => {
    setSelectedSeats(prev => {
      if (prev.some(s => s.eventSeatId === seat.eventSeatId)) {
        return prev.filter(s => s.eventSeatId !== seat.eventSeatId);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleCreateHold = async () => {
    if (selectedSeats.length === 0) {
      setHoldError('Please select at least one seat before proceeding.');
      return;
    }

    try {
      setIsCreatingHold(true);
      setHoldError(null);
      const hold = await holdService.createHold({
        eventId: id,
        seatIds: selectedSeats.map(s => s.seatId),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      router.push(`/checkout?holdId=${hold.id}`);
    } catch (error) {
      console.error('Failed to create hold:', error);
      setHoldError('We could not reserve those seats. Please refresh and try again.');
    } finally {
      setIsCreatingHold(false);
    }
  };

  const selectedSeatSummaries = useMemo(() => {
    return selectedSeats.map(seat => {
      const tierCode = seat.tierCode;
      const tier = tiers.find(t => t.tierCode === tierCode);
      const seatLabel =
        seat.label ??
        (seat.row && seat.number !== undefined
          ? `${seat.row}${seat.number}`
          : seat.row ?? String(seat.number ?? 'Seat'));
      const price = seat.price ?? tier?.price ?? 0;
      const numericPrice = Number(price) || 0;
      return {
        id: seat.eventSeatId,
        label: seatLabel,
        tierName: tier?.tierName ?? tierCode ?? 'General',
        price: numericPrice,
      };
    });
  }, [selectedSeats, tiers]);

  const totalPrice = useMemo(() => {
    return selectedSeatSummaries.reduce((total, seat) => total + seat.price, 0);
  }, [selectedSeatSummaries]);

  // Build dynamic day filters (All, Day 1..N, Multi-Day if applicable)
  const dynamicFilters = useMemo(() => {
    if (!event) {
      return ['All'];
    }
    const start = new Date(event.eventStart);
    const end = new Date(event.eventEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const durationDays =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const filters: string[] = ['All'];
    if (durationDays > 1) {
      for (let i = 1; i <= durationDays; i++) {
        filters.push(`Day ${i}`);
      }
      if (tiers.some(t => t.tierName.includes('+') || t.tierName.toLowerCase().includes('full'))) {
        filters.push('Multi-Day');
      }
    }
    return filters;
  }, [event, tiers]);

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

  const filteredTiers = tiers.filter(tier => {
    if (tierFilter === 'All') return true;
    if (tierFilter.startsWith('Day ')) {
      return tier.tierName.includes(tierFilter);
    }
    if (tierFilter === 'Multi-Day') {
      return tier.tierName.includes('+') || tier.tierName.toLowerCase().includes('full');
    }
    return false;
  });

  return (
    <div className="bg-white text-gray-800">
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="relative mb-6 aspect-[16/7] w-full overflow-hidden">
          <Image src={heroImage} alt={event.eventName} fill priority className="object-cover" />
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">{event.eventName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {venue?.venueName ?? 'Venue TBA'}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {eventDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {eventEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Accordion title="Event Description">
            <p className="whitespace-pre-wrap">
              {event.eventDescription || 'Details for this event will be available soon.'}
            </p>
          </Accordion>
          <Accordion title="Privacy Policy">
            <p className="whitespace-pre-wrap">
              {event.privacyPolicy || 'All ticket sales are final. Please review our terms and conditions for more details regarding event policies, cancellations, and refunds. Your privacy is important to us.'}
            </p>
          </Accordion>
        </div>

        <section id="ticket-tiers" className="my-10">
            <h2 className="text-xl font-bold text-black">Ticket Tiers</h2>
            <div className="mt-4 flex flex-wrap gap-2 border-b pb-4">
                {dynamicFilters.map(filter => (
                <Button
                    key={filter}
                    variant={tierFilter === filter ? 'default' : 'outline'}
                    onClick={() => setTierFilter(filter)}
                    className={tierFilter === filter ? 'bg-gray-800 text-white' : ''}
                >
                    {filter}
                </Button>
                ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTiers.map(tier => (
                <div key={tier.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900">{tier.tierName}</h3>
                    <p className="mt-1 text-sm text-gray-600">{/* optional tier description */}</p>
                    <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-bold text-black">
                        ${tier.price.toFixed(2)}
                    </p>
                    </div>
                </div>
                ))}
                {filteredTiers.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-600">
                    No tiers found for “{tierFilter}”.
                </div>
                )}
            </div>
        </section>

        <section id="seat-map" className="my-10">
          <h2 className="text-xl font-bold text-black">Select Your Seats</h2>
          <SeatMap
            eventId={id}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            tiers={tiers}
            seatLayout={ticketDetails?.seatLayout}
          />
        </section>

        {selectedSeatSummaries.length > 0 && (
          <section className="my-10" aria-labelledby="reservation-summary">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="reservation-summary" className="text-xl font-semibold text-black">
                    Reservation Summary
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Seats are held for 15 minutes once you continue to checkout.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Selected Seats</p>
                  <p className="text-2xl font-bold text-black">
                    {selectedSeatSummaries.length} · ${totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-gray-200">
                {selectedSeatSummaries.map(seat => (
                  <li key={seat.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{seat.label}</p>
                      <p className="text-sm text-gray-500">{seat.tierName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">${seat.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const seatToRemove = selectedSeats.find(s => s.eventSeatId === seat.id);
                          if (seatToRemove) {
                            handleSeatSelect(seatToRemove);
                          }
                        }}
                        aria-label={`Remove seat ${seat.label}`}
                        className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {holdError && (
                <p className="mt-4 text-sm text-red-600">{holdError}</p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  Need to make changes? Click any seat on the map to toggle it off.
                </p>
                <Button
                  onClick={handleCreateHold}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={isCreatingHold}
                >
                  {isCreatingHold ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Reserving seats…
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
        )}

        {heroImages.length > 1 && (
          <section id="gallery">
            <h2 className="text-xl font-bold text-black">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {heroImages.map((url, index) => (
                <div key={`${url}-${index}`} className="relative aspect-video overflow-hidden rounded-lg">
                  <Image src={url} alt={`${event.eventName} image ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default EventDetailPage;
