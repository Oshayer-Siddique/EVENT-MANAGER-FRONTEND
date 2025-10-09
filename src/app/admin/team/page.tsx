"use client";

import { useEffect, useState, Fragment } from "react";
import Link from 'next/link';
import { getEventManagers, getOperators } from "@/services/userService";
import { Search, Plus, X, MoreVertical, Edit, Trash2, Calendar, User as UserIcon, Users, Briefcase, Phone } from "lucide-react";
import { Menu, Transition } from '@headlessui/react';

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

  const handleCloseAssignModal = () => {
    setAssignEventsModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <TeamView onOpenAssignModal={handleOpenAssignModal} />
      {isAssignEventsModalOpen && selectedMember && 
        <AssignEventsModal 
          member={selectedMember} 
          events={mockEvents} 
          onClose={handleCloseAssignModal} 
        />
      }
    </div>
  );
}

const TeamView = ({ onOpenAssignModal }: { onOpenAssignModal: (member: any) => void }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fullName-asc');
  const [activeTab, setActiveTab] = useState('eventManagers');

  const filteredAndSortedMembers = members
    .filter(member =>
      (member.fullName || member.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const [field, order] = sortBy.split('-');
      const valA = a[field] || '';
      const valB = b[field] || '';
      const comparison = valA.localeCompare(valB, undefined, { numeric: true });
      return order === 'asc' ? comparison : -comparison;
    });

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = activeTab === 'eventManagers'
          ? await getEventManagers()
          : await getOperators();
        setMembers(data);
      } catch (err: any) {
        setError(`Failed to fetch ${activeTab === 'eventManagers' ? 'event managers' : 'operators'}.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Team Management</h1>
            <p className="mt-1 text-lg text-slate-500">Manage your event managers and operators.</p>
          </div>
          <Link href="/admin/team/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <Plus size={18} />
            <span>Add Member</span>
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <TeamViewHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            memberCount={filteredAndSortedMembers.length}
          />
          <TeamMembersTable members={filteredAndSortedMembers} onOpenAssignModal={onOpenAssignModal} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
};

const Tabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'eventManagers', name: 'Event Managers', icon: Briefcase },
    { id: 'operators', name: 'Operators', icon: Users },
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            } group inline-flex items-center py-4 px-1 border-b-2 font-bold text-sm transition-colors`}
          >
            <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const TeamViewHeader = ({ searchTerm, setSearchTerm, sortBy, setSortBy, memberCount }: any) => (
  <div className="p-4 border-b border-slate-200 bg-slate-50/50">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="relative w-full sm:max-w-xs">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 font-medium">{memberCount} Members</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-sm"
        >
          <option value="fullName-asc">Sort by Name (A-Z)</option>
          <option value="fullName-desc">Sort by Name (Z-A)</option>
          <option value="status-asc">Sort by Status</option>
        </select>
      </div>
    </div>
  </div>
);

const TeamMembersTable = ({ members, onOpenAssignModal, isLoading, error }: { members: any[], onOpenAssignModal: (member: any) => void, isLoading: boolean, error: string }) => {
  if (isLoading) {
    return <div className="text-center p-12 text-slate-500">Loading team members...</div>;
  }
  if (error) {
    return <div className="text-center p-12 text-red-500">{error}</div>;
  }
  if (members.length === 0) {
    return <div className="text-center p-12 text-slate-500">No members found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Events</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {members.map(member => (
            <tr key={member.username} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-4">
                <img className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100" src={member.imageUrl || `https://ui-avatars.com/api/?name=${(member.fullName || member.username).replace(' ', '+')}&background=random&color=fff`} alt="" />
                <div>
                  <div className="font-bold text-slate-800 text-base">{member.fullName || member.username}</div>
                  <div className="text-sm text-slate-500">{member.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                <div className="flex items-center">
                  <Phone size={14} className="text-slate-400 mr-2" />
                  {member.phone || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {member.status || 'Pending'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{(member.assignedEventIds || []).length} Events</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ActionsMenu member={member} onOpenAssignModal={onOpenAssignModal} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActionsMenu = ({ member, onOpenAssignModal }: { member: any, onOpenAssignModal: (member: any) => void }) => (
  <Menu as="div" className="relative inline-block text-left">
    <div>
      <Menu.Button className="inline-flex justify-center w-full rounded-md border border-slate-300 shadow-sm p-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </Menu.Button>
    </div>
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <Link href={`/admin/team/${member.username}`} className={`${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'} group flex items-center px-4 py-2 text-sm`}>
                <UserIcon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-500" aria-hidden="true" />
                View Details
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <a href="#" className={`${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'} group flex items-center px-4 py-2 text-sm`}>
                <Edit className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-500" aria-hidden="true" />
                Edit Member
              </a>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button onClick={() => onOpenAssignModal(member)} className={`${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'} group flex items-center w-full px-4 py-2 text-sm`}>
                <Calendar className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-500" aria-hidden="true" />
                Assign Events
              </button>
            )}
          </Menu.Item>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a href="#" className={`${active ? 'bg-red-50 text-red-900' : 'text-red-700'} group flex items-center px-4 py-2 text-sm`}>
                  <Trash2 className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" aria-hidden="true" />
                  Remove Member
                </a>
              )}
            </Menu.Item>
          </div>
        </div>
      </Menu.Items>
    </Transition>
  </Menu>
);

const AssignEventsModal = ({ member, events, onClose }: { member: any, events: any[], onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">Assign Events to {member.fullName || member.username}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1"><X className="w-6 h-6" /></button>
                </div>
                <form className="space-y-4">
                    <p className="text-base text-slate-600">Select the events this member should be assigned to.</p>
                    <div className="max-h-72 overflow-y-auto space-y-2 p-3 border border-slate-200 rounded-lg bg-slate-50/80">
                        {events.map(event => (
                            <label key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                                <input type="checkbox" defaultChecked={(member.assignedEventIds || []).includes(event.id)} className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                <span className="text-slate-700 font-medium text-base">{event.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="pt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md">Save Assignments</button>
                    </div>
                </form>
            </div>
        </div>
    );
};