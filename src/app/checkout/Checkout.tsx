'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

import holdService from '../../services/holdService';
import paymentService from '../../services/paymentService';
import { getEvent, getEventTicketDetails } from '../../services/eventService';

import type { Hold } from '../../types/hold';
import type { Event, EventTicketDetails } from '../../types/event';
import type { CreatePaymentIntentResponse } from '../../types/payment';
import { Button } from '../../components/ui/button';
import { clientEnv } from '@/lib/env';

const STRIPE_PUBLISHABLE_KEY = clientEnv.stripePublishableKey;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const HOLD_EXPIRY_WARNING_SECONDS = 60; // warn if less than a minute remains

const formatMoney = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

interface StripePaymentFormProps {
  amountLabel: string;
  disabled?: boolean;
  onSubmittingChange?: (processing: boolean) => void;
  onComplete: (result: { status: string; message?: string }) => void;
}

const StripePaymentForm = ({ amountLabel, disabled, onSubmittingChange, onComplete }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) {
      return;
    }

    setSubmitting(true);
    onSubmittingChange?.(true);
    setLocalError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        const message = result.error.message ?? 'Payment failed. Please try again.';
        setLocalError(message);
        onComplete({ status: 'error', message });
        return;
      }

      if (result.paymentIntent) {
        onComplete({ status: result.paymentIntent.status ?? 'processing' });
      } else {
        onComplete({ status: 'processing' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error confirming payment.';
      setLocalError(message);
      onComplete({ status: 'error', message });
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {localError && <p className="text-sm text-rose-600">{localError}</p>}
      <Button
        type="submit"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || !stripe || !elements || submitting}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </span>
        ) : (
          `Pay ${amountLabel}`
        )}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const holdId = searchParams.get('holdId');

  const [hold, setHold] = useState<Hold | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<CreatePaymentIntentResponse | null>(null);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);
  const [stripeSubmitting, setStripeSubmitting] = useState(false);
  const [watchConversion, setWatchConversion] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.sessionStorage.getItem('checkoutContact');
    if (stored) {
      try {
        setContactInfo(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to parse checkout contact info', err);
      }
    }
  }, []);

  const refreshHold = useCallback(async () => {
    if (!holdId) {
      return null;
    }
    const latest = await holdService.getHold(holdId);
    setHold(latest);
    return latest;
  }, [holdId]);

  useEffect(() => {
    if (!holdId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const holdData = await refreshHold();
        if (!holdData || cancelled) {
          return;
        }

        const [eventData, details] = await Promise.all([
          getEvent(holdData.eventId).catch(() => null),
          getEventTicketDetails(holdData.eventId).catch(() => null),
        ]);

        if (!cancelled) {
          setEvent(eventData);
          setTicketDetails(details);
        }
      } catch (err) {
        console.error('Failed to fetch checkout data:', err);
        if (!cancelled) {
          setError('We could not load your reservation. It may have expired.');
          setHold(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [holdId, refreshHold]);

  useEffect(() => {
    if (!hold || hold.status !== 'ACTIVE') {
      setTimeRemaining('');
      return;
    }

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
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [hold]);

  useEffect(() => {
    if (!watchConversion || !holdId) {
      return;
    }
    let attempts = 0;
    const maxAttempts = 20;

    const interval = window.setInterval(async () => {
      attempts += 1;
      try {
        const latest = await refreshHold();
        if (!latest) {
          return;
        }
        if (latest.status === 'CONVERTED') {
          setWatchConversion(false);
          setSuccessMessage('Payment confirmed! Redirecting to your tickets…');
          window.clearInterval(interval);
          window.setTimeout(() => router.push('/profile/tickets'), 1500);
          return;
        }
        if (latest.status === 'RELEASED' || latest.status === 'EXPIRED') {
          setWatchConversion(false);
          setError('Your reservation is no longer active. If funds were captured, please contact support with your receipt.');
          window.clearInterval(interval);
          return;
        }
      } catch (pollError) {
        console.error('Failed to poll hold status', pollError);
      }

      if (attempts >= maxAttempts) {
        setWatchConversion(false);
        window.clearInterval(interval);
        setSuccessMessage('Payment received. We will email you once tickets are ready.');
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [holdId, refreshHold, router, watchConversion]);

  useEffect(() => {
    if (!hold) {
      return;
    }
    if (hold.status === 'CONVERTED') {
      setSuccessMessage('Tickets already issued for this reservation. Redirecting…');
      const timer = window.setTimeout(() => router.push('/profile/tickets'), 1500);
      return () => window.clearTimeout(timer);
    }
    if (hold.status !== 'ACTIVE') {
      setError('This reservation is no longer active. Please start a new checkout.');
    }
    return undefined;
  }, [hold, router]);

  useEffect(() => {
    if (!holdId || !hold || hold.status !== 'ACTIVE' || paymentIntent || creatingIntent || !stripePromise) {
      return;
    }
    let cancelled = false;

    const initPaymentIntent = async () => {
      try {
        setCreatingIntent(true);
        setPaymentIntentError(null);
        const response = await paymentService.createPaymentIntent({
          holdId,
          customerEmail: contactInfo.email,
          description: event ? `${event.eventName} tickets` : undefined,
        });
        if (!cancelled) {
          setPaymentIntent(response);
        }
      } catch (intentError) {
        console.error('Failed to create payment intent', intentError);
        if (!cancelled) {
          setPaymentIntentError(
            intentError instanceof Error ? intentError.message : 'Unable to initialize the payment form.',
          );
        }
      } finally {
        if (!cancelled) {
          setCreatingIntent(false);
        }
      }
    };

    initPaymentIntent();
    return () => {
      cancelled = true;
    };
  }, [contactInfo.email, event, hold, holdId, paymentIntent, creatingIntent]);

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

  const holdIsActive = hold?.status === 'ACTIVE';
  const holdIsExpired = hold ? new Date(hold.expiresAt).getTime() <= Date.now() : false;
  const isExpired = hold ? (!holdIsActive || holdIsExpired) : false;
  const warnAboutExpiry = holdIsActive && !holdIsExpired
    ? new Date(hold.expiresAt).getTime() - Date.now() <= HOLD_EXPIRY_WARNING_SECONDS * 1000
    : false;

  const paymentAmountLabel = paymentIntent
    ? formatMoney((paymentIntent.amountCents ?? 0) / 100, paymentIntent.currency)
    : formatMoney(totalPrice, paymentIntent?.currency ?? 'USD');

  const elementsOptions: StripeElementsOptions | undefined = paymentIntent
    ? {
        clientSecret: paymentIntent.clientSecret,
        appearance: { theme: 'stripe' },
      }
    : undefined;

  const disableStripeForm = isExpired || releasing || stripeSubmitting || watchConversion;

  const handleStripeCompletion = useCallback(
    ({ status, message }: { status: string; message?: string }) => {
      switch (status) {
        case 'succeeded':
        case 'processing':
          setError(null);
          setSuccessMessage('Payment received! Finalizing your tickets…');
          setWatchConversion(true);
          break;
        case 'requires_action':
          setError('Additional authentication is required. Please complete the verification prompt.');
          break;
        case 'requires_payment_method':
        case 'canceled':
        case 'error':
          setSuccessMessage(null);
          setWatchConversion(false);
          setError(message ?? 'Your payment could not be completed. Please check your details and try again.');
          break;
        default:
          setSuccessMessage('Payment submitted. Waiting for confirmation…');
          setWatchConversion(true);
          break;
      }
    },
    [],
  );

  const handleReleaseHold = async () => {
    if (!hold) return;

    try {
      setReleasing(true);
      setError(null);
      setWatchConversion(false);
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
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              warnAboutExpiry ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
            }`}
          >
            {timeRemaining ? `Hold expires in ${timeRemaining}` : 'Hold inactive'}
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
                <span className="text-lg font-semibold text-gray-900">{formatMoney(item.price)}</span>
              </div>
            ))}
            {lineItems.length === 0 && (
              <p className="p-4 text-sm text-gray-500">This hold has no seats attached.</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(totalPrice)}</span>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
          {!STRIPE_PUBLISHABLE_KEY && (
            <p className="text-sm text-amber-700">
              Stripe publishable key is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable the payment
              form.
            </p>
          )}
          {paymentIntentError && <p className="text-sm text-rose-600">{paymentIntentError}</p>}
          {creatingIntent && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure payment form…
            </div>
          )}
          {!creatingIntent && paymentIntent && stripePromise && elementsOptions && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <StripePaymentForm
                amountLabel={paymentAmountLabel}
                disabled={disableStripeForm}
                onSubmittingChange={setStripeSubmitting}
                onComplete={handleStripeCompletion}
              />
            </Elements>
          )}
          {!paymentIntent && !creatingIntent && STRIPE_PUBLISHABLE_KEY && (
            <p className="text-sm text-gray-600">Payment form unavailable. Please refresh to try again.</p>
          )}
          <p className="text-sm text-gray-500">
            Payments are securely processed by Stripe. Your card will only be charged if the hold can be converted to
            tickets.
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
            disabled={releasing || stripeSubmitting || watchConversion}
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
            className="order-1 sm:order-2 bg-green-600 text-white hover:bg-green-700"
            disabled
          >
            {watchConversion || stripeSubmitting ? 'Processing payment…' : 'Use the payment form above'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
