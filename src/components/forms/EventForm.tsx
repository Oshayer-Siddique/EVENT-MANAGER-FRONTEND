'use client'
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { CreateEventRequest } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronsUpDown, PlusCircle, Trash2, Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChangeEvent, useEffect, useState } from 'react';
import { getVenues, getVenueLayouts } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { Venue } from '@/types/venue';
import { Layout } from '@/types/layout';
import { User } from '@/types/user';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getArtists } from '@/services/artistService';
import { getSponsors } from '@/services/sponsorService';
import { getBusinessOrganizations } from '@/services/businessOrganizationService';
import { Artist } from '@/types/artist';
import { Sponsor } from '@/types/sponsor';
import { BusinessOrganization } from '@/types/businessOrganization';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ModalCombobox } from '@/components/ui/modal-combobox';

interface EventFormProps {
    onSubmit: (data: CreateEventRequest) => void;
    initialData?: Partial<CreateEventRequest>;
    isSubmitting?: boolean;
}

const EventForm = ({ onSubmit, initialData, isSubmitting }: EventFormProps) => {
    const { register, handleSubmit, control, formState: { errors }, watch, getValues } = useForm<CreateEventRequest>({
        defaultValues: initialData || {
            ticketTiers: [{ tierCode: 'GENERAL', tierName: 'General Admission', totalQuantity: 100, price: 50 }],
            imageUrls: [],
            artistIds: [],
            sponsorIds: [],
            organizerIds: [],
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateEventRequest>>({});
    const [venues, setVenues] = useState<Venue[]>([]);
    const [seatLayouts, setSeatLayouts] = useState<Layout[]>([]);
    const [eventManagers, setEventManagers] = useState<User[]>([]);
    const [operators, setOperators] = useState<User[]>([]);
    const [checkers, setCheckers] = useState<User[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [organizers, setOrganizers] = useState<BusinessOrganization[]>([]);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const selectedVenueId = watch('venueId');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
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
            } finally {
                setIsLoading(false);
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

    const uploadEventImages = async (files: FileList): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'EVENT_MANAGEMENT');

            try {
                const response = await fetch('https://api.cloudinary.com/v1_1/dyqlighvo/image/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error?.message ?? 'Failed to upload image');
                }

                uploadedUrls.push(data.secure_url as string);
            } catch (error) {
                throw error;
            }
        }

        return uploadedUrls;
    };

    const { fields, append, remove } = useFieldArray({
        control,
        name: "ticketTiers"
    });

    const onFormSubmit = (data: CreateEventRequest) => {
        setFormData(data);
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        onSubmit(formData as CreateEventRequest);
        setIsModalOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit(onFormSubmit)} className="w-full p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-blue-600">Event Details</CardTitle>
                                <CardDescription className="text-blue-600">Provide the core details of your event.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Event Name" id="eventName"  labelClassName="text-blue-600" register={register('eventName', { required: 'Event name is required' })} placeholder="e.g., Summer Music Festival" error={errors.eventName} />
                                    <InputField label="Event Code" id="eventCode"  labelClassName="text-blue-600" register={register('eventCode', { required: 'A unique code is required' })} placeholder="e.g., SMF2024" error={errors.eventCode} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Type Code" id="typeCode" labelClassName="text-blue-600" register={register('typeCode', { required: 'Type code is required' })} placeholder="e.g., MUSIC" error={errors.typeCode} />
                                    <InputField label="Type Name" id="typeName" labelClassName="text-blue-600"register={register('typeName', { required: 'Type name is required' })} placeholder="e.g., Music Concert" error={errors.typeName} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Start Time" id="eventStart" type="datetime-local" labelClassName="text-blue-600" register={register('eventStart', { required: 'Start time is required' })} error={errors.eventStart} />
                                    <InputField label="End Time" id="eventEnd" type="datetime-local" labelClassName="text-blue-600"register={register('eventEnd', { required: 'End time is required' })} error={errors.eventEnd} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-blue-600">Venue & Layout</CardTitle>
                                <CardDescription className="text-blue-600">Select the venue and seating arrangement.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="venueId"
                                    control={control}
                                    rules={{ required: 'Venue is required' }}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={venues.map(v => ({ value: v.id, label: v.venueName }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Venue"
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="seatLayoutId"
                                    control={control}
                                    rules={{ required: 'Seat Layout is required' }}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={seatLayouts.map(layout => ({ value: layout.id, label: layout.layoutName }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Seat Layout"
                                            disabled={!selectedVenueId}
                                        />
                                    )}
                                />}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-blue-600">Ticketing</CardTitle>
                                <CardDescription className="text-blue-600">Define ticket tiers for your event.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 bg-muted rounded-lg border space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium text-blue-600">Tier #{index + 1}</p>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:bg-red-100">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputField label="Tier Code" labelClassName="text-blue-600" id={`ticketTiers.${index}.tierCode`} register={register(`ticketTiers.${index}.tierCode`, { required: 'Code is required' })} placeholder="VIP" error={errors.ticketTiers?.[index]?.tierCode} />
                                            <InputField label="Tier Name" labelClassName="text-blue-600" id={`ticketTiers.${index}.tierName`} register={register(`ticketTiers.${index}.tierName`, { required: 'Name is required' })} placeholder="VIP Seating" error={errors.ticketTiers?.[index]?.tierName} />
                                            <InputField label="Quantity" labelClassName="text-blue-600" id={`ticketTiers.${index}.totalQuantity`} type="number" register={register(`ticketTiers.${index}.totalQuantity`, { required: 'Quantity is required', valueAsNumber: true })} placeholder="100" error={errors.ticketTiers?.[index]?.totalQuantity} />
                                            <InputField label="Price" labelClassName="text-blue-600" id={`ticketTiers.${index}.price`} type="number" register={register(`ticketTiers.${index}.price`, { required: 'Price is required', valueAsNumber: true })} placeholder="150.00" error={errors.ticketTiers?.[index]?.price} />
                                        </div>
                                    </div>
                                ))}
                                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No ticket tiers added yet.</p>}
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
                                <CardTitle className="text-blue-600">Event StaffTeam</CardTitle>
                                <CardDescription className="text-blue-600">Assign event staff.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="eventManager"
                                    control={control}
                                    rules={{ required: 'Event Manager is required' }}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={eventManagers.map(u => ({ value: u.id, label: u.username }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Event Manager"
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="eventOperator1"
                                    control={control}
                                    rules={{ required: 'Operator 1 is required' }}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={operators.map(u => ({ value: u.id, label: u.username }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Operator 1"
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="eventOperator2"
                                    control={control}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={operators.map(u => ({ value: u.id, label: u.username }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Operator 2"
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="eventChecker1"
                                    control={control}
                                    rules={{ required: 'Checker 1 is required' }}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={checkers.map(u => ({ value: u.id, label: u.username }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Checker 1"
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="eventChecker2"
                                    control={control}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={checkers.map(u => ({ value: u.id, label: u.username }))}
                                            selected={field.value ? [field.value] : []}
                                            onChange={(selected) => field.onChange(selected[0])}
                                            placeholder="Select Checker 2"
                                        />
                                    )}
                                />}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className='text-blue-600'>Media & Promotion</CardTitle>
                                <CardDescription className='text-blue-600'>Add promotional materials and associations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Controller
                                    name="imageUrls"
                                    control={control}
                                    render={({ field }) => {
                                        const value = field.value ?? [];

                                        const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
                                            const files = event.target.files;
                                            if (!files?.length) return;

                                            setIsImageUploading(true);
                                            try {
                                                const urls = await uploadEventImages(files);
                                                field.onChange([...value, ...urls]);
                                            } catch (error) {
                                                console.error('Cloudinary upload error:', error);
                                            } finally {
                                                setIsImageUploading(false);
                                                event.target.value = '';
                                            }
                                        };

                                        const handleRemoveImage = (index: number) => {
                                            const next = value.filter((_, i) => i !== index);
                                            field.onChange(next);
                                        };

                                        return (
                                            <div>
                                                <Label htmlFor="eventImages" className="block text-sm font-medium text-gray-700">
                                                    Upload Event Images
                                                </Label>
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                    <div className="space-y-1 text-center">
                                                        {isImageUploading ? (
                                                            <p>Uploading...</p>
                                                        ) : (
                                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        )}
                                                        <div className="flex text-sm text-gray-600">
                                                            <label
                                                                htmlFor="eventImages"
                                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                            >
                                                                <span>Select files</span>
                                                                <input
                                                                    id="eventImages"
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    className="sr-only"
                                                                    onChange={handleFilesSelected}
                                                                />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                        {value.length > 0 && (
                                                            <p className="text-xs text-gray-500">
                                                                Uploaded {value.length} image{value.length > 1 ? 's' : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {value.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        {value.map((url: string, index: number) => (
                                                            <div key={`${url}-${index}`} className="relative h-32 w-full overflow-hidden rounded-lg border">
                                                                <img
                                                                    src={url}
                                                                    alt={`Event image ${index + 1}`}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(index)}
                                                                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-black"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="artistIds"
                                    control={control}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={artists.map(a => ({ value: a.id, label: a.name }))}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Artists"
                                            isMulti
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="sponsorIds"
                                    control={control}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={sponsors.map(s => ({ value: s.id, label: s.name }))}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Sponsors"
                                            isMulti
                                        />
                                    )}
                                />}
                                {isLoading ? <Skeleton className="h-10 w-full" /> : <Controller
                                    name="organizerIds"
                                    control={control}
                                    render={({ field }) => (
                                        <ModalCombobox
                                            options={organizers.map(o => ({ value: o.id, label: o.name }))}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Organizers"
                                            isMulti
                                        />
                                    )}
                                />}
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
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                eventData={formData}
            />
        </>
    );
};

const InputField = ({ id, label, register, error, labelClassName, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className={`font-medium ${labelClassName}`}>{label}</Label>
        <Input id={id} {...register} {...props} className="w-full" />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const SelectField = ({ id, label, control, rules, error, children, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="font-medium text-foreground">{label}</Label>
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

const TextareaField = ({ id, label, register, error, ...props }: any) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="font-medium text-foreground">{label}</Label>
        <Textarea id={id} {...register} {...props} className="w-full" />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

export default EventForm;
