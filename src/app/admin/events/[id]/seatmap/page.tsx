import { use } from 'react';

import SeatMapDesignerClient from './SeatMapDesignerClient';

interface SeatMapPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default function SeatMapDesignerPage({ params }: SeatMapPageProps) {
  const resolvedParams = use(Promise.resolve(params));
  return <SeatMapDesignerClient params={resolvedParams} />;
}
