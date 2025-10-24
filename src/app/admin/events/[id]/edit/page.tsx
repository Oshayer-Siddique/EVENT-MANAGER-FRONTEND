'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent, updateEvent } from '@/services/eventService';
import { Event, CreateEventRequest, UpdateEventRequest } from '@/types/event';
import EventForm from '@/components/forms/EventForm';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const EditEventPage = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchEvent = async () => {
                setLoading(true);
                try {
                    const eventData = await getEvent(id as string);
                    setEvent(eventData);
                } catch (err) {
                    console.error('Failed to fetch event:', err);
                    setError('Failed to load event data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchEvent();
        }
    }, [id]);

    const handleSubmit = async (data: CreateEventRequest) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: UpdateEventRequest = {
                ...data,
                eventStart: new Date(data.eventStart).toISOString(),
                eventEnd: new Date(data.eventEnd).toISOString(),
            };
            await updateEvent(id as string, payload);
            router.push('/admin/events');
        } catch (error) {
            console.error('Failed to update event:', error);
            setError('Failed to update event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatInitialData = (eventData: Event): Partial<CreateEventRequest> => {
        return {
            ...eventData,
            eventStart: eventData.eventStart ? new Date(eventData.eventStart).toISOString().slice(0, 16) : '',
            eventEnd: eventData.eventEnd ? new Date(eventData.eventEnd).toISOString().slice(0, 16) : '',
            ticketTiers: eventData.ticketTiers.map(tier => ({
                tierCode: tier.tierCode,
                tierName: tier.tierName,
                totalQuantity: tier.totalQuantity,
                price: tier.price,
            })),
        };
    };

    if (loading) {
        return (
            <div className="p-8">
                <Skeleton className="h-10 w-1/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto">
                <header className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Events
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">Edit Event</h1>
                        <p className="mt-1 text-lg text-slate-500">
                            Update the details for &quot;{event?.eventName}&quot;.
                        </p>
                    </div>
                </header>

                <main className="bg-white shadow-lg rounded-xl border border-slate-200">
                    {event && (
                        <EventForm
                            onSubmit={handleSubmit}
                            initialData={formatInitialData(event)}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </main>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
};

export default EditEventPage;