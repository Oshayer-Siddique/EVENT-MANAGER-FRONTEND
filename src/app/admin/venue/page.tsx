'use client';
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getVenues, deleteVenue } from "@/services/venueService";
import { Venue } from "@/types/venue";
import { PlusCircle, Edit, Trash2, Eye, Search, Mail, Phone, Building2, Users, Sparkles, MapPin, User } from "lucide-react";

const CAPACITY_FORMATTER = new Intl.NumberFormat('en-US');
const formatCapacity = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return null;
  }
  return CAPACITY_FORMATTER.format(numeric);
};

const VenuePage = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const data = await getVenues();
        setVenues(data);
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      }
    };
    fetchVenues();
  }, []);

  const stats = useMemo(() => {
    const total = venues.length;
    const totalCapacity = venues.reduce((sum, venue) => sum + (Number(venue.maxCapacity) || 0), 0);
    const avgCapacity = total ? Math.round(totalCapacity / total) : 0;
    const withUpcoming = venues.filter((venue) => (venue.eventsUpcoming ?? 0) > 0).length;

    return [
      {
        label: "Active Venues",
        value: total,
        icon: Building2,
        description: "Spaces ready for your next experience.",
      },
      {
        label: "Avg Capacity",
        value: avgCapacity,
        icon: Users,
        description: "Average seated capacity across venues.",
      },
      {
        label: "Hosting Soon",
        value: withUpcoming,
        icon: Sparkles,
        description: "Venues with upcoming events queued.",
      },
    ];
  }, [venues]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        await deleteVenue(id);
        setVenues(venues.filter((venue) => venue.id !== id));
      } catch (error) {
        console.error("Failed to delete venue:", error);
      }
    }
  };

  const filteredVenues = venues.filter(
    (venue) =>
      venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.typeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Space Directory</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Venue Management</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Monitor your venue inventory, highlight capacity, and ensure every location is event-ready with a single glance.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/venue/new")}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5F7F] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            <PlusCircle className="h-4 w-4" /> Add Venue
          </button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, description }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
                <Icon className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-white/70">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search venues by name, address, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredVenues.length}</span> of {" "}
          <span className="font-semibold text-slate-700">{venues.length}</span> venues
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Address</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Past Events</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Live</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Upcoming</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVenues.map((venue) => {
              const formattedCapacity = formatCapacity(venue.maxCapacity);
              return (
              <tr key={venue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{venue.venueName}</div>
                  <div className="text-xs text-gray-500">{venue.typeName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#2F5F7F]" />
                    <span className="line-clamp-2 max-w-xs">{venue.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-800 flex items-center">
                    <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0"/> {venue.email || '—'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0"/> {venue.phone || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center font-medium">
                  {formattedCapacity ? (
                    <span className="inline-flex items-center justify-center gap-1 text-slate-700">
                      {formattedCapacity}
                      <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    </span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.totalEvents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.liveEvents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.eventsUpcoming}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                  <button onClick={() => router.push(`/admin/venue/${venue.id}`)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition" title="View"><Eye size={18} /></button>
                  <button onClick={() => router.push(`/admin/venue/${venue.id}/edit`)} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(venue.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        {filteredVenues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No venues found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuePage;
