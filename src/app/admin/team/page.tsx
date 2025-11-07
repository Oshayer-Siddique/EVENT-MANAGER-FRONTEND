'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Search, Users, ShieldCheck, Workflow, Eye } from 'lucide-react';
import {
  getEventManagers,
  getOperators,
  getEventCheckers,
  deleteEventManager,
  deleteOperator,
  deleteEventChecker,
} from '@/services/userService';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const [eventManagers, operators, eventCheckers] = await Promise.all([
          getEventManagers(),
          getOperators(),
          getEventCheckers(),
        ]);
        setMembers([...eventManagers, ...operators, ...eventCheckers]);
      } catch (error) {
        console.error('Failed to fetch team members', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const stats = useMemo(() => {
    const total = members.length;
    const managers = members.filter(member => member.roleName?.toLowerCase().includes('event manager')).length;
    const operators = members.filter(member => member.roleName?.toLowerCase().includes('operator')).length;
    const checkers = members.filter(member => member.roleName?.toLowerCase().includes('event checker')).length;

    return [
      {
        label: 'Total Staff',
        value: total,
        icon: Users,
        description: 'People keeping events running smoothly.',
      },
      {
        label: 'Event Managers',
        value: managers,
        icon: ShieldCheck,
        description: 'Strategists overseeing the full experience.',
      },
      {
        label: 'Operators & Checkers',
        value: operators + checkers,
        icon: Workflow,
        description: 'On-ground specialists handling execution.',
      },
    ];
  }, [members]);

  const filteredMembers = members
    .filter(member => {
      if (roleFilter === 'all') return true;
      return member.roleName.toLowerCase().replace('_', ' ').includes(roleFilter.toLowerCase());
    })
    .filter(
      (member) =>
        (member.fullName && member.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleDelete = async (member: any) => {
    if (deletingId) return;
    if (!window.confirm(`Remove ${member.fullName || member.username} from your team?`)) {
      return;
    }

    setDeletingId(member.id);
    try {
      switch (member.roleCode) {
        case '803':
          await deleteEventManager(member.id);
          break;
        case '804':
          await deleteOperator(member.id);
          break;
        case '805':
          await deleteEventChecker(member.id);
          break;
        default:
          throw new Error('Unsupported role for deletion.');
      }

      setMembers((prev) => prev.filter((item) => item.id !== member.id));
    } catch (error) {
      console.error('Failed to delete team member', error);
      alert('Failed to delete team member. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">People Operations</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Team Management</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Keep your crew coordinated with instant insight into roles, coverage, and contact details.
            </p>
          </div>
          <Link
            href="/admin/team/new"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5F7F] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            <PlusCircle className="h-4 w-4" /> Add Member
          </Link>
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
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          >
            <option value="all">All Roles</option>
            <option value="event manager">Event Manager</option>
            <option value="operator">Operator</option>
            <option value="event checker">Event Checker</option>
          </select>
          <p className="text-sm text-slate-500 hidden md:block">
            Showing <span className="font-semibold text-slate-700">{filteredMembers.length}</span> of {" "}
            <span className="font-semibold text-slate-700">{members.length}</span> teammates
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider">Role</th>
<th className="px-6 py-4 text-sm font-bold text-blue-600 uppercase tracking-wider text-right pr-12">
  Actions
</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={member.imageUrl || `https://ui-avatars.com/api/?name=${(member.fullName || member.username).replace(' ', '+')}&background=random&color=fff`} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{member.fullName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.roleName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                  <Link href={`/admin/team/${member.id}`}>
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition" title="View"><Eye size={18} /></button>
                  </Link>
                  <Link href={`/admin/team/${member.id}/edit`}>
                    <button className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100 transition" title="Edit"><Edit size={18} /></button>
                  </Link>
                  <button
                    onClick={() => handleDelete(member)}
                    disabled={deletingId === member.id}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
