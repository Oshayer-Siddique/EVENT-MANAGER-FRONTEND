'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Percent,
  PlusCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import discountService from '@/services/discountService';
import { listEvents, getEventTicketDetails } from '@/services/eventService';
import type { DiscountRequest, DiscountResponse, DiscountValueType } from '@/types/discount';
import type { Event } from '@/types/event';
import { Button } from '@/components/ui/button';

const defaultRequest: DiscountRequest = {
  name: '',
  code: '',
  valueType: 'PERCENTAGE',
  value: 10,
  autoApply: false,
  stackable: false,
  active: true,
  allowGuestRedemption: false,
  priority: 0,
};

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
};

const toInputValue = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return date.toISOString();
};

const DiscountAdminPage = () => {
  const [discounts, setDiscounts] = useState<DiscountResponse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [formValues, setFormValues] = useState<DiscountRequest>(defaultRequest);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tierOptions, setTierOptions] = useState<Record<string, { code: string; name: string }[]>>({});
  const [tierLoading, setTierLoading] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [discountList, eventPage] = await Promise.all([
        discountService.list(eventFilter === 'all' ? undefined : eventFilter),
        listEvents(0, 100),
      ]);
      setDiscounts(discountList);
      setEvents(eventPage.content);
    } catch (err) {
      console.error('Failed to load discounts', err);
      setError(err instanceof Error ? err.message : 'Failed to load discounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [eventFilter]);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(discount => {
      const query = search.trim().toLowerCase();
      return (
        !query ||
        discount.name.toLowerCase().includes(query) ||
        discount.code.toLowerCase().includes(query) ||
        (discount.tierCode ?? '').toLowerCase().includes(query)
      );
    });
  }, [discounts, search]);

  const stats = useMemo(() => {
    const total = discounts.length;
    const active = discounts.filter(d => d.active).length;
    const autoApply = discounts.filter(d => d.autoApply).length;
    const stacked = discounts.filter(d => d.stackable).length;
    return [
      { label: 'Total Discounts', value: total, description: 'Codes your team manages.' },
      { label: 'Active Now', value: active, description: 'Currently redeemable.' },
      { label: 'Auto Apply', value: autoApply, description: 'Automatic incentives.' },
      { label: 'Stackable', value: stacked, description: 'Can combine with others.' },
    ];
  }, [discounts]);

  const openCreatePanel = () => {
    setFormValues(defaultRequest);
    setEditingId(null);
    setFormError(null);
    setPanelOpen(true);
  };

  const openEditPanel = (discount: DiscountResponse) => {
    setFormValues({
      name: discount.name,
      code: discount.code,
      valueType: discount.valueType,
      value: discount.value,
      maxDiscountAmount: discount.maxDiscountAmount,
      minimumOrderAmount: discount.minimumOrderAmount,
      maxRedemptions: discount.maxRedemptions,
      maxRedemptionsPerBuyer: discount.maxRedemptionsPerBuyer,
      startsAt: discount.startsAt,
      endsAt: discount.endsAt,
      eventId: discount.eventId,
      tierCode: discount.tierCode,
      autoApply: discount.autoApply,
      stackable: discount.stackable,
      active: discount.active,
      allowGuestRedemption: discount.allowGuestRedemption,
      priority: discount.priority,
      notes: discount.notes,
    });
    setEditingId(discount.id);
    setFormError(null);
    setPanelOpen(true);
    void ensureTierOptions(discount.eventId ?? undefined);
  };

  const handleFormChange = (key: keyof DiscountRequest, value: string | number | boolean | undefined) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const ensureTierOptions = async (eventId?: string) => {
    if (!eventId || tierOptions[eventId]) {
      return;
    }
    try {
      setTierLoading(true);
      const details = await getEventTicketDetails(eventId);
      setTierOptions(prev => ({
        ...prev,
        [eventId]: (details.ticketTiers ?? []).map(tier => ({ code: tier.tierCode, name: tier.tierName })),
      }));
    } catch (err) {
      console.error('Failed to load tier options', err);
    } finally {
      setTierLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formValues.name || !formValues.code || !formValues.value) {
      setFormError('Name, code, and value are required.');
      return;
    }
    const payload: DiscountRequest = {
      ...formValues,
      code: formValues.code.trim().toUpperCase(),
      startsAt: toIsoValue(formValues.startsAt),
      endsAt: toIsoValue(formValues.endsAt),
    };

    try {
      setFormSubmitting(true);
      setFormError(null);
      if (editingId) {
        await discountService.update(editingId, payload);
      } else {
        await discountService.create(payload);
      }
      setPanelOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save discount', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save discount');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (discount: DiscountResponse) => {
    try {
      await discountService.update(discount.id, {
        name: discount.name,
        code: discount.code,
        valueType: discount.valueType,
        value: discount.value,
        maxDiscountAmount: discount.maxDiscountAmount,
        minimumOrderAmount: discount.minimumOrderAmount,
        maxRedemptions: discount.maxRedemptions,
        maxRedemptionsPerBuyer: discount.maxRedemptionsPerBuyer,
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
        eventId: discount.eventId,
        tierCode: discount.tierCode,
        autoApply: discount.autoApply,
        stackable: discount.stackable,
        allowGuestRedemption: discount.allowGuestRedemption,
        priority: discount.priority,
        notes: discount.notes,
        active: !discount.active,
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle discount status', err);
      alert(err instanceof Error ? err.message : 'Failed to update discount');
    }
  };

  const renderPanel = () => (
    <div className={`fixed inset-0 z-40 bg-black/30 transition ${panelOpen ? 'opacity-100 visible' : 'invisible opacity-0'}`}>
      <div className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{editingId ? 'Update existing discount' : 'Create a promotion'}</p>
            <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit discount' : 'New discount'}</h2>
          </div>
          <button type="button" onClick={() => setPanelOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-64px)] overflow-y-auto px-6 pb-24 pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
              <input
                type="text"
                value={formValues.name}
                onChange={event => handleFormChange('name', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Holiday Special"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code</label>
              <input
                type="text"
                value={formValues.code}
                onChange={event => handleFormChange('code', event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="HOLIDAY25"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value type</label>
                <select
                  value={formValues.valueType}
                  onChange={event => handleFormChange('valueType', event.target.value as DiscountValueType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="AMOUNT">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formValues.value}
                  onChange={event => handleFormChange('value', Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max discount (optional)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formValues.maxDiscountAmount ?? ''}
                  onChange={event => handleFormChange('maxDiscountAmount', event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minimum order (optional)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formValues.minimumOrderAmount ?? ''}
                  onChange={event => handleFormChange('minimumOrderAmount', event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max redemptions</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.maxRedemptions ?? ''}
                  onChange={event => handleFormChange('maxRedemptions', event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per buyer limit</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.maxRedemptionsPerBuyer ?? ''}
                  onChange={event => handleFormChange('maxRedemptionsPerBuyer', event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="2"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</label>
                <input
                  type="datetime-local"
                  value={toInputValue(formValues.startsAt)}
                  onChange={event => handleFormChange('startsAt', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</label>
                <input
                  type="datetime-local"
                  value={toInputValue(formValues.endsAt)}
                  onChange={event => handleFormChange('endsAt', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Event (optional)
              </label>
              <select
                value={formValues.eventId ?? ''}
                onChange={event => {
                  const value = event.target.value || undefined;
                  handleFormChange('eventId', value);
                  handleFormChange('tierCode', undefined);
                  void ensureTierOptions(value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tier (optional)</label>
              {formValues.eventId ? (
                <select
                  value={formValues.tierCode ?? ''}
                  onChange={event => handleFormChange('tierCode', event.target.value || undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">All tiers</option>
                  {(tierOptions[formValues.eventId] ?? []).map(tier => (
                    <option key={tier.code} value={tier.code}>
                      {tier.name} ({tier.code})
                    </option>
                  ))}
                  {tierLoading && <option value="" disabled>Loading tiers…</option>}
                </select>
              ) : (
                <input
                  type="text"
                  value={formValues.tierCode ?? ''}
                  onChange={event => handleFormChange('tierCode', event.target.value || undefined)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Enter tier code (e.g., VIP)"
                />
              )}
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formValues.autoApply}
                  onChange={event => handleFormChange('autoApply', event.target.checked)}
                />
                Auto apply this discount when conditions match
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formValues.stackable}
                  onChange={event => handleFormChange('stackable', event.target.checked)}
                />
                Allow stacking with other promos
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formValues.allowGuestRedemption}
                  onChange={event => handleFormChange('allowGuestRedemption', event.target.checked)}
                />
                Allow guest checkout to use this code
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formValues.active !== false}
                  onChange={event => handleFormChange('active', event.target.checked)}
                />
                Active
              </label>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
              <input
                type="number"
                value={formValues.priority ?? 0}
                onChange={event => handleFormChange('priority', Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
              <textarea
                value={formValues.notes ?? ''}
                onChange={event => handleFormChange('notes', event.target.value || undefined)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Internal description for teammates"
              />
            </div>
          </div>
          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 py-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={formSubmitting}
            className="w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {formSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : (
              editingId ? 'Update discount' : 'Create discount'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {renderPanel()}
      <section className="rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-sky-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Revenue toolkit</p>
            <h1 className="mt-2 text-3xl font-bold">Discount Manager</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Launch promotional codes, fine-tune auto-applied incentives, and keep tabs on active campaigns from a single control surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              className="rounded-full border border-white/30 bg-white/10 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Syncing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </span>
              )}
            </Button>
            <Button
              type="button"
              onClick={openCreatePanel}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-900 shadow-lg hover:-translate-y-0.5"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create discount
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, description }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-white/70">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Search by name, code, tier"
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:max-w-xs"
            />
            <select
              value={eventFilter}
              onChange={event => setEventFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredDiscounts.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{discounts.length}</span> discounts
          </p>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <p className="mt-2 text-sm">Loading discounts…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Discount</th>
                  <th className="px-6 py-3 text-left">Scope</th>
                  <th className="px-6 py-3 text-center">Value</th>
                  <th className="px-6 py-3 text-center">Window</th>
                  <th className="px-6 py-3 text-center">Auto / Stack</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map(discount => (
                  <tr key={discount.id} className="border-t border-slate-100 text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{discount.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{discount.code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p>{discount.eventId ? events.find(e => e.id === discount.eventId)?.eventName ?? 'Event specific' : 'All events'}</p>
                      <p className="text-xs text-slate-500">Tier {discount.tierCode ?? 'All tiers'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        <Percent className="h-3 w-3" />
                        {discount.valueType === 'PERCENTAGE'
                          ? `${discount.value}%`
                          : formatMoney(discount.value)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500">
                      <div>{discount.startsAt ? new Date(discount.startsAt).toLocaleDateString() : 'No start'}</div>
                      <div>{discount.endsAt ? new Date(discount.endsAt).toLocaleDateString() : 'No end'}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs">
                      <p className={`font-semibold ${discount.autoApply ? 'text-emerald-700' : 'text-slate-500'}`}>
                        Auto: {discount.autoApply ? 'Yes' : 'No'}
                      </p>
                      <p className={`font-semibold ${discount.stackable ? 'text-emerald-700' : 'text-slate-500'}`}>
                        Stack: {discount.stackable ? 'Yes' : 'No'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${discount.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {discount.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(discount)}
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          title="Toggle status"
                        >
                          {discount.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditPanel(discount)}
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          title="Edit discount"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDiscounts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                      No discounts match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DiscountAdminPage;
