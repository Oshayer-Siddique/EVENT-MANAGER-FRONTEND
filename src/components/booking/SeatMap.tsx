'use client';

import { useEffect, useMemo, useState } from 'react';

import { getEventSeats } from '../../services/eventSeatService';
import { EventSeat, EventSeatStatus } from '../../types/eventSeat';
import type { EventTicketTier, SeatLayoutSummary } from '../../types/event';

interface SeatMapProps {
  eventId: string;
  selectedSeats: EventSeat[];
  onSeatSelect: (seat: EventSeat) => void;
  tiers: EventTicketTier[];
  seatLayout?: SeatLayoutSummary | null;
}

const SeatMap = ({ eventId, selectedSeats, onSeatSelect, tiers, seatLayout }: SeatMapProps) => {
  const [seats, setSeats] = useState<EventSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<string>('ALL');
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        setError(null);
        const seatData = await getEventSeats(eventId);
        setSeats(seatData);

        const sectionNames = Array.from(
          new Set(seatData.map(seat => seat.type ?? 'General Seating')),
        );
        setActiveSection(sectionNames[0] ?? 'General Seating');
      } catch (err) {
        console.error('Failed to fetch event seats:', err);
        setError('Seat layout is not available for this event yet.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [eventId]);

  const tierLabelMap = useMemo(() => {
    const map = new Map<string, { name: string; price: number }>();
    tiers.forEach(tier => map.set(tier.tierCode, { name: tier.tierName, price: tier.price }));
    return map;
  }, [tiers]);

  const filteredSeats = useMemo(() => {
    if (activeTier === 'ALL') return seats;
    return seats.filter(seat => seat.tierCode === activeTier || seat.type === activeTier);
  }, [activeTier, seats]);

  const sectionGroups = useMemo(() => {
    const groups = new Map<string, Map<string, EventSeat[]>>();
    filteredSeats.forEach(seat => {
      const section = seat.type ?? 'General Seating';
      const row = seat.row ?? 'Row';
      if (!groups.has(section)) {
        groups.set(section, new Map());
      }
      const rowMap = groups.get(section)!;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(seat);
    });

    // Sort rows and seats for consistent display
    groups.forEach(rowMap => {
      rowMap.forEach(list =>
        list.sort((a, b) =>
          naturalSeatComparator(a.label ?? a.number, b.label ?? b.number),
        ),
      );
    });

    return groups;
  }, [filteredSeats]);

  useEffect(() => {
    if (sectionGroups.size === 0) {
      setActiveSection('');
      return;
    }
    if (!activeSection || !sectionGroups.has(activeSection)) {
      setActiveSection(sectionGroups.keys().next().value ?? 'General Seating');
    }
  }, [activeSection, sectionGroups]);

  const handleSeatPress = (seat: EventSeat) => {
    if (seat.status !== EventSeatStatus.AVAILABLE) return;
    onSeatSelect(seat);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <span className="text-sm text-gray-600">Loading seat layout…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        {error}
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        No seats have been configured for this event yet. Please check back later or contact the event
        organizer.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Choose your seats</h3>
          {seatLayout && (
            <p className="text-sm text-gray-500">
              Layout: {seatLayout.layoutName} · Capacity {seatLayout.totalCapacity}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={activeTier === 'ALL'}
            label="All tiers"
            onClick={() => setActiveTier('ALL')}
          />
          {tiers.map(tier => (
            <FilterPill
              key={tier.id}
              active={activeTier === tier.tierCode}
              label={`${tier.tierName} · $${tier.price.toFixed(2)}`}
              onClick={() => setActiveTier(tier.tierCode)}
            />
          ))}
        </div>
      </div>

      <SeatLegend />

      <div className="flex flex-wrap gap-2">
        {Array.from(sectionGroups.keys()).map(section => (
          <SectionChip
            key={section}
            label={section}
            active={section === activeSection}
            onClick={() => setActiveSection(section)}
          />
        ))}
      </div>

      {activeSection ? (
        <div className="space-y-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
          {Array.from(sectionGroups.get(activeSection)?.entries() ?? []).map(([row, rowSeats]) => (
            <div key={row} className="space-y-2">
              <div className="font-medium text-gray-700">{row}</div>
              <div className="flex flex-wrap gap-2">
                {rowSeats.map(seat => {
                  const isSelected = selectedSeats.some(
                    selected => selected.eventSeatId === seat.eventSeatId,
                  );
                  const tier = tierLabelMap.get(seat.tierCode ?? seat.type ?? '');
                  const statusLabel = statusCopy(seat.status);
                  const seatLabel = seat.label
                    ?? (seat.row && seat.number !== undefined
                      ? `${seat.row}${seat.number}`
                      : seat.row ?? String(seat.number ?? 'Seat'));
                  const displayPrice = seat.price ?? tier?.price;
                  const numericPrice =
                    displayPrice !== undefined ? Number(displayPrice) : undefined;
                  const tooltip = `${seatLabel} · ${tier?.name ?? seat.tierCode ?? 'Seat'} · ${statusLabel}`;
                  return (
                    <button
                      key={seat.eventSeatId}
                      type="button"
                      className={buildSeatClasses(seat.status, isSelected)}
                      onClick={() => handleSeatPress(seat)}
                      disabled={seat.status !== EventSeatStatus.AVAILABLE}
                      aria-label={tooltip}
                    >
                      <span className="text-xs font-semibold">{seatLabel}</span>
                      {numericPrice !== undefined && !Number.isNaN(numericPrice) && (
                        <span className="text-[10px] text-gray-500">${numericPrice.toFixed(0)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          No seating sections match the current filters.
        </div>
      )}
    </div>
  );
};

export default SeatMap;

const FilterPill = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-sm transition ${
      active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
    }`}
  >
    {label}
  </button>
);

const SectionChip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-sm transition ${
      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const SeatLegend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
    <LegendItem color="bg-green-100 border-green-500" label="Available" />
    <LegendItem color="bg-blue-100 border-blue-500" label="Selected" />
    <LegendItem color="bg-yellow-100 border-yellow-500" label="Reserved" />
    <LegendItem color="bg-red-100 border-red-500" label="Sold" />
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-2">
    <span className={`h-4 w-4 rounded border ${color}`} />
    {label}
  </span>
);

const buildSeatClasses = (status: EventSeatStatus, isSelected: boolean) => {
  if (isSelected) {
    return 'flex h-12 w-12 flex-col items-center justify-center rounded-md border-2 border-blue-500 bg-blue-100 text-blue-700 shadow-sm';
  }

  const base =
    'flex h-12 w-12 flex-col items-center justify-center rounded-md border bg-white text-gray-600 shadow-sm transition';

  switch (status) {
    case EventSeatStatus.AVAILABLE:
      return `${base} border-green-500 hover:-translate-y-0.5 hover:border-green-600 hover:shadow`;
    case EventSeatStatus.RESERVED:
      return `${base} cursor-not-allowed border-yellow-500 bg-yellow-50 text-yellow-700`;
    case EventSeatStatus.SOLD:
      return `${base} cursor-not-allowed border-red-500 bg-red-50 text-red-600`;
    default:
      return `${base} border-gray-300 bg-gray-100 text-gray-500`;
  }
};

const naturalSeatComparator = (a?: string | number, b?: string | number) => {
  const strA = a !== undefined && a !== null ? String(a) : '';
  const strB = b !== undefined && b !== null ? String(b) : '';
  if (!strA || !strB) return 0;
  const regex = /(\d+)|(\D+)/g;
  const aParts = strA.match(regex) ?? [];
  const bParts = strB.match(regex) ?? [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const partA = aParts[i] ?? '';
    const partB = bParts[i] ?? '';
    if (partA === partB) continue;

    const numA = Number(partA);
    const numB = Number(partB);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB;
    }
    return partA.localeCompare(partB);
  }
  return 0;
};

const statusCopy = (status: EventSeatStatus) => {
  switch (status) {
    case EventSeatStatus.AVAILABLE:
      return 'Available';
    case EventSeatStatus.RESERVED:
      return 'Reserved';
    case EventSeatStatus.SOLD:
      return 'Sold';
    default:
      return 'Unavailable';
  }
};
