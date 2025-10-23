'use client'
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { CreateEventRequest } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getVenues, getVenueLayouts } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { Venue } from '@/types/venue';
import { Layout } from '@/types/layout';
import { User } from '@/types/user';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getArtists } from '@/services/artistService';
import { getSponsors } from '@/services/sponsorService';
import { getBusinessOrganizations } from '@/services/businessOrganizationService';
import { Artist } from '@/types/artist';
import { Sponsor } from '@/types/sponsor';
import { BusinessOrganization } from '@/types/businessOrganization';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { ImageUploadField } from '@/components/forms/ImageUploadField';

interface EventFormProps {
    onSubmit: (data: CreateEventRequest) => void;
    initialData?: Partial<CreateEventRequest>;
    isSubmitting?: boolean;
}

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
    const [artists, setArtists] = useState<Artist[]>([]);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [organizers, setOrganizers] = useState<BusinessOrganization[]>([]);

    const selectedVenueId = watch('venueId');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [venuesData, eventManagersData, operatorsData, checkersData, artistsData, sponsorsData, organizersData] = await Promise.all([
                    getVenues(),
                    getEventManagers(),
                    getOperators(),
                    getEventCheckers(),
                    getArtists(),
                    getSponsors(),
                    getBusinessOrganizations(),
                ]);
                setVenues(venuesData);
                setEventManagers(eventManagersData);
                setOperators(operatorsData);
                setCheckers(checkersData);
                setArtists(artistsData);
                setSponsors(sponsorsData);
                setOrganizers(organizersData);
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
        <form onSubmit={handleSubmit(onSubmit)} className="w-full p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                            <CardDescription>Provide the core details of your event.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Event Name" id="eventName" register={register('eventName', { required: 'Event name is required' })} placeholder="e.g., Summer Music Festival" error={errors.eventName} />
                                <InputField label="Event Code" id="eventCode" register={register('eventCode', { required: 'A unique code is required' })} placeholder="e.g., SMF2024" error={errors.eventCode} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Type Code" id="typeCode" register={register('typeCode', { required: 'Type code is required' })} placeholder="e.g., MUSIC" error={errors.typeCode} />
                                <InputField label="Type Name" id="typeName" register={register('typeName', { required: 'Type name is required' })} placeholder="e.g., Music Concert" error={errors.typeName} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Start Time" id="eventStart" type="datetime-local" register={register('eventStart', { required: 'Start time is required' })} error={errors.eventStart} />
                                <InputField label="End Time" id="eventEnd" type="datetime-local" register={register('eventEnd', { required: 'End time is required' })} error={errors.eventEnd} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Venue & Layout</CardTitle>
                            <CardDescription>Select the venue and seating arrangement.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ComboboxField
                                control={control}
                                name="venueId"
                                label="Venue"
                                options={venues.map(v => ({ value: v.id, label: v.venueName }))}
                                rules={{ required: 'Venue is required' }}
                                error={errors.venueId}
                            />
                            <SelectField label="Seat Layout" id="seatLayoutId" control={control} disabled={!selectedVenueId} error={errors.seatLayoutId}>
                                {seatLayouts.map(layout => (
                                    <SelectItem key={layout.id} value={layout.id}>{layout.layoutName}</SelectItem>
                                ))}
                            </SelectField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ticketing</CardTitle>
                            <CardDescription>Define ticket tiers for your event.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-slate-50 rounded-lg border space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">Tier #{index + 1}</p>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:bg-red-100">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Tier Code" id={`ticketTiers.${index}.tierCode`} register={register(`ticketTiers.${index}.tierCode`, { required: 'Code is required' })} placeholder="VIP" error={errors.ticketTiers?.[index]?.tierCode} />
                                        <InputField label="Tier Name" id={`ticketTiers.${index}.tierName`} register={register(`ticketTiers.${index}.tierName`, { required: 'Name is required' })} placeholder="VIP Seating" error={errors.ticketTiers?.[index]?.tierName} />
                                        <InputField label="Quantity" id={`ticketTiers.${index}.totalQuantity`} type="number" register={register(`ticketTiers.${index}.totalQuantity`, { required: 'Quantity is required', valueAsNumber: true })} placeholder="100" error={errors.ticketTiers?.[index]?.totalQuantity} />
                                        <InputField label="Price" id={`ticketTiers.${index}.price`} type="number" register={register(`ticketTiers.${index}.price`, { required: 'Price is required', valueAsNumber: true })} placeholder="150.00" error={errors.ticketTiers?.[index]?.price} />
                                    </div>
                                </div>
                            ))}
                            {fields.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No ticket tiers added yet.</p>}
                            <Button type="button" variant="outline" onClick={() => append({ tierCode: '', tierName: '', totalQuantity: 0, price: 0 })} className="w-full flex items-center">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Ticket Tier
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team</CardTitle>
                            <CardDescription>Assign event staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ComboboxField
                                control={control}
                                name="eventManager"
                                label="Event Manager"
                                options={eventManagers.map(u => ({ value: u.id, label: u.username }))}
                                rules={{ required: 'Event Manager is required' }}
                                error={errors.eventManager}
                            />
                            <ComboboxField
                                control={control}
                                name="eventOperator1"
                                label="Operator 1"
                                options={operators.map(u => ({ value: u.id, label: u.username }))}
                                rules={{ required: 'Operator 1 is required' }}
                                error={errors.eventOperator1}
                            />
                            <ComboboxField
                                control={control}
                                name="eventOperator2"
                                label="Operator 2"
                                options={operators.map(u => ({ value: u.id, label: u.username }))}
                                error={errors.eventOperator2}
                            />
                            <ComboboxField
                                control={control}
                                name="eventChecker1"
                                label="Checker 1"
                                options={checkers.map(u => ({ value: u.id, label: u.username }))}
                                rules={{ required: 'Checker 1 is required' }}
                                error={errors.eventChecker1}
                            />
                            <ComboboxField
                                control={control}
                                name="eventChecker2"
                                label="Checker 2"
                                options={checkers.map(u => ({ value: u.id, label: u.username }))}
                                error={errors.eventChecker2}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Media & Promotion</CardTitle>
                            <CardDescription>Add promotional materials and associations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Controller
                                name="imageUrls"
                                control={control}
                                render={({ field }) => <ImageUploadField value={field.value} onChange={field.onChange} />}
                            />
                            <Controller
                                name="artistIds"
                                control={control}
                                render={({ field }) => (
                                    <MultiSelectCombobox
                                        options={artists.map(a => ({ value: a.id, label: a.name }))}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Artists"
                                    />
                                )}
                            />
                            <Controller
                                name="sponsorIds"
                                control={control}
                                render={({ field }) => (
                                    <MultiSelectCombobox
                                        options={sponsors.map(s => ({ value: s.id, label: s.name }))}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Sponsors"
                                    />
                                )}
                            />
                            <Controller
                                name="organizerIds"
                                control={control}
                                render={({ field }) => (
                                    <MultiSelectCombobox
                                        options={organizers.map(o => ({ value: o.id, label: o.name }))}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Organizers"
                                    />
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <CardFooter className="flex justify-end pt-8 mt-8 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => { /* handle reset */ }} className="mr-4">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
            </CardFooter>
        </form>
    );
};

const InputField = ({ id, label, register, error, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="font-medium text-slate-700">{label}</Label>
        <Input id={id} {...register} {...props} className="w-full" />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const SelectField = ({ id, label, control, rules, error, children, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="font-medium text-slate-700">{label}</Label>
        <Controller
            name={id}
            control={control}
            rules={rules}
            render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} {...props}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {children}
                    </SelectContent>
                </Select>
            )}
        />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const ComboboxField = ({ control, name, label, options, rules, error }: any) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-1">
            <Label className="font-medium text-slate-700">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {field.value
                                    ? options.find((option: any) => option.value === field.value)?.label
                                    : `Select a ${label.toLowerCase()}`}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                                <CommandList>
                                    <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                                    <CommandGroup>
                                        {options.map((option: any) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onSelect={(currentValue) => {
                                                    field.onChange(currentValue === field.value ? "" : currentValue)
                                                    setOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === option.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            />
            {error && <p className="text-sm text-red-600">{error.message}</p>}
        </div>
    );
};


const TextareaField = ({ id, label, register, error, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="font-medium text-slate-700">{label}</Label>
        <Textarea id={id} {...register} {...props} className="w-full" />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

export default EventForm;