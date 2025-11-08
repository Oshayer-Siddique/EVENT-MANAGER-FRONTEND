import { use } from 'react';

import SelectSeatsClient from './SelectSeatsClient';

interface SeatSelectionPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default function SeatSelectionPage({ params }: SeatSelectionPageProps) {
  const resolvedParams = use(Promise.resolve(params));
  return <SelectSeatsClient params={resolvedParams} />;
}
