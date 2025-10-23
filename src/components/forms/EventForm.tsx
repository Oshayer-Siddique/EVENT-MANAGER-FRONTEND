import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { CreateEventRequest } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getVenues, getVenueLayouts } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { Venue } from '@/types/venue';
import { Layout } from '@/types/layout';
import { User } from '@/types/user';

interface EventFormProps {
    onSubmit: (data: CreateEventRequest) => void;
    initialData?: Partial<CreateEventRequest>;
    isSubmitting?: boolean;
}

const Section = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-200 pt-8">
        <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="md:col-span-2 space-y-6">
            {children}
        </div>
    </div>
);

const EventForm = ({ onSubmit, initialData, isSubmitting }: EventFormProps) => {
    const { register, handleSubmit, control, formState: { errors }, watch } = useForm<CreateEventRequest>({
        defaultValues: initialData || {
            ticketTiers: [{ tierCode: 'GENERAL', tierName: 'General Admission', totalQuantity: 100, price: 50 }],
            imageUrls: [],
            artistIds: [],
            sponsorIds: [],
            organizerIds: [],
        }
    });

    const [venues, setVenues] = useState<Venue[]>([]);
    const [seatLayouts, setSeatLayouts] = useState<Layout[]>([]);
    const [eventManagers, setEventManagers] = useState<User[]>([]);
    const [operators, setOperators] = useState<User[]>([]);
    const [checkers, setCheckers] = useState<User[]>([]);

    const selectedVenueId = watch('venueId');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [venuesData, eventManagersData, operatorsData, checkersData] = await Promise.all([
                    getVenues(),
                    getEventManagers(),
                    getOperators(),
                    getEventCheckers(),
                ]);
                setVenues(venuesData);
                setEventManagers(eventManagersData);
                setOperators(operatorsData);
                setCheckers(checkersData);
            } catch (error) {
                console.error('Failed to fetch form data:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedVenueId) {
            const fetchLayouts = async () => {
                try {
                    const layoutsData = await getVenueLayouts(selectedVenueId);
                    setSeatLayouts(layoutsData);
                } catch (error) {
                    console.error('Failed to fetch seat layouts:', error);
                }
            };
            fetchLayouts();
        } else {
            setSeatLayouts([]);
        }
    }, [selectedVenueId]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "ticketTiers"
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <Section
                title="Basic Information"
                description="Provide the essential details for your event."
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="eventName">Event Name</Label>
                        <Input id="eventName" {...register('eventName', { required: 'Event name is required' })} placeholder="e.g., Summer Music Festival" />
                        {errors.eventName && <p className="text-sm text-red-600 mt-1">{errors.eventName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventCode">Event Code</Label>
                        <Input id="eventCode" {...register('eventCode', { required: 'A unique code is required' })} placeholder="e.g., SMF2024" />
                        {errors.eventCode && <p className="text-sm text-red-600 mt-1">{errors.eventCode.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="typeCode">Type Code</Label>
                        <Input id="typeCode" {...register('typeCode', { required: 'Type code is required' })} placeholder="e.g., MUSIC" />
                        {errors.typeCode && <p className="text-sm text-red-600 mt-1">{errors.typeCode.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="typeName">Type Name</Label>
                        <Input id="typeName" {...register('typeName', { required: 'Type name is required' })} placeholder="e.g., Music Concert" />
                        {errors.typeName && <p className="text-sm text-red-600 mt-1">{errors.typeName.message}</p>}
                    </div>
                </div>
            </Section>

            <Section
                title="Schedule"
                description="When will your event take place?"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="eventStart">Start Time</Label>
                        <Input id="eventStart" type="datetime-local" {...register('eventStart', { required: 'Start time is required' })} />
                        {errors.eventStart && <p className="text-sm text-red-600 mt-1">{errors.eventStart.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventEnd">End Time</Label>
                        <Input id="eventEnd" type="datetime-local" {...register('eventEnd', { required: 'End time is required' })} />
                        {errors.eventEnd && <p className="text-sm text-red-600 mt-1">{errors.eventEnd.message}</p>}
                    </div>
                </div>
            </Section>

            <Section
                title="Venue & Seating"
                description="Where will the event be held and what is the layout?"
            >
                <Controller
                    name="venueId"
                    control={control}
                    rules={{ required: 'Venue is required' }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a venue" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map(venue => (
                                    <SelectItem key={venue.id} value={venue.id}>{venue.venueName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <Controller
                    name="seatLayoutId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedVenueId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a seat layout" />
                            </SelectTrigger>
                            <SelectContent>
                                {seatLayouts.map(layout => (
                                    <SelectItem key={layout.id} value={layout.id}>{layout.layoutName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </Section>

            <Section
                title="Event Staff"
                description="Assign staff members to manage the event."
            >
                <Controller
                    name="eventManager"
                    control={control}
                    rules={{ required: 'Event Manager is required' }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an event manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventManagers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <Controller
                    name="eventOperator1"
                    control={control}
                    rules={{ required: 'Operator 1 is required' }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an operator" />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <Controller
                    name="eventOperator2"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an operator (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <Controller
                    name="eventChecker1"
                    control={control}
                    rules={{ required: 'Checker 1 is required' }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a checker" />
                            </SelectTrigger>
                            <SelectContent>
                                {checkers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <Controller
                    name="eventChecker2"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a checker (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {checkers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </Section>

            <Section
                title="Ticket Tiers"
                description="Define the types of tickets available for your event."
            >
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-grow">
                                <div>
                                    <Label htmlFor={`tierCode-${index}`}>Tier Code</Label>
                                    <Input id={`tierCode-${index}`} {...register(`ticketTiers.${index}.tierCode`, { required: 'Code is required' })} placeholder="VIP" />
                                </div>
                                <div>
                                    <Label htmlFor={`tierName-${index}`}>Tier Name</Label>
                                    <Input id={`tierName-${index}`} {...register(`ticketTiers.${index}.tierName`, { required: 'Name is required' })} placeholder="VIP Seating" />
                                </div>
                                <div>
                                    <Label htmlFor={`totalQuantity-${index}`}>Quantity</Label>
                                    <Input id={`totalQuantity-${index}`} type="number" {...register(`ticketTiers.${index}.totalQuantity`, { required: 'Quantity is required', valueAsNumber: true })} placeholder="100" />
                                </div>
                                <div>
                                    <Label htmlFor={`price-${index}`}>Price ($)</Label>
                                    <Input id={`price-${index}`} type="number" step="0.01" {...register(`ticketTiers.${index}.price`, { required: 'Price is required', valueAsNumber: true })} placeholder="150.00" />
                                </div>
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} className="text-red-500 hover:bg-red-100">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    ))}
                     {fields.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No ticket tiers added yet.</p>}
                    <Button type="button" variant="outline" onClick={() => append({ tierCode: '', tierName: '', totalQuantity: 0, price: 0 })} className="mt-2 flex items-center">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Ticket Tier
                    </Button>
                </div>
            </Section>

            <Section
                title="Media & Associations"
                description="Add images and link artists, sponsors, or organizers."
            >
                <div>
                    <Label htmlFor="imageUrls">Image URLs</Label>
                    <Textarea
                        id="imageUrls"
                        {...register('imageUrls', { setValueAs: (v) => typeof v === 'string' ? v.split('\n').map(s => s.trim()).filter(Boolean) : v })}
                        placeholder="Enter one image URL per line"
                        rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Enter each image URL on a new line.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <Label htmlFor="artistIds">Artist IDs</Label>
                        <Input id="artistIds" {...register('artistIds', { setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v })} placeholder="Comma-separated UUIDs" />
                    </div>
                    <div>
                        <Label htmlFor="sponsorIds">Sponsor IDs</Label>
                        <Input id="sponsorIds" {...register('sponsorIds', { setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v })} placeholder="Comma-separated UUIDs" />
                    </div>
                    <div>
                        <Label htmlFor="organizerIds">Organizer IDs</Label>
                        <Input id="organizerIds" {...register('organizerIds', { setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v })} placeholder="Comma-separated UUIDs" />
                    </div>
                </div>
            </Section>

            <div className="flex justify-end pt-8 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={() => { /* handle reset */ }} className="mr-4">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
            </div>
        </form>
    );
};

export default EventForm;