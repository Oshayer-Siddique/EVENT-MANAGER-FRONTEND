'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent, getEventTicketDetails } from '@/services/eventService';
import { getVenueById } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { getArtists } from '@/services/artistService';
import { getSponsors } from '@/services/sponsorService';
import { getBusinessOrganizations } from '@/services/businessOrganizationService';
import { Event, EventTicketDetails } from '@/types/event';
import { Venue } from '@/types/venue';
import { User } from '@/types/user';
import { Artist } from '@/types/artist';
import { Sponsor } from '@/types/sponsor';
import { BusinessOrganization } from '@/types/businessOrganization';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Ticket, Armchair, Users, Building, Mic, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ViewEventPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [event, setEvent] = useState<Event | null>(null);
    const [ticketDetails, setTicketDetails] = useState<EventTicketDetails | null>(null);
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
                const eventId = id as string;
                const [eventData, ticketDetailsData] = await Promise.all([
                    getEvent(eventId),
                    getEventTicketDetails(eventId)
                ]);
                setEvent(eventData);
                setTicketDetails(ticketDetailsData);

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
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!event || !ticketDetails) {
        return <div className="flex justify-center items-center min-h-screen">Event not found.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back
                    </Button>
                    <Button onClick={() => router.push(`/admin/events/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Event
                    </Button>
                </div>

                <Card className="mb-6 overflow-hidden">
                    <div className="relative h-48 sm:h-64 md:h-80 w-full">
                        <Image
                            src={ticketDetails.imageUrls?.[0] || '/placeholder.jpg'}
                            alt={event.eventName}
                            layout="fill"
                            objectFit="cover"
                            className="bg-gray-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.eventName}</h1>
                            <Badge variant="secondary" className="mt-2">{event.typeName}</Badge>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Details Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p><strong className="font-semibold">Code:</strong> {event.eventCode}</p>
                                <p><strong className="font-semibold">Venue:</strong> {venue?.venueName}</p>
                                <p><strong className="font-semibold">Starts:</strong> {new Date(event.eventStart).toLocaleString()}</p>
                                <p><strong className="font-semibold">Ends:</strong> {new Date(event.eventEnd).toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        {/* Ticket Tiers Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Ticket className="mr-2 h-5 w-5" />
                                    Ticket Tiers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div className="font-semibold">Tier</div>
                                    <div className="font-semibold text-right">Price</div>
                                    <div className="font-semibold text-right">Available</div>
                                    <div className="font-semibold text-right">Sold</div>
                                    {ticketDetails.ticketTiers.map(tier => (
                                        <>
                                            <div key={tier.id} className="font-medium">{tier.tierName}</div>
                                            <div className="text-right">${tier.price.toFixed(2)}</div>
                                            <div className="text-right">{tier.totalQuantity}</div>
                                            <div className="text-right">{tier.soldQuantity || 0}</div>
                                        </>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Seat Layout Card */}
                        {ticketDetails.seatLayout && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Armchair className="mr-2 h-5 w-5" />
                                        Seat Layout
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <p><strong className="font-semibold">Name:</strong> {ticketDetails.seatLayout.layoutName}</p>
                                    <p><strong className="font-semibold">Type:</strong> {ticketDetails.seatLayout.typeName}</p>
                                    <p><strong className="font-semibold">Capacity:</strong> {ticketDetails.seatLayout.totalCapacity}</p>
                                    {ticketDetails.seatLayout.totalRows && <p><strong className="font-semibold">Rows:</strong> {ticketDetails.seatLayout.totalRows}</p>}
                                    {ticketDetails.seatLayout.totalCols && <p><strong className="font-semibold">Cols:</strong> {ticketDetails.seatLayout.totalCols}</p>}
                                    {ticketDetails.seatLayout.standingCapacity && <p><strong className="font-semibold">Standing:</strong> {ticketDetails.seatLayout.standingCapacity}</p>}
                                </CardContent>
                            </Card>
                        )}

                        {/* Staffing Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="mr-2 h-5 w-5" />
                                    Staffing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p><strong className="font-semibold">Manager:</strong> {staff[event.eventManager]?.fullName}</p>
                                <p><strong className="font-semibold">Operator 1:</strong> {staff[event.eventOperator1]?.fullName}</p>
                                {event.eventOperator2 && <p><strong className="font-semibold">Operator 2:</strong> {staff[event.eventOperator2]?.fullName}</p>}
                                <p><strong className="font-semibold">Checker 1:</strong> {staff[event.eventChecker1]?.fullName}</p>
                                {event.eventChecker2 && <p><strong className="font-semibold">Checker 2:</strong> {staff[event.eventChecker2]?.fullName}</p>}
                            </CardContent>
                        </Card>

                    </div>

                    <div className="space-y-6">
                        {/* Organizers Card */}
                        {organizers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building className="mr-2 h-5 w-5" />
                                        Organizers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {organizers.map(o => (
                                        <div key={o.id} className="text-sm">
                                            <p className="font-semibold">{o.name}</p>
                                            <p className="text-xs text-gray-600">{o.email}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Artists Card */}
                        {artists.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Mic className="mr-2 h-5 w-5" />
                                        Artists
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {artists.map(a => (
                                        <div key={a.id} className="text-sm">
                                            <p className="font-semibold">{a.name}</p>
                                            <p className="text-xs text-gray-600">{a.email}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Sponsors Card */}
                        {sponsors.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <DollarSign className="mr-2 h-5 w-5" />
                                        Sponsors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {sponsors.map(s => (
                                        <div key={s.id} className="text-sm">
                                            <p className="font-semibold">{s.name}</p>
                                            <p className="text-xs text-gray-600">{s.email}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}