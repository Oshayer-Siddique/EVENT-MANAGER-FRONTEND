'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { getSponsors, deleteSponsor } from '@/services/sponsorService';
import { Sponsor } from '@/types/sponsor';

export default function SponsorPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const data = await getSponsors();
        setSponsors(data);
      } catch (error) {
        console.error('Failed to fetch sponsors', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
      try {
        await deleteSponsor(id);
        setSponsors(sponsors.filter((sponsor) => sponsor.id !== id));
      } catch (error) {
        console.error('Failed to delete sponsor', error);
      }
    }
  };

  const filteredSponsors = sponsors.filter(
    (sponsor) =>
      sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sponsor.email && sponsor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Sponsor Management</h1>
        <Link href="/admin/sponsors/new">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            <PlusCircle className="mr-2" />
            Create Sponsor
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
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-blue-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSponsors.map((sponsor) => (
              <tr key={sponsor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{sponsor.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sponsor.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sponsor.mobile}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                  <Link href={`/admin/sponsors/${sponsor.id}/edit`}>
                    <button className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  </Link>
                  <button onClick={() => handleDelete(sponsor.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition" title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSponsors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sponsors found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
