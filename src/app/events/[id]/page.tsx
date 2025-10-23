'use client';
import { useState, useEffect } from 'react';
import { getEvent } from '../../../services/eventService';
import { createHold } from '../../../services/holdService';
import { Event } from '../../../types/event';
import { EventSeat } from '../../../types/eventSeat';
import { HoldCreateRequest } from '../../../types/hold';
import SeatMap from '../../../components/booking/SeatMap';

interface EventDetailPageProps {
    params: {
        id: string;
    }
}

const EventDetailPage = ({ params }: EventDetailPageProps) => {
    const { id } = params;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (id) {
            const fetchEvent = async () => {
                try {
                    const eventData = await getEvent(id as string);
                    setEvent(eventData);
                } catch (error) {
                    console.error('Failed to fetch event:', error);
                }
                setLoading(false);
            };

            fetchEvent();
        }
    }, [id]);

    const handleSeatSelect = (seat: EventSeat) => {
        setSelectedSeats(prevSeats => {
            const isAlreadySelected = prevSeats.some(s => s.id === seat.id);
            let newSeats;
            if (isAlreadySelected) {
                newSeats = prevSeats.filter(s => s.id !== seat.id);
            } else {
                newSeats = [...prevSeats, seat];
            }
            
            const newTotal = newSeats.reduce((acc, s) => acc + s.price, 0);
            setTotalPrice(newTotal);

            return newSeats;
        });
    };

    const handleReserveSeats = async () => {
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat.');
            return;
        }

        try {
            const holdRequest: HoldCreateRequest = {
                eventId: id,
                seatIds: selectedSeats.map(s => s.id),
                // Expires in 15 minutes, this should be configurable
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                // buyerId can be added here if the user is logged in
            };

            const hold = await createHold(holdRequest);
            console.log('Hold created:', hold);
            
            // Redirect to a checkout page with the hold ID
            window.location.href = `/checkout?holdId=${hold.id}`;

        } catch (error) {
            console.error('Failed to create hold:', error);
            alert('Could not reserve seats. Please try again.');
        }
    };

    if (loading) {
        return <div>Loading event details...</div>;
    }

    if (!event) {
        return <div>Event not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-5xl font-bold mb-4">{event.eventName}</h1>
            <p className="text-xl text-gray-600 mb-8">{new Date(event.eventStart).toLocaleString()}</p>
            
            {event.imageUrls && event.imageUrls.length > 0 && (
                <img src={event.imageUrls[0]} alt={event.eventName} className="w-full h-96 object-cover rounded-lg mb-8" />
            )}

            <div className="prose lg:prose-xl max-w-none">
                <p><strong>Event Type:</strong> {event.typeName}</p>
                <p><strong>Venue:</strong> {event.venueId}</p> {/* Replace with venue name later */}
                
                <h2 className="text-3xl font-bold mt-12 mb-4">Ticket Tiers</h2>
                <ul>
                    {event.ticketTiers.map(tier => (
                        <li key={tier.id}>
                            <strong>{tier.tierName}:</strong> ${tier.price}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Seat map and selection will go here */}
            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-4">Select Your Seats</h2>
                <SeatMap 
                    eventId={id}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                />
            </div>

            {selectedSeats.length > 0 && (
                <div className="mt-8 p-4 border rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold mb-4">Your Selection</h3>
                    <ul>
                        {selectedSeats.map(seat => (
                            <li key={seat.id} className="flex justify-between">
                                <span>Seat {seat.seat.seatNumber} ({seat.tierCode})</span>
                                <span>${seat.price}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t font-bold text-xl flex justify-between">
                        <span>Total</span>
                        <span>${totalPrice}</span>
                    </div>
                    <button 
                        onClick={handleReserveSeats}
                        className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
                    >
                        Reserve Seats
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;