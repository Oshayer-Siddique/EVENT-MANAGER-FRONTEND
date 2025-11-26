"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Venue } from "@/types/venue";

interface VenueFormProps {
  onSubmit: (data: Omit<Venue, "id">) => Promise<void>;
  initialData?: Venue | null;
}

const venueTypes = [
  { name: "Theater", code: "100" },
  { name: "Banquet", code: "110" },
  { name: "Free style", code: "120" },
];

const InputField = ({ label, name, value, onChange, required = false, placeholder = '', type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
        />
    </div>
);

const TextareaField = ({ label, name, value, onChange, required = false, placeholder = '', rows = 4 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
        />
    </div>
);

const extractCoordinates = (url: string): { latitude: number; longitude: number } | null => {
  if (!url) {
    return null;
  }
  const decoded = decodeURIComponent(url.trim());
  const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[2]),
    };
  }
  const queryMatch = decoded.match(/q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
    };
  }
  return null;
};

const VenueForm: React.FC<VenueFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    venueName: "",
    venueCode: "",
    address: "",
    email: "",
    phone: "",
    typeCode: venueTypes[0].code,
    typeName: venueTypes[0].name,
    maxCapacity: "",
    mapAddress: "",
    socialMediaLink: "",
    websiteLink: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        venueName: initialData.venueName || "",
        venueCode: initialData.venueCode || "",
        address: initialData.address || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        typeCode: initialData.typeCode || venueTypes[0].code,
        typeName: initialData.typeName || venueTypes[0].name,
        maxCapacity: initialData.maxCapacity || "",
        mapAddress: initialData.mapAddress || "",
        socialMediaLink: initialData.socialMediaLink || "",
        websiteLink: initialData.websiteLink || "",
        latitude: initialData.latitude ?? null,
        longitude: initialData.longitude ?? null,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'mapAddress') {
      const coords = extractCoordinates(value);
      setFormData(prev => ({
        ...prev,
        mapAddress: value,
        latitude: coords ? coords.latitude : null,
        longitude: coords ? coords.longitude : null,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTypeName = e.target.value;
    const selectedType = venueTypes.find(t => t.name === selectedTypeName);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        typeName: selectedType.name,
        typeCode: selectedType.code,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData = {
      ...formData,
      totalEvents: initialData ? (initialData.totalEvents || 0) : 0,
      liveEvents: initialData ? (initialData.liveEvents || 0) : 0,
      eventsUpcoming: initialData ? (initialData.eventsUpcoming || 0) : 0,
      latitude: formData.latitude,
      longitude: formData.longitude,
    } satisfies Omit<Venue, "id">;
    await onSubmit(preparedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        {/* Left Column */}
        <div className="space-y-6">
            <InputField label="Venue Name" name="venueName" value={formData.venueName} onChange={handleChange} required placeholder="Enter venue name" />
            <InputField label="Venue Code" name="venueCode" value={formData.venueCode} onChange={handleChange} required placeholder="e.g., VEN-101" />
            <div>
                <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">Venue Type</label>
                <select
                    name="typeName"
                    id="typeName"
                    value={formData.typeName}
                    onChange={handleTypeChange}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                    {venueTypes.map(type => <option key={type.code} value={type.name}>{type.name}</option>)}
                </select>
            </div>
            <InputField label="Email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter contact email" type="email" />
            <InputField label="Mobile No" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Enter mobile number" />
            <TextareaField label="Venue Address" name="address" value={formData.address} onChange={handleChange} required placeholder="Enter full address" />
            <InputField label="Max Capacity (Person)" name="maxCapacity" value={formData.maxCapacity || ''} onChange={handleChange} placeholder="Enter max capacity" type="number" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            <InputField label="Google Maps Link" name="mapAddress" value={formData.mapAddress || ''} onChange={handleChange} placeholder="Enter google maps link" />
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {formData.latitude != null && formData.longitude != null ? (
                <p className="font-medium text-slate-700">
                  Parsed coordinates: <span className="text-slate-900">{formData.latitude.toFixed(6)}</span>,{' '}
                  <span className="text-slate-900">{formData.longitude.toFixed(6)}</span>
                </p>
              ) : (
                <p>Paste a Google Maps link that contains coordinates (e.g., @lat,long) to capture latitude/longitude automatically.</p>
              )}
            </div>
            <InputField label="Website Link" name="websiteLink" value={formData.websiteLink || ''} onChange={handleChange} placeholder="Enter website link" />
            <InputField label="Social Media Link" name="socialMediaLink" value={formData.socialMediaLink || ''} onChange={handleChange} placeholder="Enter a social media link" />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Event stats</p>
              <p>Past events: {initialData?.totalEvents ?? 0}</p>
              <p>Live events: {initialData?.liveEvents ?? 0}</p>
              <p>Upcoming events: {initialData?.eventsUpcoming ?? 0}</p>
              <p className="text-xs text-slate-500">These fields auto-update based on activity and are not edited here.</p>
            </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <div className="flex justify-end">
            <button type="button" onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg mr-4">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md">
              {initialData ? "Update Venue" : "Save"}
            </button>
        </div>
      </div>
    </form>
  );
};

export default VenueForm;
