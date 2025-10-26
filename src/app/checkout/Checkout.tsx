'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import holdService from '../../services/holdService';
import { getEvent, getEventTicketDetails } from '../../services/eventService';

import type { Hold } from '../../types/hold';
import type { Event, EventTicketDetails } from '../../types/event';
import { Button } from '../../components/ui/button';

const HOLD_EXPIRY_WARNING_SECONDS = 60; // warn if less than a minute remains

const Checkout = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const holdId = searchParams.get('holdId');

  const [hold, setHold] = useState<Hold | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!holdId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const holdData = await holdService.getHold(holdId);
        setHold(holdData);

        const [eventData, details] = await Promise.all([
          getEvent(holdData.eventId).catch(() => null),
          getEventTicketDetails(holdData.eventId).catch(() => null),
        ]);

        if (eventData) setEvent(eventData);
        if (details) setTicketDetails(details);
      } catch (err) {
        console.error('Failed to fetch checkout data:', err);
        setError('We could not load your reservation. It may have expired.');
        setHold(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [holdId]);

  useEffect(() => {
    if (!hold) return;

    const updateCountdown = () => {
      const expiresAt = new Date(hold.expiresAt).getTime();
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      setTimeRemaining(`${minutes}:${seconds}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [hold]);

  const tierPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    ticketDetails?.ticketTiers.forEach(tier => map.set(tier.tierCode, tier.price));
    return map;
  }, [ticketDetails]);

  const lineItems = useMemo(() => {
    if (!hold) return [];
    return hold.heldSeats.map(seat => ({
      ...seat,
      price: tierPriceMap.get(seat.tierCode) ?? 0,
    }));
  }, [hold, tierPriceMap]);

  const totalPrice = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.price, 0);
  }, [lineItems]);

  const isExpired = hold ? new Date(hold.expiresAt).getTime() <= Date.now() : false;
  const warnAboutExpiry = hold
    ? new Date(hold.expiresAt).getTime() - Date.now() <= HOLD_EXPIRY_WARNING_SECONDS * 1000
    : false;

  const handleConfirmPurchase = async () => {
    if (!hold) return;

    try {
      setSubmitting(true);
      setError(null);

      const paymentId = `web-payment-${Date.now()}`;
      await holdService.convertHold(hold.id, paymentId);

      setSuccessMessage('Purchase complete! Redirecting to your tickets…');
      setTimeout(() => router.push('/profile/tickets'), 1500);
    } catch (err) {
      console.error('Failed to confirm purchase:', err);
      setError('We could not finalize the purchase. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!hold) return;

    try {
      setReleasing(true);
      setError(null);
      await holdService.releaseHold(hold.id);
      router.push(`/events/${hold.eventId}`);
    } catch (err) {
      console.error('Failed to release hold:', err);
      setError('We could not release the reservation. Please refresh and try again.');
    } finally {
      setReleasing(false);
    }
  };

  if (!holdId) {
    return <div className="px-4 py-8 text-center">No reservation selected.</div>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading checkout…
        </div>
      </div>
    );
  }

  if (!hold) {
    return (
      <div className="px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reservation not found</h1>
        <p className="mt-2 text-gray-600">It may have expired or already been converted to tickets.</p>
        <Button className="mt-6" onClick={() => router.push('/')}>Return home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Confirm Your Purchase</h1>
            {event ? (
              <p className="mt-1 text-sm text-gray-600">
                {event.eventName} · {new Date(event.eventStart).toLocaleString()}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">Event details unavailable.</p>
            )}
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-medium ${warnAboutExpiry ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {timeRemaining ? `Hold expires in ${timeRemaining}` : 'Calculating hold time…'}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Reserved Seats</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {lineItems.map(item => (
              <div key={item.seatId} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{item.seatLabel}</p>
                  <p className="text-sm text-gray-500">Tier {item.tierCode}</p>
                </div>
                <span className="text-lg font-semibold text-gray-900">${item.price.toFixed(2)}</span>
              </div>
            ))}
            {lineItems.length === 0 && (
              <p className="p-4 text-sm text-gray-500">This hold has no seats attached.</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Payment Overview</h2>
          <p className="mt-2 text-sm text-gray-600">
            Payment processing is mocked for this environment. On confirmation we convert the hold and issue
            tickets to your account.
          </p>
        </section>

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            className="order-2 sm:order-1"
            onClick={handleReleaseHold}
            disabled={releasing || submitting}
          >
            {releasing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Releasing…
              </span>
            ) : (
              'Release Hold'
            )}
          </Button>

          <Button
            className="order-1 sm:order-2 bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleConfirmPurchase}
            disabled={submitting || releasing || isExpired}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finishing up…
              </span>
            ) : isExpired ? (
              'Hold Expired'
            ) : (
              'Pay & Issue Tickets'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
