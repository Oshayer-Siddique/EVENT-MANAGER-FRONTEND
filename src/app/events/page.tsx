'use client';
import { useState, useEffect } from 'react';
import { listEvents } from '../../services/eventService';
import { Event } from '../../types/event';
import Link from 'next/link';

const EventsPage = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsPage = await listEvents();
                setEvents(eventsPage.content);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            }
            setLoading(false);
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <div>Loading events...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                    <div key={event.id} className="border rounded-lg overflow-hidden shadow-lg">
                        <Link href={`/events/${event.id}`}>
                            
                                {event.imageUrls && event.imageUrls.length > 0 && (
                                    <img src={event.imageUrls[0]} alt={event.eventName} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-4">
                                    <h2 className="text-2xl font-semibold mb-2">{event.eventName}</h2>
                                    <p className="text-gray-600 mb-4">{new Date(event.eventStart).toLocaleDateString()}</p>
                                    <p className="text-gray-800">Tickets from ${Math.min(...event.ticketTiers.map(t => t.price))}</p>
                                </div>
                            
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsPage;