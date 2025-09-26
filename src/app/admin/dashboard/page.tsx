"use client";

import { DollarSign, Ticket, CalendarDays, ClipboardList } from "lucide-react";

const mockEvents = [
  { id: 1, title: "Tech Conference 2025", date: "2025-10-15", status: "Published", ticketsSold: 850, totalTickets: 1200, revenue: 42500 },
  { id: 2, title: "Indie Music Festival", date: "2025-08-20", status: "Draft", ticketsSold: 0, totalTickets: 5000, revenue: 0 },
  { id: 3, title: "Local Charity Gala", date: "2025-11-01", status: "Published", ticketsSold: 250, totalTickets: 300, revenue: 75000 },
  { id: 4, title: "Startup Pitch Night", date: "2025-07-05", status: "Completed", ticketsSold: 150, totalTickets: 150, revenue: 5000 },
];

export default function DashboardPage() {
    const totalRevenue = mockEvents.reduce((sum, e) => sum + e.revenue, 0);
    const totalTicketsSold = mockEvents.reduce((sum, e) => sum + e.ticketsSold, 0);
    const activeEventsCount = mockEvents.filter(e => e.status === 'Published').length;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard icon={DollarSign} title="Total Revenue" value={`${(totalRevenue / 1000).toFixed(1)}k`} />
                <StatCard icon={Ticket} title="Tickets Sold" value={totalTicketsSold.toLocaleString()} />
                <StatCard icon={CalendarDays} title="Active Events" value={activeEventsCount} />
                <StatCard icon={ClipboardList} title="Total Events" value={mockEvents.length} />
            </div>
        </div>
    );
}

const StatCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-5 transition-all hover:shadow-lg hover:-translate-y-1">
    <div className="bg-indigo-100 p-4 rounded-full">
      <Icon className="h-7 w-7 text-indigo-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);