"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getEventManagers,
  getOperators,
  getEventCheckers,
} from "@/services/userService";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Briefcase,
  ShieldCheck,
  Calendar,
  UserSquare,
  Globe,
  MapPin,
} from "lucide-react";

interface TeamMember {
  id?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleName?: string;
  status?: string;
  imageUrl?: string;
  website?: string;
  websiteLink?: string;
  address?: string;
  location?: string;
  assignedEvents?: Array<{
    id?: string;
    eventName?: string;
    title?: string;
    eventStart?: string;
    eventEnd?: string;
  }>;
  [key: string]: any;
}

export default function MemberDetailsPage() {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [managers, operators, checkers] = await Promise.all([
          getEventManagers(),
          getOperators(),
          getEventCheckers(),
        ]);

        const allMembers: TeamMember[] = [...managers, ...operators, ...checkers];
        const found = allMembers.find(
          (candidate) => candidate.id === id || candidate.username === id
        );

        if (!found) {
          setError("Member not found.");
          setMember(null);
          return;
        }

        setMember(found);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch member details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const assignedEvents = useMemo(() => member?.assignedEvents ?? [], [member]);
  const websiteLink = useMemo(
    () => member?.website || member?.websiteLink,
    [member]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading member details…</p>
      </div>
    );
  }

  if (error.trim()) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-rose-500">{error}</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Member not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Back to Team
        </button>

        <section className="rounded-3xl bg-gradient-to-r from-[#2F5F7F] via-[#345F78] to-[#2F5F7F] p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <img
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white/40 shadow-2xl"
              src={
                member.imageUrl ||
                `https://ui-avatars.com/api/?name=${(member.fullName || member.username || "Team Member").replace(
                  /\s+/g,
                  "+"
                )}&background=2F5F7F&color=fff&size=128`
              }
              alt="Profile"
            />
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Briefcase className="h-3.5 w-3.5" /> {member.roleName || "Team Member"}
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{member.fullName || member.username}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/85">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white/70" />
                  <span>{member.status || "Active"}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-white/70" />
                    <span>{member.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <InfoCard title="Profile Overview">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem icon={UserSquare} label="Full Name" value={member.fullName} />
              <InfoItem icon={User} label="Username" value={member.username} />
              <InfoItem icon={User} label="First Name" value={member.firstName} />
              <InfoItem icon={User} label="Last Name" value={member.lastName} />
              <InfoItem icon={Mail} label="Email" value={member.email} />
              <InfoItem icon={Phone} label="Phone" value={member.phone} />
              <InfoItem icon={Briefcase} label="Role" value={member.roleName} />
              <InfoItem icon={ShieldCheck} label="Status" value={member.status} />
              <InfoItem icon={Globe} label="Website" value={websiteLink} isLink />
              <InfoItem icon={MapPin} label="Location" value={member.address || member.location} />
            </div>
          </InfoCard>

          <div className="space-y-6">
            <InfoCard title="Assigned Events">
              <div className="space-y-3">
                {assignedEvents.length > 0 ? (
                  assignedEvents.map((event) => {
                    const title = event.eventName || event.title || "Scheduled event";
                    const window = event.eventStart
                      ? formatEventWindow(event.eventStart, event.eventEnd)
                      : null;

                    return (
                      <div
                        key={event.id ?? `${title}-${event.eventStart}`}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                      >
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="h-4 w-4 text-[#2F5F7F]" />
                          <span className="font-medium">{title}</span>
                        </div>
                        {window && <p className="mt-1 text-xs text-slate-500">{window}</p>}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No events assigned yet.</p>
                )}
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const InfoItem = ({
  icon: Icon,
  label,
  value,
  isLink = false,
}: {
  icon: ElementType;
  label: string;
  value?: string | null;
  isLink?: boolean;
}) => {
  if (!value) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/60 p-3">
        <Icon className="h-4 w-4 text-slate-300" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-sm italic text-slate-400">Not provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/60 p-3 shadow-inner">
      <Icon className="h-4 w-4 text-[#2F5F7F]" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#2F5F7F] underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-slate-700">{value}</p>
        )}
      </div>
    </div>
  );
};

const formatEventWindow = (start: string, end?: string) => {
  try {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
    const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

    const datePart = dateFormatter.format(startDate);
    const timePart = endDate
      ? `${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`
      : timeFormatter.format(startDate);

    return `${datePart} · ${timePart}`;
  } catch (err) {
    return "Date to be announced";
  }
};
