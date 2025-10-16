'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent, updateEvent } from '@/services/eventService';
import { getVenues, getVenueLayouts } from '@/services/venueService';
import { getEventManagers, getOperators, getEventCheckers } from '@/services/userService';
import { getArtists } from '@/services/artistService';
import { getSponsors } from '@/services/sponsorService';
import { getBusinessOrganizations } from '@/services/businessOrganizationService';
import { Event } from '@/types/event';
import { Venue } from '@/types/venue';
import { Layout } from '@/types/layout';
import { User } from '@/types/user';
import { Artist } from '@/types/artist';
import { Sponsor } from '@/types/sponsor';
import { BusinessOrganization } from '@/types/businessOrganization';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Checklist } from '@/components/ui/Checklist';

const inputClasses = "block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";

const eventTypes = {
    "Concert": "01",
    "Fair": "02",
    "Exhibition": "03",
    "Movie": "04",
    "Food Festival": "05",
    "Photography": "06",
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [venues, setVenues] = useState<Venue[]>([]);
  const [seatLayouts, setSeatLayouts] = useState<Layout[]>([]);
  const [eventManagers, setEventManagers] = useState<User[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [eventCheckers, setEventCheckers] = useState<User[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [organizers, setOrganizers] = useState<BusinessOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, venuesData, eventManagersData, operatorsData, eventCheckersData, artistsData, sponsorsData, organizersData] = await Promise.all([
          getEvent(id as string),
          getVenues(),
          getEventManagers(),
          getOperators(),
          getEventCheckers(),
          getArtists(),
          getSponsors(),
          getBusinessOrganizations(),
        ]);
        setFormData(eventData);
        setVenues(venuesData);
        setEventManagers(eventManagersData);
        setOperators(operatorsData);
        setEventCheckers(eventCheckersData);
        setArtists(artistsData);
        setSponsors(sponsorsData);
        setOrganizers(organizersData);
        if (eventData.venueId) {
          const layouts = await getVenueLayouts(eventData.venueId);
          setSeatLayouts(layouts);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Error: Could not load required data.");
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (formData.venueId) {
      const fetchLayouts = async () => {
        try {
          const layouts = await getVenueLayouts(formData.venueId!);
          setSeatLayouts(layouts);
        } catch (err) {
          console.error("Failed to fetch layouts:", err);
        }
      };
      fetchLayouts();
    }
  }, [formData.venueId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'typeName') {
        const typeCode = eventTypes[value as keyof typeof eventTypes] || '';
        setFormData(prev => ({ ...prev, typeName: value, typeCode }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleChecklistChange = (name: string, selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, [name]: selectedIds }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
        const dataToSend = {
            ...formData,
            eventStart: new Date(formData.eventStart!).toISOString(),
            eventEnd: new Date(formData.eventEnd!).toISOString(),
        };
      await updateEvent(id as string, dataToSend);
      router.push("/admin/events");
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 ml-2">Edit Event</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
              {/* Event Info */}
              <fieldset>
                <legend className="text-lg font-semibold leading-7 text-gray-900">Event Information</legend>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="eventName" className="block text-sm font-medium leading-6 text-gray-900">Event Name</label>
                    <input type="text" name="eventName" id="eventName" value={formData.eventName || ''} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="eventCode" className="block text-sm font-medium leading-6 text-gray-900">Event Code</label>
                    <input type="text" name="eventCode" id="eventCode" value={formData.eventCode || ''} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="typeName" className="block text-sm font-medium leading-6 text-gray-900">Type Name</label>
                    <select name="typeName" id="typeName" value={formData.typeName || ''} onChange={handleInputChange} className={inputClasses} required>
                        <option value="">Select a type</option>
                        {Object.keys(eventTypes).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="typeCode" className="block text-sm font-medium leading-6 text-gray-900">Type Code</label>
                    <input type="text" name="typeCode" id="typeCode" value={formData.typeCode || ''} onChange={handleInputChange} className={inputClasses} required readOnly />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="venueId" className="block text-sm font-medium leading-6 text-gray-900">Venue</label>
                    <select name="venueId" id="venueId" value={formData.venueId || ''} onChange={handleInputChange} className={inputClasses} required>
                      <option value="">Select a venue</option>
                      {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="seatLayoutId" className="block text-sm font-medium leading-6 text-gray-900">Seat Layout</label>
                    <select name="seatLayoutId" id="seatLayoutId" value={formData.seatLayoutId || ''} onChange={handleInputChange} className={inputClasses} disabled={!formData.venueId}>
                      <option value="">Select a layout</option>
                      {seatLayouts.map(l => <option key={l.id} value={l.id}>{l.layoutName}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="eventStart" className="block text-sm font-medium leading-6 text-gray-900">Start Time</label>
                    <input type="datetime-local" name="eventStart" id="eventStart" value={formData.eventStart ? new Date(formData.eventStart).toISOString().slice(0, 16) : ''} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="eventEnd" className="block text-sm font-medium leading-6 text-gray-900">End Time</label>
                    <input type="datetime-local" name="eventEnd" id="eventEnd" value={formData.eventEnd ? new Date(formData.eventEnd).toISOString().slice(0, 16) : ''} onChange={handleInputChange} className={inputClasses} required />
                  </div>
                </div>
              </fieldset>

              {/* Staffing */}
              <fieldset>
                <legend className="text-lg font-semibold leading-7 text-gray-900">Staffing</legend>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="eventManager" className="block text-sm font-medium leading-6 text-gray-900">Event Manager</label>
                    <select name="eventManager" id="eventManager" value={formData.eventManager || ''} onChange={handleInputChange} className={inputClasses} required>
                      <option value="">Select a manager</option>
                      {eventManagers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eventOperator1" className="block text-sm font-medium leading-6 text-gray-900">Operator 1</label>
                    <select name="eventOperator1" id="eventOperator1" value={formData.eventOperator1 || ''} onChange={handleInputChange} className={inputClasses} required>
                      <option value="">Select an operator</option>
                      {operators.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eventOperator2" className="block text-sm font-medium leading-6 text-gray-900">Operator 2 (Optional)</label>
                    <select name="eventOperator2" id="eventOperator2" value={formData.eventOperator2 || ''} onChange={handleInputChange} className={inputClasses}>
                      <option value="">Select an operator</option>
                      {operators.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eventChecker1" className="block text-sm font-medium leading-6 text-gray-900">Checker 1</label>
                    <select name="eventChecker1" id="eventChecker1" value={formData.eventChecker1 || ''} onChange={handleInputChange} className={inputClasses} required>
                      <option value="">Select a checker</option>
                      {eventCheckers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eventChecker2" className="block text-sm font-medium leading-6 text-gray-900">Checker 2 (Optional)</label>
                    <select name="eventChecker2" id="eventChecker2" value={formData.eventChecker2 || ''} onChange={handleInputChange} className={inputClasses}>
                      <option value="">Select a checker</option>
                      {eventCheckers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Ticketing */}
                <fieldset>
                    <legend className="text-lg font-semibold leading-7 text-gray-900">Ticketing</legend>
                    <table className="min-w-full mt-4">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Tier</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">No. of Tickets</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Price</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {['vip', 'plat', 'gold', 'silver'].map(tier => (
                                <tr key={tier}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{tier.toUpperCase()}</td>
                                    <td className="px-4 py-2">
                                        <input type="number" name={`${tier}Tickets`} id={`${tier}Tickets`} value={formData[`${tier}Tickets`] || ''} onChange={handleInputChange} className={inputClasses} />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="number" step="0.01" name={`${tier}TicketPrice`} id={`${tier}TicketPrice`} value={formData[`${tier}TicketPrice`] || ''} onChange={handleInputChange} className={inputClasses} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </fieldset>
            </div>

            {/* Right Column: Associations */}
            <div className="lg:col-span-1 bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <Checklist
                    title="Artists"
                    items={artists}
                    selectedIds={formData.artistIds || []}
                    onChange={(selectedIds) => handleChecklistChange('artistIds', selectedIds)}
                />
                <Checklist
                    title="Sponsors"
                    items={sponsors}
                    selectedIds={formData.sponsorIds || []}
                    onChange={(selectedIds) => handleChecklistChange('sponsorIds', selectedIds)}
                />
                <Checklist
                    title="Organizers"
                    items={organizers}
                    selectedIds={formData.organizerIds || []}
                    onChange={(selectedIds) => handleChecklistChange('organizerIds', selectedIds)}
                />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-x-6">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="button" variant="ghost" onClick={() => router.push("/admin/events")}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
              {loading ? "Saving..." : "Save Event"}
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
}