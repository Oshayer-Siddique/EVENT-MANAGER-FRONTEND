'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';

import SeatMap from '@/components/booking/SeatMap';
import { useEventSeats } from '@/hooks/useEventSeats';
import { getEvent, getEventTicketDetails } from '@/services/eventService';
import type { Event, EventTicketDetails } from '@/types/event';
import type { EventSeat } from '@/types/eventSeat';
import { getBanquetLayout } from '@/services/banquetLayoutService';
import type { BanquetLayout } from '@/types/banquet';
import BanquetSeatMap from '@/components/booking/BanquetSeatMap';

interface SeatSelectionPageProps {
  params: { id: string };
}

export default function SelectSeatsClient({ params }: SeatSelectionPageProps) {
  const { id } = params;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([]);
  const [banquetLayout, setBanquetLayout] = useState<BanquetLayout | null>(null);
  const [loadingBanquet, setLoadingBanquet] = useState(false);

  const { seats: liveSeats } = useEventSeats(id, { enabled: true, refreshInterval: 15000 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingEvent(true);
        const [eventResponse, ticketResponse] = await Promise.all([
          getEvent(id),
          getEventTicketDetails(id).catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        setEvent(eventResponse);
        setTicketDetails(ticketResponse);
      } catch (err) {
        console.error('Failed to load event details', err);
        if (!cancelled) {
          setError('We could not load seat selection for this event.');
        }
      } finally {
        if (!cancelled) {
          setLoadingEvent(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSeatSelect = (seat: EventSeat) => {
    setSelectedSeats(prev => {
      if (prev.some(s => s.eventSeatId === seat.eventSeatId)) {
        return prev.filter(s => s.eventSeatId !== seat.eventSeatId);
      }
      return [...prev, seat];
    });
  };

  const subtotal = useMemo(() => {
    return selectedSeats.reduce((total, seat) => {
      const price = seat.price ?? ticketDetails?.ticketTiers.find(t => t.tierCode === seat.tierCode)?.price ?? 0;
      return total + price;
    }, 0);
  }, [selectedSeats, ticketDetails?.ticketTiers]);

  const seatLayoutSummary = ticketDetails?.seatLayout;
  const isBanquetLayout =
    seatLayoutSummary?.typeName?.toLowerCase() === 'banquet' || seatLayoutSummary?.typeCode?.toLowerCase() === '230';

  useEffect(() => {
    if (!isBanquetLayout || !seatLayoutSummary?.id) {
      setBanquetLayout(null);
      return;
    }
    let cancelled = false;
    const loadBanquetLayout = async () => {
      try {
        setLoadingBanquet(true);
        const layoutData = await getBanquetLayout(seatLayoutSummary.id);
        if (!cancelled) {
          setBanquetLayout(layoutData);
        }
      } catch (err) {
        console.error('Failed to load banquet layout', err);
        if (!cancelled) {
          setError('We could not load the banquet seating layout.');
        }
      } finally {
        if (!cancelled) {
          setLoadingBanquet(false);
        }
      }
    };
    void loadBanquetLayout();
    return () => {
      cancelled = true;
    };
  }, [isBanquetLayout, seatLayoutSummary?.id]);

  const handleReviewSelection = () => {
    if (selectedSeats.length === 0) {
      setError('Select at least one seat to continue.');
      return;
    }
    try {
      const seatIds = selectedSeats.map(seat => seat.seatId);
      window.sessionStorage.setItem(`seat-selection:${id}`, JSON.stringify(seatIds));
      router.push(`/events/${id}/seat-selection/review`);
    } catch (storageError) {
      console.error('Failed to persist seat selection', storageError);
      setError('We could not save your selection. Please try again.');
    }
  };

  if (loadingEvent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
        {error ?? 'Event not found.'}
      </div>
    );
  }

  const seatLayoutName = seatLayoutSummary?.layoutName ?? 'Seat map';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Select your seats</p>
            <h1 className="text-xl font-semibold text-slate-900">{event.eventName}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {seatLayoutName}
            </p>
          </div>
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to event
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {isBanquetLayout ? (
            loadingBanquet || !banquetLayout ? (
              <div className="flex h-48 items-center justify-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <BanquetSeatMap
                layout={banquetLayout}
                seats={liveSeats}
                selectedSeats={selectedSeats}
                onSeatSelect={handleSeatSelect}
                tiers={ticketDetails?.ticketTiers ?? event.ticketTiers}
              />
            )
          ) : (
            <SeatMap
              eventId={id}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              tiers={ticketDetails?.ticketTiers ?? event.ticketTiers}
              seatLayout={ticketDetails?.seatLayout}
            />
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Selection</p>
            <p className="text-base font-semibold text-slate-900">
              {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} · ${subtotal.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReviewSelection}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={selectedSeats.length === 0}
          >
            Review selection
          </button>
        </div>
      </div>
    </div>
  );
}
