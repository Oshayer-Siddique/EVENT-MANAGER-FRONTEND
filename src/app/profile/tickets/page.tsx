'use client';
import { useState, useEffect } from 'react';
import { listTicketsByBuyer } from '../../../services/ticketService';
import { TicketResponse } from '../../../types/ticket';

// Mock current user ID. In a real app, you'd get this from an auth context.
const MOCK_USER_ID = 'c2a7b7a0-3b7e-4b0e-8d5e-2e6a7b4a2b1a'; // Replace with a valid UUID from your DB

const UserTicketsPage = () => {
    const [tickets, setTickets] = useState<TicketResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // In a real app, you would get the buyerId from your authentication context
                const userTickets = await listTicketsByBuyer(MOCK_USER_ID);
                setTickets(userTickets);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            }
            setLoading(false);
        };

        fetchTickets();
    }, []);

    if (loading) {
        return <div>Loading your tickets...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">My Tickets</h1>
            {tickets.length === 0 ? (
                <p>You have not purchased any tickets yet.</p>
            ) : (
                <div className="space-y-6">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="p-6 border rounded-lg shadow-lg bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold">Event ID: {ticket.eventId}</h2> {/* Replace with event name later */}
                                    <p className="text-gray-600">Seat: {ticket.seatLabel} ({ticket.tierCode})</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${ticket.status === 'ISSUED' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p><strong>Holder:</strong> {ticket.holderName}</p>
                                <p><strong>Issued on:</strong> {new Date(ticket.issuedAt!).toLocaleString()}</p>
                                <p className="mt-2 font-mono bg-gray-100 p-2 rounded">QR: {ticket.qrCode}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserTicketsPage;