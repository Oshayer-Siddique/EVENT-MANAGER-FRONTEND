'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { getSeatLayoutById } from '@/services/venueService';
import { createSeatForLayout, deleteSeatForLayout, getSeatsForLayout, updateSeatForLayout } from '@/services/seatService';
import type { Layout } from '@/types/layout';
import type { Seat } from '@/types/seat';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LayoutPreview from '@/components/previews/LayoutPreview';
import BanquetSeatDesigner from '@/components/banquet/BanquetSeatDesigner';

interface SeatFormState {
  row: string;
  number: number;
  type?: string;
  label?: string;
}

const defaultSeatForm: SeatFormState = {
  row: '',
  number: 1,
  type: '',
  label: '',
};

const SeatManagementPage = () => {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;
  const layoutId = params.layoutId as string;

  const [layout, setLayout] = useState<Layout | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<SeatFormState>({ ...defaultSeatForm });
  const [isCreating, setIsCreating] = useState(false);

  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SeatFormState>({ ...defaultSeatForm });
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const backHref = useMemo(() => `/admin/venue/${venueId}`, [venueId]);

  useEffect(() => {
    if (!layoutId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [layoutData, seatData] = await Promise.all([
          getSeatLayoutById(layoutId),
          getSeatsForLayout(layoutId),
        ]);
        setLayout(layoutData);
        setSeats(seatData);
      } catch (err) {
        console.error('Failed to load seat layout:', err);
        setError(err instanceof Error ? err.message : 'Failed to load seat layout.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [layoutId]);

  const refreshSeats = async () => {
    try {
      const seatData = await getSeatsForLayout(layoutId);
      setSeats(seatData);
    } catch (err) {
      console.error('Failed to refresh seats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh seats.');
    }
  };

  const handleCreateSeat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.row.trim()) {
      setError('Row is required.');
      return;
    }
    if (!createForm.number || createForm.number < 1) {
      setError('Seat number must be greater than zero.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await createSeatForLayout(layoutId, {
        row: createForm.row.trim(),
        number: Number(createForm.number),
        type: createForm.type?.trim() || undefined,
        label: createForm.label?.trim() || undefined,
      });
      setCreateForm({ ...defaultSeatForm, number: createForm.number });
      await refreshSeats();
    } catch (err) {
      console.error('Failed to create seat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create seat.');
    } finally {
      setIsCreating(false);
    }
  };

  const beginEditSeat = (seat: Seat) => {
    setEditingSeatId(seat.id);
    setEditForm({
      row: seat.row,
      number: seat.number,
      type: seat.type ?? '',
      label: seat.label,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingSeatId(null);
    setEditForm({ ...defaultSeatForm });
  };

  const handleUpdateSeat = async (seatId: string) => {
    if (!editForm.row.trim()) {
      setError('Row is required.');
      return;
    }
    if (!editForm.number || editForm.number < 1) {
      setError('Seat number must be greater than zero.');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await updateSeatForLayout(layoutId, seatId, {
        row: editForm.row.trim(),
        number: Number(editForm.number),
        type: editForm.type?.trim() || undefined,
        label: editForm.label?.trim() || undefined,
      });
      await refreshSeats();
      cancelEdit();
    } catch (err) {
      console.error('Failed to update seat:', err);
      setError(err instanceof Error ? err.message : 'Failed to update seat.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSeat = async (seatId: string) => {
    if (!window.confirm('Delete this seat? This action cannot be undone.')) {
      return;
    }
    setIsDeletingId(seatId);
    setError(null);
    try {
      await deleteSeatForLayout(layoutId, seatId);
      await refreshSeats();
    } catch (err) {
      console.error('Failed to delete seat:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete seat.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const theaterSummary = layout?.configuration?.kind === 'theater' ? layout.configuration.summary : null;
  const activeRows = theaterSummary
    ? theaterSummary.rows.filter((row) => !row.isWalkway && row.activeSeatCount > 0).length
    : layout?.totalRows;
  const totalCapacity = theaterSummary?.capacity ?? layout?.totalCapacity;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading seat layout…</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Seat layout not found.</p>
      </div>
    );
  }

  const isBanquetLayout = layout.typeName?.toLowerCase() === 'banquet'
    || layout.typeCode?.toLowerCase() === '230';

  if (isBanquetLayout) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.push(backHref)}>
                ← Back to Venue
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/venue/${venueId}/layout/${layoutId}/edit`)}>
                Edit Layout
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-800">Banquet Tables</h1>
              <p className="text-sm text-slate-500">{layout.layoutName} · {layout.typeName}</p>
            </div>
          </div>

          <BanquetSeatDesigner seatLayoutId={layoutId} onSaved={refreshSeats} />

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Generated seats ({seats.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {seats.length === 0 ? (
                <p className="text-sm text-slate-500">Add tables to generate seats automatically.</p>
              ) : (
                <div className="flex flex-wrap gap-2 text-sm text-slate-700">
                  {seats.map(seat => (
                    <span key={seat.id} className="rounded-full border border-slate-200 px-3 py-1">
                      {seat.label}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push(backHref)}>
              ← Back to Venue
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/venue/${venueId}/layout/${layoutId}/edit`)}>
              Edit Layout
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">Manage Seats</h1>
            <p className="text-sm text-slate-500">{layout.layoutName} · {layout.typeName}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className='text-black'>Layout Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {theaterSummary || layout.typeName ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Layout Type</p>
                    <p className="text-lg font-semibold text-slate-800">{layout.typeName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Total Seats</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">{totalCapacity ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Active Rows</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">{activeRows ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Columns</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">{theaterSummary?.columns ?? layout.totalCols ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                      <p className="mt-1 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {layout.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  {theaterSummary?.sections?.length ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">Sections</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {theaterSummary.sections.map((section) => (
                          <span key={section.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                            <span
                              className="inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: section.color }}
                            />
                            {section.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                  <LayoutPreview
                    typeName={layout.typeName}
                    totalRows={layout.totalRows}
                    totalCols={layout.totalCols}
                    totalTables={layout.totalTables}
                    chairsPerTable={layout.chairsPerTable}
                    standingCapacity={layout.standingCapacity}
                    theaterPlan={theaterSummary ?? undefined}
                    configuration={layout.configuration ?? null}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">This layout does not have a stored seating configuration yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-black'>Add Seat</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-4" onSubmit={handleCreateSeat}>
              <div>
                <Label htmlFor="row"  className='text-black'>Row</Label>
                <Input
                  id="row"
                  value={createForm.row}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, row: e.target.value }))}
                  placeholder="e.g., A"
                  required
                  
                />
              </div>
              <div>
                <Label htmlFor="number"  className='text-black'>Number</Label>
                <Input
                  id="number"
                  type="number"
                  min={1}
                  value={createForm.number}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, number: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type"className='text-black'>Type / Section (optional)</Label>
                <Input
                  id="type"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., VIP"
                />
              </div>
              <div>
                <Label htmlFor="label" className='text-black'>Label (optional)</Label>
                <Input
                  id="label"
                  value={createForm.label}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Defaults to ROW-NUMBER"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Saving…' : 'Add Seat'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-black'>Seats ({seats.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {seats.length === 0 ? (
              <p className="text-sm text-slate-500">No seats defined yet. Add seats to make them available for events.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Row</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Number</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Label</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Type / Section</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {seats.map((seat) => {
                      const isEditing = editingSeatId === seat.id;
                      return (
                        <tr key={seat.id}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editForm.row}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, row: e.target.value }))}
                              />
                            ) : (
                              <span className="font-medium text-slate-800">{seat.row}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={1}
                                value={editForm.number}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, number: Number(e.target.value) }))}
                              />
                            ) : (
                              <span className="font-medium text-slate-800">{seat.number}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editForm.label ?? ''}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, label: e.target.value }))}
                                placeholder="Defaults to ROW-NUMBER"
                              />
                            ) : (
                              <span className="text-slate-600">{seat.label}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editForm.type ?? ''}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                                placeholder="Optional type/section"
                              />
                            ) : (
                              <span className="text-slate-600">{seat.type ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateSeat(seat.id)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? 'Saving…' : 'Save'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => beginEditSeat(seat)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteSeat(seat.id)}
                                  disabled={isDeletingId === seat.id}
                                >
                                  {isDeletingId === seat.id ? 'Deleting…' : 'Delete'}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeatManagementPage;
