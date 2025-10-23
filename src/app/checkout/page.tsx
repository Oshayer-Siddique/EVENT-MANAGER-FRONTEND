'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getHold, convertHold } from '../../services/holdService';
import { Hold, HoldConvertRequest } from '../../types/hold';

const CheckoutPage = () => {
    const searchParams = useSearchParams();
    const holdId = searchParams.get('holdId');
    const [hold, setHold] = useState<Hold | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (holdId) {
            const fetchHold = async () => {
                try {
                    const holdData = await getHold(holdId as string);
                    setHold(holdData);
                } catch (error) {
                    console.error('Failed to fetch hold:', error);
                }
                setLoading(false);
            };

            fetchHold();
        }
    }, [holdId]);

    const handleConfirmPurchase = async () => {
        if (!hold) return;

        try {
            // In a real app, you would get a paymentId from a payment gateway
            const paymentId = `mock-payment-${Date.now()}`;
            const convertRequest: HoldConvertRequest = {
                holdId: hold.id,
                paymentId: paymentId,
            };

            const convertedHold = await convertHold(convertRequest);
            console.log('Purchase complete:', convertedHold);
            
            // Redirect to a success page or user's tickets page
            window.location.href = '/profile/tickets';

        } catch (error) {
            console.error('Failed to confirm purchase:', error);
            alert('Could not complete purchase. Please try again.');
        }
    };

    if (loading) {
        return <div>Loading checkout...</div>;
    }

    if (!hold) {
        return <div>Hold not found or expired.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Confirm Your Purchase</h1>
            <div className="p-4 border rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Reservation Details</h2>
                <p className="mb-2"><strong>Hold expires at:</strong> {new Date(hold.expiresAt).toLocaleTimeString()}</p>
                <h3 className="text-xl font-semibold mt-4 mb-2">Selected Seats:</h3>
                <ul>
                    {hold.heldSeats.map(seat => (
                        <li key={seat.seatId}>{seat.seatLabel} ({seat.tierCode})</li>
                    ))}
                </ul>
                {/* Total price would ideally come from the hold object or be recalculated */}
                <div className="mt-4 pt-4 border-t">
                    <button 
                        onClick={handleConfirmPurchase}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700"
                    >
                        Confirm Purchase
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;