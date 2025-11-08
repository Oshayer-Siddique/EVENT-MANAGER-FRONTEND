import { use } from 'react';

import TicketSelectionPageClient, { TicketSelectionPageClientProps } from './TicketSelectionPageClient';

type RouteParams = TicketSelectionPageClientProps['params'];

interface TicketSelectionPageProps {
  params: RouteParams | Promise<RouteParams>;
}

export default function TicketSelectionPage({ params }: TicketSelectionPageProps) {
  const resolvedParams = use(Promise.resolve(params));
  return <TicketSelectionPageClient params={resolvedParams} />;
}
