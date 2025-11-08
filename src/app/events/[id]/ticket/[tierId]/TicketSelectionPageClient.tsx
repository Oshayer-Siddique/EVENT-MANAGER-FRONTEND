'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Phone, Ticket, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getEvent, getEventTicketDetails } from '@/services/eventService';
import holdService from '@/services/holdService';
import { useEventSeats } from '@/hooks/useEventSeats';
import type { Event, EventTicketDetails, EventTicketTier } from '@/types/event';
import { EventSeatStatus } from '@/types/eventSeat';

const CARD_BASE_CLASS =
  'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60';

export interface TicketSelectionPageClientProps {
  params: {
    id: string;
    tierId: string;
  };
}

const HOLD_DURATION_MS = 15 * 60 * 1000;

export default function TicketSelectionPageClient({ params }: TicketSelectionPageClientProps) {
  const { id, tierId } = params;
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
  const [selectedTier, setSelectedTier] = useState<EventTicketTier | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [contactInfo, setContactInfo] = useState({ fullName: '', email: '', phone: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingEvent(true);
        setPageError(null);
        const [eventData, details] = await Promise.all([
          getEvent(id),
          getEventTicketDetails(id).catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        setEvent(eventData);
        setTicketDetails(details);
      } catch (error) {
        console.error('Failed to load event details', error);
        if (!cancelled) {
          setPageError('We could not load this ticket tier. Please try again.');
          setEvent(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingEvent(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const tiers = ticketDetails?.ticketTiers ?? event?.ticketTiers ?? [];
    const match = tiers.find(tier => tier.id === tierId || tier.tierCode === tierId);
    setSelectedTier(match ?? null);
  }, [event?.ticketTiers, ticketDetails?.ticketTiers, tierId]);

  const seatLayoutTypeName = ticketDetails?.seatLayout?.typeName?.toLowerCase();
  const seatLayoutTypeCode = ticketDetails?.seatLayout?.typeCode;
  const hasSeatLayout = Boolean(ticketDetails?.seatLayout || event?.seatLayoutId);
  const allowDirectPurchase = !ticketDetails?.seatLayout || seatLayoutTypeName === 'freestyle' || seatLayoutTypeCode === '220' || !event?.seatLayoutId;
  const useSeatInventory = allowDirectPurchase && hasSeatLayout;
  const isFreestyleFlow = allowDirectPurchase && !hasSeatLayout;
  const normalizeTierKey = useCallback((value?: string | null) => (value ?? '').trim().toLowerCase(), []);

  const {
    seats: liveSeatInventory,
    loading: seatInventoryLoading,
    error: seatInventoryError,
    rateLimitedUntil,
    refresh: seatInventoryRefresh,
  } = useEventSeats(useSeatInventory ? id : null, {
    enabled: useSeatInventory,
    refreshInterval: useSeatInventory ? 15000 : undefined,
  });

  const seatInventory = useSeatInventory ? liveSeatInventory : [];
  const inventoryLoading = useSeatInventory ? seatInventoryLoading : false;
  const refreshSeatInventory = useSeatInventory
    ? seatInventoryRefresh
    : async () => [] as EventSeat[];

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setContactInfo(prev => ({
      fullName: prev.fullName || currentUser.fullName || currentUser.username || '',
      email: prev.email || currentUser.email || '',
      phone: prev.phone || currentUser.phone || '',
    }));
  }, [currentUser]);

  const availableSeatsForTier = useMemo(() => {
    if (!selectedTier || seatInventory.length === 0) {
      return 0;
    }
    const matchKeys = new Set(
      [normalizeTierKey(selectedTier.tierCode), normalizeTierKey(selectedTier.tierName)].filter(Boolean) as string[],
    );
    return seatInventory.filter(seat => {
      if (seat.status !== EventSeatStatus.AVAILABLE) {
        return false;
      }
      if (matchKeys.size === 0) {
        return seat.tierCode === selectedTier.tierCode;
      }
      const seatKeys = [normalizeTierKey(seat.tierCode), normalizeTierKey(seat.type)].filter(Boolean);
      return seatKeys.some(key => matchKeys.has(key!));
    }).length;
  }, [seatInventory, selectedTier, normalizeTierKey]);

  const backendRemaining = selectedTier ? Math.max(selectedTier.totalQuantity - selectedTier.soldQuantity, 0) : 0;
  const maxSelectable = useMemo(() => {
    if (!selectedTier) {
      return 0;
    }
    if (inventoryLoading && seatInventory.length === 0) {
      return backendRemaining;
    }
    if (availableSeatsForTier > 0) {
      return Math.min(backendRemaining, availableSeatsForTier);
    }
    return backendRemaining;
  }, [availableSeatsForTier, backendRemaining, inventoryLoading, seatInventory.length, selectedTier]);

  useEffect(() => {
    if (!selectedTier) {
      return;
    }
    if (maxSelectable === 0) {
      if (!inventoryLoading) {
        setQuantity(0);
      }
      return;
    }
    setQuantity(prev => {
      const safePrev = Number.isFinite(prev) && prev > 0 ? prev : 1;
      if (safePrev > maxSelectable) {
        return maxSelectable;
      }
      return safePrev;
    });
  }, [inventoryLoading, maxSelectable, selectedTier]);

  const remainingAfterSelection = Math.max(0, maxSelectable - quantity);
  const subtotal = selectedTier ? selectedTier.price * Math.max(quantity, 0) : 0;
  const showCheckoutBar = Boolean(selectedTier && quantity > 0 && maxSelectable !== 0);

  const signedInName = useMemo(() => {
    if (!currentUser) {
      return '';
    }
    if (currentUser.fullName && currentUser.fullName.trim()) {
      const [first] = currentUser.fullName.trim().split(' ');
      return first || currentUser.fullName;
    }
    return currentUser.username ?? currentUser.email;
  }, [currentUser]);

  const handleQuantityAdjust = (delta: number) => {
    setQuantity(prev => {
      const base = Number.isFinite(prev) ? prev : 0;
      const next = Math.max(1, Math.min(base + delta, maxSelectable || 1));
      return next;
    });
  };

  const handleQuantityInput = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const clamped = Math.max(1, Math.min(parsed, maxSelectable || 1));
    setQuantity(clamped);
  };

  const handleReserveTickets = async () => {
    if (!selectedTier) {
      return;
    }

    if (maxSelectable === 0) {
      setFormError('This ticket tier is currently unavailable.');
      return;
    }

    if (quantity <= 0) {
      setFormError('Please select at least one ticket.');
      return;
    }

    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      setFormError('Please provide your name, email, and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (isFreestyleFlow) {
        const hold = await holdService.createHold({
          eventId: id,
          buyerId: currentUser?.id,
          tierSelections: [{ tierCode: selectedTier.tierCode, quantity }],
          expiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
        });

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('checkoutContact', JSON.stringify(contactInfo));
        }

        router.push(`/checkout?holdId=${hold.id}`);
        return;
      }

      const refreshedSeats = await refreshSeatInventory({ ignoreRateLimit: true });
      const matchKeys = new Set(
        [normalizeTierKey(selectedTier.tierCode), normalizeTierKey(selectedTier.tierName)].filter(Boolean) as string[],
      );
      const availableForTier = refreshedSeats.filter(seat => {
        if (seat.status !== EventSeatStatus.AVAILABLE) {
          return false;
        }
        if (matchKeys.size === 0) {
          return seat.tierCode === selectedTier.tierCode;
        }
        const seatKeys = [normalizeTierKey(seat.tierCode), normalizeTierKey(seat.type)].filter(Boolean);
        return seatKeys.some(key => matchKeys.has(key!));
      });

      if (availableForTier.length < quantity) {
        setFormError(
          availableForTier.length === 0
            ? `No tickets remain for ${selectedTier.tierName}.`
            : `Only ${availableForTier.length} tickets remain for ${selectedTier.tierName}. Adjust your quantity to continue.`,
        );
        setQuantity(Math.max(availableForTier.length, 0));
        return;
      }

      const seatIds = availableForTier.slice(0, quantity).map(seat => seat.seatId);
      const hold = await holdService.createHold({
        eventId: id,
        buyerId: currentUser?.id,
        seatIds,
        expiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
      });

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('checkoutContact', JSON.stringify(contactInfo));
      }

      router.push(`/checkout?holdId=${hold.id}`);
    } catch (error) {
      console.error('Failed to reserve tickets', error);
      setFormError('We could not reserve those tickets. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const eventDateLabel = useMemo(() => {
    if (!event) {
      return '';
    }
    const start = new Date(event.eventStart);
    return start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [event]);

  useEffect(() => {
    if (!loadingEvent && !allowDirectPurchase) {
      router.replace(`/events/${id}`);
    }
  }, [allowDirectPurchase, id, loadingEvent, router]);

  if (!allowDirectPurchase && !loadingEvent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 text-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm sm:px-6">
          <Link href="/" className="text-base font-semibold text-slate-900">
            Event Manager
          </Link>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <Link href="/profile" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline">
                  My tickets
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hi, {signedInName || 'there'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden rounded-full border border-slate-900/20 bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10">
        <button
          type="button"
          onClick={() => router.push(`/events/${id}#ticket-tiers`)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to event
        </button>

        <div className="grid gap-6 lg:grid-cols-[3fr,2fr] lg:items-start">
          <section className={CARD_BASE_CLASS}>
            {loadingEvent ? (
              <div className="flex min-h-[200px] items-center justify-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : pageError ? (
              <p className="text-sm text-rose-600">{pageError}</p>
            ) : !selectedTier ? (
              <p className="text-sm text-rose-600">We couldn&apos;t find this ticket tier. Please return to the event page.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{eventDateLabel}</p>
                  <h1 className="text-2xl font-semibold text-slate-900">{event?.eventName}</h1>
                  <p className="text-sm text-slate-500">{event?.venueId ? 'Hosted at your selected venue' : 'Venue details coming soon'}</p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Ticket Tier</p>
                      <h2 className="text-xl font-semibold text-slate-900">{selectedTier.tierName}</h2>
                      <p className="text-sm text-slate-500">${selectedTier.price.toFixed(2)} per ticket</p>
                    </div>
                    <div className="rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white">
                      <Ticket className="mr-2 inline h-4 w-4" />
                      {maxSelectable > 0 ? `${maxSelectable} left` : 'Sold out'}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="text-sm font-medium text-slate-700">Select quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(-1)}
                        disabled={quantity <= 1 || maxSelectable === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(maxSelectable, 1)}
                        value={quantity > 0 ? quantity : ''}
                        onChange={event => handleQuantityInput(event.target.value)}
                        disabled={maxSelectable === 0}
                        className="h-12 w-20 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(1)}
                        disabled={maxSelectable === 0 || quantity >= maxSelectable}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {seatInventoryError
                        ? rateLimitedUntil && rateLimitedUntil > Date.now()
                          ? 'Seat availability is temporarily throttled. Please try again in a few seconds.'
                          : (
                              <>
                                We could not refresh live availability.{' '}
                                <button
                                  type="button"
                                  onClick={() => void refreshSeatInventory({ ignoreRateLimit: true })}
                                  className="font-semibold text-slate-700 underline"
                                >
                                  Try again
                                </button>
                              </>
                            )
                        : inventoryLoading && seatInventory.length === 0
                          ? 'Checking live availability...'
                          : maxSelectable === 0
                            ? 'This tier is currently sold out.'
                            : `${remainingAfterSelection} tickets will remain after this selection.`}
                    </p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={event => event.preventDefault()}>
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <User className="h-4 w-4 text-slate-400" /> Full name
                    </label>
                    <input
                      type="text"
                      value={contactInfo.fullName}
                      onChange={event => setContactInfo(prev => ({ ...prev, fullName: event.target.value }))}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" /> Email address
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={event => setContactInfo(prev => ({ ...prev, email: event.target.value }))}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" /> Phone number
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={event => setContactInfo(prev => ({ ...prev, phone: event.target.value }))}
                      placeholder="(000) 000-0000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                </form>

                {formError && <p className="text-sm text-rose-600">{formError}</p>}

                <Button
                  type="button"
                  onClick={handleReserveTickets}
                  disabled={submitting || maxSelectable === 0 || quantity <= 0}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Reserving tickets...
                    </>
                  ) : (
                    <>Continue to checkout</>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500">Tickets are held for 15 minutes once you continue.</p>
              </div>
            )}
          </section>

          <aside className="space-y-6 rounded-2xl lg:sticky lg:top-6">
            <section className={CARD_BASE_CLASS}>
              <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>{selectedTier?.tierName ?? 'Ticket'}</span>
                  <span>
                    {quantity > 0 ? `${quantity} × $${selectedTier?.price.toFixed(2) ?? '0.00'}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <section className={CARD_BASE_CLASS}>
              <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Questions about this ticket type or your purchase? Reach out to our support team and we&apos;ll be happy to assist.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <a href="tel:+1-800-555-1234" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                  <Phone className="h-4 w-4" /> +1 (800) 555-1234
                </a>
                <a href="mailto:support@eventmanager.com" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                  <Mail className="h-4 w-4" /> support@eventmanager.com
                </a>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {showCheckoutBar && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-6px_12px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-base font-semibold text-slate-900">${subtotal.toFixed(2)}</p>
              </div>
              <Button
                type="button"
                onClick={handleReserveTickets}
                disabled={submitting || maxSelectable === 0 || quantity <= 0}
                className="flex-1 rounded-2xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Reserving…' : 'Continue to checkout'}
              </Button>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-4 z-30 hidden justify-center px-4 lg:flex">
            <div className="flex w-full max-w-3xl items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-3 shadow-lg shadow-slate-300/60">
              <div className="flex flex-1 items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selection</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {quantity} seat{quantity === 1 ? '' : 's'} · {selectedTier?.tierName ?? 'Tier'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="text-lg font-semibold text-slate-900">${subtotal.toFixed(2)}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleReserveTickets}
                disabled={submitting || maxSelectable === 0 || quantity <= 0}
                className="min-w-[180px] rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Reserving…' : 'Continue to checkout'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
