import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { CreateEventRequest } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { PlusCircle, Trash2 } from 'lucide-react';

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
    const { register, handleSubmit, control, formState: { errors } } = useForm<CreateEventRequest>({
        defaultValues: initialData || {
            ticketTiers: [{ tierCode: 'GENERAL', tierName: 'General Admission', totalQuantity: 100, price: 50 }],
            imageUrls: [],
            artistIds: [],
            sponsorIds: [],
            organizerIds: [],
        }
    });

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
                        <Label htmlFor="eventName" className="text-blue-600 font-semibold">Event Name</Label>
                        <Input id="eventName" {...register('eventName', { required: 'Event name is required' })} placeholder="e.g., Summer Music Festival" />
                        {errors.eventName && <p className="text-sm text-red-600 mt-1">{errors.eventName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventCode"  className="text-blue-600 font-semibold">Event Code</Label>
                        <Input id="eventCode" {...register('eventCode', { required: 'A unique code is required' })} placeholder="e.g., SMF2024" />
                        {errors.eventCode && <p className="text-sm text-red-600 mt-1">{errors.eventCode.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="typeCode" className="text-blue-600 font-semibold">Type Code</Label>
                        <Input id="typeCode" {...register('typeCode', { required: 'Type code is required' })} placeholder="e.g., MUSIC" />
                        {errors.typeCode && <p className="text-sm text-red-600 mt-1">{errors.typeCode.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="typeName" className="text-blue-600 font-semibold">Type Name</Label>
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
                        <Label htmlFor="eventStart" className="text-blue-600 font-semibold">Start Time</Label>
                        <Input id="eventStart" type="datetime-local" {...register('eventStart', { required: 'Start time is required' })} />
                        {errors.eventStart && <p className="text-sm text-red-600 mt-1">{errors.eventStart.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventEnd" className="text-blue-600 font-semibold">End Time</Label>
                        <Input id="eventEnd" type="datetime-local" {...register('eventEnd', { required: 'End time is required' })} />
                        {errors.eventEnd && <p className="text-sm text-red-600 mt-1">{errors.eventEnd.message}</p>}
                    </div>
                </div>
            </Section>

            <Section
                title="Venue & Seating"
                description="Where will the event be held and what is the layout?"
            >
                <div>
                    <Label htmlFor="venueId" className="text-blue-600 font-semibold">Venue ID</Label>
                    <Input id="venueId" {...register('venueId', { required: 'Venue ID is required' })} placeholder="Enter the Venue UUID" />
                    {errors.venueId && <p className="text-sm text-red-600 mt-1">{errors.venueId.message}</p>}
                </div>
                <div>
                    <Label htmlFor="seatLayoutId"  className="text-blue-600 font-semibold">Seat Layout ID</Label>
                    <Input id="seatLayoutId" {...register('seatLayoutId')} placeholder="(Optional) Enter the Seat Layout UUID" />
                </div>
            </Section>

            <Section
                title="Event Staff"
                description="Assign staff members to manage the event."
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="eventManager" className="text-blue-600 font-semibold">Event Manager ID</Label>
                        <Input id="eventManager" {...register('eventManager', { required: 'Manager ID is required' })} placeholder="Enter Manager UUID" />
                        {errors.eventManager && <p className="text-sm text-red-600 mt-1">{errors.eventManager.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventOperator1"  className="text-blue-600 font-semibold">Operator 1 ID</Label>
                        <Input id="eventOperator1" {...register('eventOperator1', { required: 'Operator ID is required' })} placeholder="Enter Operator UUID" />
                        {errors.eventOperator1 && <p className="text-sm text-red-600 mt-1">{errors.eventOperator1.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="eventOperator2" className="text-blue-600 font-semibold">Operator 2 ID</Label>
                        <Input id="eventOperator2" {...register('eventOperator2')} placeholder="(Optional) Enter Operator UUID" />
                    </div>
                    <div>
                        <Label htmlFor="eventChecker1" className="text-blue-600 font-semibold">Checker 1 ID</Label>
                        <Input id="eventChecker1" {...register('eventChecker1', { required: 'Checker ID is required' })} placeholder="Enter Checker UUID" />
                        {errors.eventChecker1 && <p className="text-sm text-red-600 mt-1">{errors.eventChecker1.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="eventChecker2"  className="text-blue-600 font-semibold">Checker 2 ID</Label>
                        <Input id="eventChecker2" {...register('eventChecker2')} placeholder="(Optional) Enter Checker UUID" />
                    </div>
                </div>
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
                                    <Label htmlFor={`tierCode-${index}`} className="text-blue-600 font-semibold">Tier Code</Label>
                                    <Input id={`tierCode-${index}`} {...register(`ticketTiers.${index}.tierCode`, { required: 'Code is required' })} placeholder="VIP" />
                                </div>
                                <div>
                                    <Label htmlFor={`tierName-${index}`} className="text-blue-600 font-semibold">Tier Name</Label>
                                    <Input id={`tierName-${index}`} {...register(`ticketTiers.${index}.tierName`, { required: 'Name is required' })} placeholder="VIP Seating" />
                                </div>
                                <div>
                                    <Label htmlFor={`totalQuantity-${index}`} className="text-blue-600 font-semibold">Quantity</Label>
                                    <Input id={`totalQuantity-${index}`} type="number" {...register(`ticketTiers.${index}.totalQuantity`, { required: 'Quantity is required', valueAsNumber: true })} placeholder="100" />
                                </div>
                                <div>
                                    <Label htmlFor={`price-${index}`} className="text-blue-600 font-semibold">Price ($)</Label>
                                    <Input id={`price-${index}`} type="number" step="0.01" {...register(`ticketTiers.${index}.price`, { required: 'Price is required', valueAsNumber: true })} placeholder="150.00" />
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:bg-red-100">
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
                    <Label htmlFor="imageUrls" className="text-blue-600 font-semibold">Image URLs</Label>
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
                        <Label htmlFor="artistIds" className="text-blue-600 font-semibold">Artist IDs</Label>
                        <Input id="artistIds" {...register('artistIds', { setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v })} placeholder="Comma-separated UUIDs" />
                    </div>
                    <div>
                        <Label htmlFor="sponsorIds" className="text-blue-600 font-semibold">Sponsor IDs</Label>
                        <Input id="sponsorIds" {...register('sponsorIds', { setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v })} placeholder="Comma-separated UUIDs" />
                    </div>
                    <div>
                        <Label htmlFor="organizerIds" className="text-blue-600 font-semibold">Organizer IDs</Label>
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