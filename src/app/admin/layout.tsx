import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Building,
  UserCircle2,
  CircleDollarSign,
  Users2,
  Users,
} from "lucide-react";

const MelangeLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10L95 40L80 90H20L5 40L50 10Z" className="fill-sky-800"/>
    <path d="M50 20L20 45H80L50 20Z" className="fill-sky-100"/>
  </svg>
);

const Sidebar = () => {
  const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Event", href: "/admin/events", icon: CalendarDays },
    { name: "Venue", href: "/admin/venue", icon: Building },
    { name: "Artist", href: "/admin/artist", icon: UserCircle2 },
    { name: "Sponsors", href: "/admin/sponsors", icon: CircleDollarSign },
    { name: "Organizer", href: "/admin/organizer", icon: Users2 },
    { name: "Teams", href: "/admin/team", icon: Users },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-sky-100 h-screen p-5">
      <div className="mb-10 flex items-center space-x-4">
        <MelangeLogo />
        <div>
          <h1 className="text-xl font-bold text-sky-900">Melange</h1>
          <p className="text-xs text-gray-500">Your gateway to every event</p>
        </div>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center p-3 my-1 text-sky-900 rounded-lg hover:bg-sky-200 transition-colors"
              >
                <item.icon className="w-6 h-6 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  );
}