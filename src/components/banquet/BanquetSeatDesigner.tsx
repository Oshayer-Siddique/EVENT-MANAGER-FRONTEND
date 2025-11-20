'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';

import type { BanquetLayout } from '@/types/banquet';
import { getBanquetLayout, saveBanquetLayout } from '@/services/banquetLayoutService';
import { Button } from '@/components/ui/button';
import BanquetLayoutBuilder from './BanquetLayoutBuilder';

interface BanquetSeatDesignerProps {
  seatLayoutId: string;
  onSaved?: () => void;
}

const BanquetSeatDesigner = ({ seatLayoutId, onSaved }: BanquetSeatDesignerProps) => {
  const [layout, setLayout] = useState<BanquetLayout>({ tables: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLayout = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBanquetLayout(seatLayoutId);
      setLayout({ tables: data.tables ?? [] });
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load banquet layout.');
    } finally {
      setLoading(false);
    }
  }, [seatLayoutId]);

  useEffect(() => {
    void loadLayout();
  }, [loadLayout]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await saveBanquetLayout(seatLayoutId, layout);
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError('Unable to save banquet layout.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading banquet designer…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <BanquetLayoutBuilder value={layout} onChange={setLayout} />
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save layout
        </Button>
      </div>
    </div>
  );
};

export default BanquetSeatDesigner;
