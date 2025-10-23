'use client';

import { useRouter } from 'next/navigation';
import { createEvent } from '@/services/eventService';
import { CreateEventRequest } from '@/types/event';
import EventForm from '@/components/forms/EventForm';
import { ArrowLeft } from 'lucide-react';

const NewEventPage = () => {
    const router = useRouter();

    const handleSubmit = async (data: CreateEventRequest) => {
        try {
            const payload = {
                ...data,
                eventStart: new Date(data.eventStart).toISOString(),
                eventEnd: new Date(data.eventEnd).toISOString(),
            };
            await createEvent(payload);
            router.push('/admin/events');
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event. Check console for details.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 ml-4">Create a New Event</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-8">
                        <EventForm onSubmit={handleSubmit} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewEventPage;