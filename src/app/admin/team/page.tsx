"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { getEventManagers } from "@/services/userService";
import { Search, Plus, X } from "lucide-react";

const mockEvents = [
  { id: 1, title: "Tech Conference 2025" },
  { id: 2, title: "Indie Music Festival" },
  { id: 3, title: "Local Charity Gala" },
  { id: 4, title: "Startup Pitch Night" },
];

export default function TeamPage() {
  const [isAssignEventsModalOpen, setAssignEventsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const handleOpenAssignModal = (member: any) => {
    setSelectedMember(member);
    setAssignEventsModalOpen(true);
  };

  return (
    <>
      <TeamView onOpenAssignModal={handleOpenAssignModal} />
      {isAssignEventsModalOpen && selectedMember && <AssignEventsModal member={selectedMember} events={mockEvents} onClose={() => setAssignEventsModalOpen(false)} />}
    </>
  );
}

const TeamView = ({ onOpenAssignModal }: { onOpenAssignModal: (member: any) => void }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [displayMembers, setDisplayMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getEventManagers();
        setMembers(data);
        setDisplayMembers(data);
      } catch (err: any) {
        setError("Failed to fetch team members.");
      }
      setIsLoading(false);
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    let processedMembers = [...members];

    if (searchTerm) {
      processedMembers = processedMembers.filter(member =>
        ((member as any).name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((member as any).email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const [sortField, sortOrder] = sortBy.split('-');
    processedMembers.sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      if (fieldA < fieldB) return -1;
      if (fieldA > fieldB) return 1;
      return 0;
    });

    if (sortOrder === 'desc') {
      processedMembers.reverse();
    }

    setDisplayMembers(processedMembers);
  }, [searchTerm, sortBy, members]);

  if (isLoading) return <p>Loading team members...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <TeamViewHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <TeamMembersTable members={displayMembers} onOpenAssignModal={onOpenAssignModal} />
    </div>
  );
};

const TeamViewHeader = ({ searchTerm, setSearchTerm, sortBy, setSortBy }: any) => (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-blue-900">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 sm:mt-0">
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 border border-black-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-blue-900"
                >
                    <option value="name-asc">Sort by Name (A-Z)</option>
                    <option value="name-desc">Sort by Name (Z-A)</option>
                    <option value="role-asc">Sort by Role</option>
                    <option value="status-asc">Sort by Status</option>
                </select>
            </div>
        </div>
        <div className="mt-4 sm:mt-0">
            <Link href="/admin/team/new" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Member
            </Link>
        </div>
    </div>
);

const TeamMembersTable = ({ members, onOpenAssignModal }: { members: any[], onOpenAssignModal: (member: any) => void }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Events</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {members.map(member => (
                    <tr key={(member as any).id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                            <img className="h-10 w-10 rounded-full object-cover" src={(member as any).imageUrl || `https://ui-avatars.com/api/?name=${((member as any).name || (member as any).username).replace(' ', '+')}&background=random`} alt="" />
                            <div>
                                <div className="font-medium text-gray-900">{((member as any).name || (member as any).username)}</div>
                                <div className="text-sm text-gray-500">{(member as any).email}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(member as any).role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (member as any).status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {(member as any).status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{((member as any).assignedEventIds || []).length} Events</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => onOpenAssignModal(member)} className="text-indigo-600 hover:text-indigo-900 font-medium">Assign Events</button>
                            <button className="text-red-600 hover:text-red-900 font-medium">Remove</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const AssignEventsModal = ({ member, events, onClose }: { member: any, events: any[], onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Assign Events to {member.name || member.username}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <form className="space-y-4">
                    <p className="text-sm text-gray-600">Select the events this member should be assigned to.</p>
                    <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                        {events.map(event => (
                            <label key={event.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                                <input type="checkbox" defaultChecked={(member.assignedEventIds || []).includes(event.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                <span className="text-gray-700">{event.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="pt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Assignments</button>
                    </div>
                </form>
            </div>
        </div>
    );
};