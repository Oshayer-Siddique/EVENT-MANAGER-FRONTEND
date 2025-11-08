'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getEvent, getEventTicketDetails } from '@/services/eventService';
import { getEventSeats } from '@/services/eventSeatService';
import holdService from '@/services/holdService';
import type { Event, EventTicketDetails } from '@/types/event';
import type { EventSeat } from '@/types/eventSeat';

interface SeatSelectionReviewPageProps {
  params: { id: string };
}

export default function SeatSelectionReviewClient({ params }: SeatSelectionReviewPageProps) {
  const { id } = params;
  const router = useRouter();
  const { user } = useCurrentUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([]);
  const [contactInfo, setContactInfo] = useState({ fullName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setContactInfo(prev => ({
        fullName: prev.fullName || user.fullName || user.username || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const selectionRaw = typeof window !== 'undefined' ? window.sessionStorage.getItem(`seat-selection:${id}`) : null;
        if (!selectionRaw) {
          setError('Please select seats first.');
          router.replace(`/events/${id}/seat-selection`);
          return;
        }
        const seatIds: string[] = JSON.parse(selectionRaw);

        const [eventResponse, ticketResponse, seatInventory] = await Promise.all([
          getEvent(id),
          getEventTicketDetails(id).catch(() => null),
          getEventSeats(id),
        ]);
        if (cancelled) return;

        const matchedSeats = seatInventory.filter(seat => seatIds.includes(seat.seatId));
        if (matchedSeats.length === 0) {
          setError('Selected seats are no longer available. Please choose different seats.');
          window.sessionStorage.removeItem(`seat-selection:${id}`);
          router.replace(`/events/${id}/seat-selection`);
          return;
        }

        setEvent(eventResponse);
        setTicketDetails(ticketResponse);
        setSelectedSeats(matchedSeats);
      } catch (err) {
        console.error('Failed to load seat review data', err);
        if (!cancelled) {
          setError('We could not load your selection. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const subtotal = useMemo(() => {
    return selectedSeats.reduce((total, seat) => {
      const price = seat.price ?? ticketDetails?.ticketTiers.find(t => t.tierCode === seat.tierCode)?.price ?? 0;
      return total + price;
    }, 0);
  }, [selectedSeats, ticketDetails?.ticketTiers]);

  const handleConfirmReservation = async () => {
    if (selectedSeats.length === 0) {
      setError('Your selection is empty.');
      return;
    }
    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      setError('Please provide your name, email, and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const seatIds = selectedSeats.map(seat => seat.seatId);
      const hold = await holdService.createHold({
        eventId: id,
        buyerId: user?.id,
        seatIds,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      window.sessionStorage.removeItem(`seat-selection:${id}`);
      router.push(`/checkout?holdId=${hold.id}`);
    } catch (err) {
      console.error('Failed to reserve seats', err);
      setError('We could not reserve those seats. Please refresh and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!event || selectedSeats.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
        {error ?? 'No seats to review.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Review selection</p>
            <h1 className="text-2xl font-semibold text-slate-900">{event.eventName}</h1>
          </div>
          <Link
            href={`/events/${id}/seat-selection`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Adjust seats
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Selected seats</h2>
                <p className="text-sm text-slate-500">Held for 15 minutes once you continue to checkout.</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">${subtotal.toFixed(2)}</p>
              </div>
            </header>

            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200/80">
              {selectedSeats.map(seat => (
                <li key={seat.eventSeatId} className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{seat.label ?? `${seat.row}${seat.number}`}</p>
                    <p className="text-xs text-slate-500">Tier {seat.tierCode ?? 'General'}</p>
                  </div>
                  <span className="font-semibold text-slate-900">${(seat.price ?? 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-slate-600">Full name</label>
                <input
                  type="text"
                  value={contactInfo.fullName}
                  onChange={e => setContactInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder:text-slate-400"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-slate-600">Email</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2  text-slate-900 placeholder:text-slate-400"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-slate-600">Phone number</label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder:text-slate-400"
                  placeholder="(000) 000-0000"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmReservation}
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Reserving seats…
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Continue to checkout
                </>
              )}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
