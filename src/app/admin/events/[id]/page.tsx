'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent } from '@/services/eventService';
import { getVenueById } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { getArtists } from '@/services/artistService';
import { getSponsors } from '@/services/sponsorService';
import { getBusinessOrganizations } from '@/services/businessOrganizationService';
import { Event } from '@/types/event';
import { Venue } from '@/types/venue';
import { User } from '@/types/user';
import { Artist } from '@/types/artist';
import { Sponsor } from '@/types/sponsor';
import { BusinessOrganization } from '@/types/businessOrganization';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';

export default function ViewEventPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [staff, setStaff] = useState<Record<string, User | undefined>>({});
  const [artists, setArtists] = useState<Artist[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [organizers, setOrganizers] = useState<BusinessOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const eventData = await getEvent(id as string);
        setEvent(eventData);

        const [venueData, eventManagersData, operatorsData, eventCheckersData, artistsData, sponsorsData, organizersData] = await Promise.all([
          getVenueById(eventData.venueId),
          getEventManagers(),
          getOperators(),
          getEventCheckers(),
          getArtists(),
          getSponsors(),
          getBusinessOrganizations(),
        ]);

        setVenue(venueData);

        const allStaff = [...eventManagersData, ...operatorsData, ...eventCheckersData];
        const staffMap = allStaff.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, User>);
        setStaff(staffMap);

        setArtists(artistsData.filter(a => eventData.artistIds?.includes(a.id)));
        setSponsors(sponsorsData.filter(s => eventData.sponsorIds?.includes(s.id)));
        setOrganizers(organizersData.filter(o => eventData.organizerIds?.includes(o.id)));

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!event) {
    return <p>Event not found.</p>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
            <div>
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800 ml-2 inline-block">Event Details</h1>
            </div>
            <Button onClick={() => router.push(`/admin/events/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Event
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-gray-200 space-y-8">
                {/* Event Info */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900">{event.eventName}</h2>
                    <p className="text-md text-gray-600">{event.typeName}</p>
                    <div className="mt-6 grid grid-cols-2 gap-6 text-sm text-gray-700">
                        <p><span className="font-semibold text-gray-900">Code:</span> {event.eventCode}</p>
                        <p><span className="font-semibold text-gray-900">Venue:</span> {venue?.venueName}</p>
                        <p><span className="font-semibold text-gray-900">Starts:</span> {new Date(event.eventStart).toLocaleString()}</p>
                        <p><span className="font-semibold text-gray-900">Ends:</span> {new Date(event.eventEnd).toLocaleString()}</p>
                    </div>
                </section>

                {/* Staffing */}
                <section>
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-3 mb-4">Staffing</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <p><span className="font-semibold text-gray-900">Manager:</span> {staff[event.eventManager]?.fullName}</p>
                        <p><span className="font-semibold text-gray-900">Operator 1:</span> {staff[event.eventOperator1]?.fullName}</p>
                        {event.eventOperator2 && <p><span className="font-semibold text-gray-900">Operator 2:</span> {staff[event.eventOperator2]?.fullName}</p>}
                        <p><span className="font-semibold text-gray-900">Checker 1:</span> {staff[event.eventChecker1]?.fullName}</p>
                        {event.eventChecker2 && <p><span className="font-semibold text-gray-900">Checker 2:</span> {staff[event.eventChecker2]?.fullName}</p>}
                    </div>
                </section>

                {/* Ticketing */}
                <section>
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-3 mb-4">Ticketing</h3>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">Tier</div>
                        <div className="font-semibold text-gray-900 text-right">Price</div>
                        <div className="font-semibold text-gray-900 text-right">Available</div>
                        <div className="font-semibold text-gray-900 text-right">Sold</div>
                        {['vip', 'plat', 'gold', 'silver'].map(tier => (
                            event[tier + 'Tickets'] && <>
                                <div className="font-medium">{tier.toUpperCase()}</div>
                                <div className="text-right">${event[tier + 'TicketPrice']?.toFixed(2)}</div>
                                <div className="text-right">{event[tier + 'Tickets']}</div>
                                <div className="text-right">{event[tier + 'TicketsSold'] || 0}</div>
                            </>
                        ))}
                    </div>
                </section>
            </div>

            {/* Right Column: Associations */}
            <div className="lg:col-span-1 bg-white p-8 rounded-xl shadow-lg border border-gray-200 space-y-6">
                <section>
                    <h3 className="text-xl font-bold text-gray-900">Artists</h3>
                    <div className="mt-2 space-y-4">
                        {artists.map(a => (
                            <div key={a.id}>
                                <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                                <p className="text-xs text-gray-600">{a.email}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-bold text-gray-900">Sponsors</h3>
                    <div className="mt-2 space-y-4">
                        {sponsors.map(s => (
                            <div key={s.id}>
                                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-600">{s.email}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h3 className="text-xl font-bold text-gray-900">Organizers</h3>
                    <div className="mt-2 space-y-4">
                        {organizers.map(o => (
                            <div key={o.id}>
                                <p className="text-sm font-semibold text-gray-800">{o.name}</p>
                                <p className="text-xs text-gray-600">{o.email}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
}