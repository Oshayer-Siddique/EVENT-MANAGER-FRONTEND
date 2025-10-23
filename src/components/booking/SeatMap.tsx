'use client';
import { useState, useEffect } from 'react';
import { getEventSeats } from '../../services/eventSeatService';
import { EventSeat, EventSeatStatus } from '../../types/eventSeat';

interface SeatMapProps {
    eventId: string;
    selectedSeats: EventSeat[];
    onSeatSelect: (seat: EventSeat) => void;
}

const SeatMap = ({ eventId, selectedSeats, onSeatSelect }: SeatMapProps) => {
    const [seats, setSeats] = useState<EventSeat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const seatData = await getEventSeats(eventId);
                setSeats(seatData);
            } catch (error) {
                console.error('Failed to fetch event seats:', error);
            }
            setLoading(false);
        };

        fetchSeats();
    }, [eventId]);

    const getSeatColor = (seat: EventSeat) => {
        const isSelected = selectedSeats.some(s => s.id === seat.id);
        if (isSelected) return 'bg-blue-500';

        switch (seat.status) {
            case EventSeatStatus.AVAILABLE:
                return 'bg-green-500 hover:bg-green-600';
            case EventSeatStatus.RESERVED:
                return 'bg-yellow-500 cursor-not-allowed';
            case EventSeatStatus.SOLD:
                return 'bg-red-500 cursor-not-allowed';
            default:
                return 'bg-gray-400';
        }
    };

    if (loading) {
        return <div>Loading seat map...</div>;
    }

    // This is a simplified grid layout. A real implementation would use the seat's row/col data.
    return (
        <div className="grid grid-cols-10 gap-2">
            {seats.map(seat => (
                <div 
                    key={seat.id}
                    className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-bold cursor-pointer ${getSeatColor(seat)}`}
                    onClick={() => seat.status === EventSeatStatus.AVAILABLE && onSeatSelect(seat)}
                >
                    {/* Assuming seat has a number, otherwise use part of ID */}
                    {seat.seat.seatNumber}
                </div>
            ))}
        </div>
    );
};

export default SeatMap;