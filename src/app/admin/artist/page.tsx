"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, Search, Eye } from "lucide-react";
import { getArtists, deleteArtist } from "@/services/artistService";
import { Artist } from "@/types/artist";

export default function ArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await getArtists();
        setArtists(data);
      } catch (error) {
        console.error("Failed to fetch artists", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this artist?")) {
      try {
        await deleteArtist(id);
        setArtists(artists.filter((artist) => artist.id !== id));
      } catch (error) {
        console.error("Failed to delete artist", error);
      }
    }
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artist.email && artist.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Artist Management</h1>
        <Link href="/admin/artist/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            <PlusCircle className="mr-2" />
            Create Artist
          </button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-gray-800"
          />
        </div>
      </div>

      <div className="bg-white overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider"></th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredArtists.map((artist) => (
              <tr key={artist.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img className="h-10 w-10 rounded-full" src={artist.imageUrl || `https://ui-avatars.com/api/?name=${artist.name.replace(' ', '+')}&background=random&color=fff`} alt="" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{artist.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{artist.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{artist.mobile}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                  <Link href={`/admin/artist/${artist.id}`}>
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition" title="View"><Eye size={18} /></button>
                  </Link>
                  <Link href={`/admin/artist/${artist.id}/edit`}>
                    <button className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  </Link>
                  <button onClick={() => handleDelete(artist.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredArtists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No artists found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
