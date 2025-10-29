"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Eye,
  Music2,
  Globe,
  AtSign,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Youtube,
  Sparkles,
} from "lucide-react";
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

  const stats = useMemo(() => {
    const total = artists.length;
    const withWebsite = artists.filter((artist) => artist.websiteLink).length;
    const withSocial = artists.filter(
      (artist) => artist.facebookLink || artist.instagramLink || artist.youtubeLink
    ).length;

    return [
      {
        label: "Total Artists",
        value: total,
        icon: Music2,
        description: "Profiles curated in your roster.",
      },
      {
        label: "Showcasing Online",
        value: withWebsite,
        icon: Globe,
        description: "Artists linking out to their own sites.",
      },
      {
        label: "Social Ready",
        value: withSocial,
        icon: Sparkles,
        description: "Artists with at least one social channel.",
      },
    ];
  }, [artists]);

  const filteredArtists = artists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artist.email && artist.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Talent Directory</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Artist Management</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Keep your creative roster polished. Track contact details, social reach, and showcase-ready profiles at a glance.
            </p>
          </div>
          <Link href="/admin/artist/new" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5F7F] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100">
            <PlusCircle className="h-4 w-4" /> Create Artist
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
            placeholder="Search artists by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-[#2F5F7F] focus:outline-none focus:ring-2 focus:ring-[#2F5F7F]/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredArtists.length}</span> of {" "}
          <span className="font-semibold text-slate-700">{artists.length}</span> artists
        </p>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          No artists match your search just yet. Try another keyword or add a new profile.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Artist</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Socials</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArtists.map((artist) => {
                const initialsFallback = `https://ui-avatars.com/api/?name=${artist.name.replace(' ', '+')}&background=2F5F7F&color=fff`;
                const hasSocial = Boolean(artist.facebookLink || artist.instagramLink || artist.youtubeLink);

                return (
                  <tr key={artist.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                          <img src={artist.imageUrl || initialsFallback} alt={artist.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{artist.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{artist.description || 'No bio provided yet.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <AtSign className="h-4 w-4 text-[#2F5F7F]" />
                        <span>{artist.email || '—'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#2F5F7F]" />
                        <span>{artist.mobile || '—'}</span>
                      </div>
                      {artist.websiteLink && (
                        <a
                          href={artist.websiteLink}
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
                        <span className="line-clamp-2 max-w-xs">{artist.address || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {hasSocial ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {artist.facebookLink && (
                            <a href={artist.facebookLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
                              <Facebook className="h-4 w-4" /> Facebook
                            </a>
                          )}
                          {artist.instagramLink && (
                            <a href={artist.instagramLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
                              <Instagram className="h-4 w-4" /> Instagram
                            </a>
                          )}
                          {artist.youtubeLink && (
                            <a href={artist.youtubeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[#2F5F7F]">
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
                          href={`/admin/artist/${artist.id}`}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#2F5F7F]"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/artist/${artist.id}/edit`}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(artist.id)}
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
