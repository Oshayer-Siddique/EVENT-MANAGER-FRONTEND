'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVenues, deleteVenue } from "@/services/venueService";
import { Venue } from "@/types/venue";
import { PlusCircle, Edit, Trash2, Eye, Search, Mail, Phone } from "lucide-react";

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
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Venue Management</h1>
        <button
          onClick={() => router.push("/admin/venue/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <PlusCircle className="mr-2" />
          Add Venue
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search venues by name, address, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-gray-800  "
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Address</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Total Events</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Live</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Upcoming</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVenues.map((venue) => (
              <tr key={venue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{venue.venueName}</div>
                  <div className="text-xs text-gray-500">{venue.typeName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{venue.address}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-800 flex items-center">
                    <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0"/> {venue.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0"/> {venue.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center font-medium">{venue.maxCapacity || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.totalEvents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.liveEvents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{venue.eventsUpcoming}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                  <button onClick={() => router.push(`/admin/venue/${venue.id}`)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition" title="View"><Eye size={18} /></button>
                  <button onClick={() => router.push(`/admin/venue/${venue.id}/edit`)} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(venue.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
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