'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent, getEventTicketDetails, syncEventSeats } from '@/services/eventService';
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
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isSyncingSeats, setIsSyncingSeats] = useState(false);
    const [seatSyncMessage, setSeatSyncMessage] = useState<string | null>(null);
    const [seatSyncError, setSeatSyncError] = useState<string | null>(null);

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
                setSeatSyncMessage(null);
                setSeatSyncError(null);

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

    const handleSyncSeats = async () => {
        if (!id || !ticketDetails?.seatLayout) {
            setSeatSyncError('Seat layout information is unavailable for this event.');
            return;
        }
        if (!ticketDetails.ticketTiers || ticketDetails.ticketTiers.length === 0) {
            setSeatSyncError('Define at least one ticket tier before syncing seats.');
            return;
        }

        const defaultTier = ticketDetails.ticketTiers[0];
        try {
            setIsSyncingSeats(true);
            setSeatSyncMessage(null);
            setSeatSyncError(null);
            const seats = await syncEventSeats(id as string, {
                tierCode: defaultTier.tierCode,
                price: defaultTier.price,
                overwriteExisting: true,
            });
            setSeatSyncMessage(`Seat inventory synced successfully (${seats.length} seats, tier ${defaultTier.tierName}).`);
        } catch (error) {
            console.error('Failed to sync seat inventory:', error);
            setSeatSyncError(error instanceof Error ? error.message : 'Failed to sync seat inventory.');
        } finally {
            setIsSyncingSeats(false);
        }
    };

    useEffect(() => {
        setSelectedImageIndex(0);
    }, [ticketDetails?.imageUrls]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!event || !ticketDetails) {
        return <div className="flex justify-center items-center min-h-screen">Event not found.</div>;
    }

    const imageUrls = ticketDetails.imageUrls && ticketDetails.imageUrls.length > 0
        ? ticketDetails.imageUrls
        : ['/concert.jpg'];

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
                    <div className="relative">
                        <div className="relative h-56 sm:h-72 md:h-96 w-full">
                            <Image
                                src={imageUrls[selectedImageIndex]}
                                alt={`${event.eventName} image ${selectedImageIndex + 1}`}
                                fill
                                className="object-cover bg-gray-200"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 960px"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.eventName}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{event.typeName}</Badge>
                                    <Badge variant="outline" className="text-white border-white">
                                        {new Date(event.eventStart).toLocaleDateString()}
                                    </Badge>
                                    <Badge variant="outline" className="text-white border-white">
                                        {venue?.venueName || 'Venue TBA'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {imageUrls.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto bg-black/60 px-4 pb-4 pt-3 backdrop-blur">
                                {imageUrls.map((url, index) => (
                                    <button
                                        key={`${url}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`relative h-16 w-28 flex-shrink-0 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/40 focus:ring-blue-500 ${
                                            selectedImageIndex === index
                                                ? 'border-blue-500 shadow-md'
                                                : 'border-transparent opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <Image
                                            src={url}
                                            alt={`${event.eventName} thumbnail ${index + 1}`}
                                            fill
                                            className="rounded-md object-cover"
                                            sizes="112px"
                                        />
                                        <span className="sr-only">Select image {index + 1}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Details Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle  className="text-black">Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p>
                                <strong className="font-semibold text-black">Code:</strong>{' '}
                                <span className="text-blue-600">{event.eventCode}</span>
                                </p>
                                <p>
                                <strong className="font-semibold text-black">Venue:</strong>{' '}
                                <span className="text-blue-600">{venue?.venueName}</span>
                                </p>

                                <p>
                                <strong className="font-semibold text-black">Starts:</strong>{' '}
                                <span className="text-blue-600">
                                    {new Date(event.eventStart).toLocaleString()}
                                </span>
                                </p>

                                <p>
                                <strong className="font-semibold text-black">Ends:</strong>{' '}
                                <span className="text-blue-600">
                                    {new Date(event.eventEnd).toLocaleString()}
                                </span>
                                </p>

                            </CardContent>
                        </Card>

                        {/* Description and Policy Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-black">Description & Policy</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-semibold text-black">Event Description</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{event.eventDescription || 'Not provided.'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-black">Privacy Policy</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{event.privacyPolicy || 'Not provided.'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ticket Tiers Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-black">
                                    <Ticket className="mr-2 h-5 w-5" />
                                    Ticket Tiers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-6 gap-4 text-sm">
                                    <div className="font-semibold text-black">Tier</div>
                                    <div className="font-semibold text-right text-black">Price</div>
                                    <div className="font-semibold text-right text-black">Cost</div>
                                    <div className="font-semibold text-right text-black">Available</div>
                                    <div className="font-semibold text-right text-black">Sold</div>
                                    <div className="font-semibold text-center text-black">Visible</div>
                                    {ticketDetails.ticketTiers.map(tier => (
                                        <>
                                            <div key={tier.id} className="font-medium text-black">{tier.tierName}</div>
                                            <div className="text-right text-black">${tier.price.toFixed(2)}</div>
                                            <div className="text-right text-black">${tier.cost.toFixed(2)}</div>
                                            <div className="text-right text-black">{tier.totalQuantity}</div>
                                            <div className="text-right text-black">{tier.soldQuantity || 0}</div>
                                            <div className="text-center text-black">{tier.visible ? 'Yes' : 'No'}</div>
                                        </>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Seat Layout Card */}
                        {ticketDetails.seatLayout && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-4">
                                        <CardTitle className="flex items-center text-black">
                                            <Armchair className="mr-2 h-5 w-5" />
                                            Seat Layout
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSyncSeats}
                                            disabled={isSyncingSeats}
                                        >
                                            {isSyncingSeats ? 'Syncing…' : 'Sync Seats'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                   <p>
  <strong className="font-semibold text-black">Name:</strong>{' '}
  <span className="text-blue-600">{ticketDetails.seatLayout.layoutName}</span>
</p>

<p>
  <strong className="font-semibold text-black">Type:</strong>{' '}
  <span className="text-blue-600">{ticketDetails.seatLayout.typeName}</span>
</p>

<p>
  <strong className="font-semibold text-black">Capacity:</strong>{' '}
  <span className="text-blue-600">{ticketDetails.seatLayout.totalCapacity}</span>
</p>

{ticketDetails.seatLayout.totalRows && (
  <p>
    <strong className="font-semibold text-black">Rows:</strong>{' '}
    <span className="text-blue-600">{ticketDetails.seatLayout.totalRows}</span>
  </p>
)}

{ticketDetails.seatLayout.totalCols && (
  <p>
    <strong className="font-semibold text-black">Cols:</strong>{' '}
    <span className="text-blue-600">{ticketDetails.seatLayout.totalCols}</span>
  </p>
)}

{ticketDetails.seatLayout.standingCapacity && (
  <p>
    <strong className="font-semibold text-black">Standing:</strong>{' '}
    <span className="text-red-600">{ticketDetails.seatLayout.standingCapacity}</span>
  </p>
)}

                                </CardContent>
                                {(seatSyncMessage || seatSyncError) && (
                                    <div className="px-6 pb-4">
                                        {seatSyncMessage && (
                                            <p className="text-xs text-green-600">{seatSyncMessage}</p>
                                        )}
                                        {seatSyncError && (
                                            <p className="text-xs text-red-600">{seatSyncError}</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Staffing Card */}
                        <Card>
                            <CardHeader className='text-black'>
                                <CardTitle className="flex items-center">
                                    <Users className="mr-2 h-5 w-5" />
                                    Staffing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-black">
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
                                <CardHeader className='text-black'>
                                    <CardTitle className="flex items-center">
                                        <Building className="mr-2 h-5 w-5" />
                                        Organizers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {organizers.map(o => (
                                        <div key={o.id} className="text-sm text-black">
                                            <p className="font-semibold">{o.name}</p>
                                            <p className="text-xs text-black">{o.email}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Artists Card */}
                        {artists.length > 0 && (
                            <Card>
                                <CardHeader className='text-black'>
                                    <CardTitle className="flex items-center">
                                        <Mic className="mr-2 h-5 w-5" />
                                        Artists
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {artists.map(a => (
                                        <div key={a.id} className="text-sm text-black">
                                            <p className="font-semibold">{a.name}</p>
                                            <p className="text-xs text-black">{a.email}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Sponsors Card */}
                        {sponsors.length > 0 && (
                            <Card>
                                <CardHeader className='text-black'>
                                    <CardTitle className="flex items-center">
                                        <DollarSign className="mr-2 h-5 w-5" />
                                        Sponsors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {sponsors.map(s => (
                                        <div key={s.id} className="text-sm text-black">
                                            <p className="font-semibold">{s.name}</p>
                                            <p className="text-xs text-black">{s.email}</p>
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
