"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getCurrentUser, logout } from "@/services/authService";
import type { UserProfile } from "@/types/user";

import {
  CalendarDays,
  CreditCard,
  Headphones,
  History,
  LifeBuoy,
  LogOut,
  Mail,
  Phone,
  Ticket,
  User,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const profile = await getCurrentUser();
        if (cancelled) return;
        if (profile.role === "ROLE_ORG_ADMIN") {
          router.replace("/admin/dashboard");
          return;
        }
        setUser(profile);
      } catch (err) {
        console.error("Failed to load profile", err);
        if (!cancelled) {
          setError("We couldn't load your profile. Please sign in again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/signin");
    } catch (err) {
      console.error("Logout failed", err);
      router.replace("/signin");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const joinDateLabel = useMemo(() => {
    if (!user) {
      return "";
    }
    const parsed = new Date(user.signupDate);
    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [user]);

  const stats = useMemo(() => {
    if (!user) {
      return [] as Array<{
        label: string;
        value: string | number;
        icon: React.ComponentType<{ className?: string }>;
        chipClass: string;
        iconClass: string;
        prefix?: string;
      }>;
    }
    return [
      {
        label: "Total tickets",
        value: user.totalTicketCount,
        icon: Ticket,
        chipClass: "bg-indigo-50 text-indigo-600",
        iconClass: "bg-indigo-100 text-indigo-700",
      },
      {
        label: "Tickets on hand",
        value: user.ticketsAtHand,
        icon: CalendarDays,
        chipClass: "bg-emerald-50 text-emerald-600",
        iconClass: "bg-emerald-100 text-emerald-600",
      },
      {
        label: "Tickets used",
        value: user.ticketsUsed,
        icon: History,
        chipClass: "bg-amber-50 text-amber-600",
        iconClass: "bg-amber-100 text-amber-600",
      },
      {
        label: "Total spent",
        value: user.totalTicketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: CreditCard,
        chipClass: "bg-rose-50 text-rose-600",
        iconClass: "bg-rose-100 text-rose-600",
        prefix: "$",
      },
    ];
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-4 border-t-slate-900" />
        <p className="mt-4 text-sm text-slate-500">Loading your profile…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">{error ?? "Profile unavailable"}</p>
        <p className="mt-2 text-sm text-slate-500">Your session might have expired. Please sign in again to continue.</p>
        <Link
          href="/signin"
          className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  const safeJoinDateLabel = joinDateLabel || "—";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Account</p>
            <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Browse events
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ProfileHero user={user} joinDateLabel={safeJoinDateLabel} onLogout={handleLogout} isLoggingOut={isLoggingOut} />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <AccountOverviewCard user={user} className="lg:col-span-5" />
          <ContactInfoCard user={user} className="lg:col-span-7" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          <TicketPortfolioCard user={user} className="lg:col-span-8" />
          <SupportCard className="lg:col-span-4" />
        </section>
      </main>
    </div>
  );
}

const ProfileHero = ({
  user,
  joinDateLabel,
  onLogout,
  isLoggingOut,
}: {
  user: UserProfile;
  joinDateLabel: string;
  onLogout: () => Promise<void> | void;
  isLoggingOut: boolean;
}) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <AvatarCircle fullName={user.fullName} imageUrl={user.imageUrl} />
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Signed in as</p>
          <h2 className="text-2xl font-semibold text-slate-900">{user.fullName}</h2>
          <p className="text-sm text-slate-500">Member since {joinDateLabel}</p>
          <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {user.roleName ?? "General attendee"}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Quick contact</p>
          <p>{user.email}</p>
          {user.phone && <p>{user.phone}</p>}
        </div>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  </section>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  chipClass,
  iconClass,
  prefix,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  chipClass: string;
  iconClass: string;
  prefix?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
    <div className={`mb-3 inline-flex rounded-full px-3 py-2 text-xs font-semibold ${chipClass}`}>{label}</div>
    <div className="flex items-center justify-between">
      <p className="text-3xl font-semibold text-slate-900">
        {prefix}
        {value}
      </p>
      <div className={`rounded-full p-3 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const AccountOverviewCard = ({ user, className = "" }: { user: UserProfile; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
    <h3 className="text-lg font-semibold text-slate-900">Account overview</h3>
    <p className="mt-1 text-sm text-slate-500">Verification and membership status</p>
    <dl className="mt-4 space-y-3 text-sm text-slate-600">
      <InfoRow label="Email verified" value={user.emailVerified ? "Yes" : "No"} positive={user.emailVerified} />
      <InfoRow label="Mobile verified" value={user.mobileVerified ? "Yes" : "No"} positive={user.mobileVerified} />
      <InfoRow label="Membership" value={user.roleName ?? "Attendee"} />
    </dl>
  </section>
);

const ContactInfoCard = ({ user, className = "" }: { user: UserProfile; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
    <h3 className="text-lg font-semibold text-slate-900">Contact details</h3>
    <p className="mt-1 text-sm text-slate-500">Keep your information up to date so we can reach you with ticket updates.</p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <ContactTile icon={Mail} label="Email" value={user.email} />
      <ContactTile icon={Phone} label="Phone" value={user.phone ?? "Not provided"} />
      <ContactTile icon={User} label="Username" value={user.username} />
      <ContactTile icon={Ticket} label="Role" value={user.roleName ?? "Attendee"} />
    </div>
  </section>
);

const TicketPortfolioCard = ({ user, className = "" }: { user: UserProfile; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">My tickets</h3>
        <p className="text-sm text-slate-500">A quick snapshot of your current and past tickets.</p>
      </div>
      <Link
        href="/events"
        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Find new events
      </Link>
    </div>
    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
      {user.totalTicketCount > 0
        ? "Your purchased tickets will appear here once connected to the ticket service."
        : "You haven't purchased any tickets yet. When you do, they'll show up here."}
    </div>
  </section>
);

const SupportCard = ({ className = "" }: { className?: string }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
    <h3 className="text-lg font-semibold text-slate-900">Need help?</h3>
    <p className="mt-1 text-sm text-slate-500">We&apos;re here to make sure your event night goes smoothly.</p>
    <div className="mt-4 space-y-3 text-sm text-slate-600">
      <a href="mailto:support@eventmanager.com" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
        <Mail className="h-4 w-4 text-slate-500" /> support@eventmanager.com
      </a>
      <a href="tel:+18005551234" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
        <Headphones className="h-4 w-4 text-slate-500" /> +1 (800) 555-1234
      </a>
      <div className="flex items-center gap-2 text-slate-700">
        <LifeBuoy className="h-4 w-4 text-slate-500" /> 24/7 concierge support on event days
      </div>
    </div>
  </section>
);

const InfoRow = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <span className={`text-sm font-semibold ${positive === undefined ? "text-slate-900" : positive ? "text-emerald-600" : "text-rose-600"}`}>
      {value}
    </span>
  </div>
);

const ContactTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <Icon className="h-4 w-4" /> {label}
    </div>
    <p className="mt-2 text-base font-medium text-slate-900">{value}</p>
  </div>
);

const AvatarCircle = ({ fullName, imageUrl }: { fullName: string; imageUrl?: string | null }) => {
  const initials = useMemo(() => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) {
      return parts[0][0]?.toUpperCase();
    }
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }, [fullName]);

  if (imageUrl) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-full">
        <Image src={imageUrl} alt={fullName} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-xl font-semibold text-white">
      {initials || "?"}
    </div>
  );
};
