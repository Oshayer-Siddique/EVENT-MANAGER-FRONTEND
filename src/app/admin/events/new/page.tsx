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
                        <h1 className="text-4xl font-bold text-slate-800">Create a New Event</h1>
                        <p className="mt-1 text-lg text-slate-500">Fill out the form below to create a new event.</p>
                    </div>
                </header>

                <main className="bg-white shadow-lg rounded-xl border border-slate-200">
                    <EventForm onSubmit={handleSubmit} />
                </main>
            </div>
        </div>
    );
};

export default NewEventPage;