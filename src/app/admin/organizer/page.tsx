"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Eye,
  Building2,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Sparkles,
} from "lucide-react";
import {
  getBusinessOrganizations,
  deleteBusinessOrganization,
} from "@/services/businessOrganizationService";
import { BusinessOrganization } from "@/types/businessOrganization";

export default function OrganizerPage() {
  const [organizations, setOrganizations] = useState<BusinessOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getBusinessOrganizations();
        setOrganizations(data);
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await deleteBusinessOrganization(id);
        setOrganizations(organizations.filter((org) => org.id !== id));
      } catch (error) {
        console.error("Failed to delete organization", error);
      }
    }
  };

  const stats = useMemo(() => {
    const total = organizations.length;
    const withWebsite = organizations.filter((org) => org.websiteLink).length;
    const withSocial = organizations.filter(
      (org) => org.facebookLink || org.instagramLink || org.youtubeLink
    ).length;

    return [
      {
        label: "Active Organizers",
        value: total,
        icon: Users,
        description: "Event teams ready to collaborate.",
      },
      {
        label: "Web Presence",
        value: withWebsite,
        icon: Globe,
        description: "Organizations with published websites.",
      },
      {
        label: "Socially Connected",
        value: withSocial,
        icon: Sparkles,
        description: "Organizers sharing community channels.",
      },
    ];
  }, [organizations]);

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.email && org.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Operational Partners</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Organizer Management</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Highlight the teams behind every successful event. Showcase key contacts, social presence, and quick actions in a polished view.
            </p>
          </div>
          <Link href="/admin/organizer/new" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5F7F] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100">
            <PlusCircle className="h-4 w-4" /> Create Organization
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
            placeholder="Search organizers by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredOrganizations.length}</span> of {" "}
          <span className="font-semibold text-slate-700">{organizations.length}</span> organizers
        </p>
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          No organizers match your filters. Adjust your search or invite a new operations partner.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-blue-600 uppercase tracking-wider text pr-12">
                  Organizers
                </th>   <th className="px-6 py-4 text-sm font-bold text-blue-600 uppercase tracking-wider text pr-12">
                  Contact
                </th>   <th className="px-6 py-4 text-sm font-bold text-blue-600 uppercase tracking-wider text pr-12">
                  Location
                </th>   <th className="px-6 py-4 text-sm font-bold text-blue-600 uppercase tracking-wider text pr-12">
                  Socials
                </th>                
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-blue-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrganizations.map((org) => {
                const initialsFallback = `https://ui-avatars.com/api/?name=${org.name.replace(' ', '+')}&background=2F5F7F&color=fff`;
                const hasSocial = Boolean(org.facebookLink || org.instagramLink || org.youtubeLink);

                return (
                  <tr key={org.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                          <img src={org.imageUrl || initialsFallback} alt={org.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                          {/* <p className="text-xs text-slate-500 line-clamp-1">{org.description || 'No organization overview yet.'}</p> */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#2F5F7F]" />
                        <span>{org.email || '—'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#2F5F7F]" />
                        <span>{org.mobile || '—'}</span>
                      </div>
                      {org.websiteLink && (
                        <a
                          href={org.websiteLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#2F5F7F]/20 px-2.5 py-1 text-xs font-medium text-[#2F5F7F] transition hover:bg-[#2F5F7F]/10"
                        >
                          <Globe className="h-4 w-4" /> Website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-[#2F5F7F]" />
                        <span className="line-clamp-2 max-w-xs">{org.address || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {hasSocial ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {org.facebookLink && (
                            <a href={org.facebookLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
                              <Facebook className="h-4 w-4" /> Facebook
                            </a>
                          )}
                          {org.instagramLink && (
                            <a href={org.instagramLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
                              <Instagram className="h-4 w-4" /> Instagram
                            </a>
                          )}
                          {org.youtubeLink && (
                            <a href={org.youtubeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
                              <Youtube className="h-4 w-4" /> YouTube
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No social links</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/organizer/${org.id}`}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#2F5F7F]"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/organizer/${org.id}/edit`}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
