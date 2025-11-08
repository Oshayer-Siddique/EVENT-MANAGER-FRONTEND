import { use } from 'react';

import SeatSelectionReviewClient from './SeatSelectionReviewClient';

interface SeatSelectionReviewPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default function SeatSelectionReviewPage({ params }: SeatSelectionReviewPageProps) {
  const resolvedParams = use(Promise.resolve(params));
  return <SeatSelectionReviewClient params={resolvedParams} />;
}
