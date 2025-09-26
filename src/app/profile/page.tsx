"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/services/authService";
import { UserProfile } from "@/types/user";
import { 
  User, 
  CalendarDays, 
  Ticket, 
  BarChart2, 
  Settings, 
  Mail, 
  Phone,
  LogOut,
  Edit,
  History,
  CreditCard
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = await getCurrentUser();
        if (data.role === 'ROLE_ORG_ADMIN') {
          router.push('/admin/dashboard');
          return;
        }
        setUser(data);
      } catch (err: any) {
        setError("Failed to fetch profile. Please make sure you are logged in.");
        // Redirect to login if unauthorized
        setTimeout(() => router.push('/signin'), 2000);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/signin');
  };

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (!user) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {user.role === 'ROLE_USER' ? 'My Profile' : 'Dashboard'}
          </h1>
          {user.role !== 'ROLE_USER' && (
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium text-sm sm:text-base">
              Create Event
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-purple-600" />
          <div className="px-6 sm:px-8 pb-6 -mt-16 sm:-mt-20">
            <div className="flex items-end space-x-5">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <User className="text-white w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}
              <div className="pb-2 sm:pb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-sm text-gray-500">{user.roleName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Ticket} title="Total Tickets" value={user.totalTicketCount} />
          <StatCard icon={CalendarDays} title="Tickets At Hand" value={user.ticketsAtHand} />
          <StatCard icon={History} title="Tickets Used" value={user.ticketsUsed} />
          <StatCard icon={CreditCard} title="Total Spent" value={`${user.totalTicketPrice.toFixed(2)}`} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <TabButton name="overview" activeTab={activeTab} setActiveTab={setActiveTab} icon={BarChart2}>Overview</TabButton>
              <TabButton name="events" activeTab={activeTab} setActiveTab={setActiveTab} icon={CalendarDays}>My Tickets</TabButton>
              <TabButton name="settings" activeTab={activeTab} setActiveTab={setActiveTab} icon={Settings}>Settings</TabButton>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'events' && <EventsTab user={user} />}
          {activeTab === 'settings' && <SettingsTab user={user} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  );
}

// --- Components ---

const StatCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className="bg-blue-100 p-3 rounded-full">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const TabButton = ({ name, activeTab, setActiveTab, icon: Icon, children }: any) => (
  <button
    onClick={() => setActiveTab(name)}
    className={`${
      activeTab === name
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
  >
    <Icon className="h-5 w-5" />
    <span>{children}</span>
  </button>
);

const OverviewTab = ({ user }: { user: UserProfile }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Overview</h3>
    <ul className="space-y-4">
      <li className="flex items-center space-x-3">
        <div className="bg-green-100 p-2 rounded-full"><Mail className="h-5 w-5 text-green-600"/></div>
        <p className="text-sm text-gray-600">
          Email verified: <span className={`font-medium ${user.emailVerified ? 'text-green-700' : 'text-red-700'}`}>{user.emailVerified ? 'Yes' : 'No'}</span>
        </p>
      </li>
      <li className="flex items-center space-x-3">
        <div className="bg-blue-100 p-2 rounded-full"><Phone className="h-5 w-5 text-blue-600"/></div>
        <p className="text-sm text-gray-600">
          Mobile verified: <span className={`font-medium ${user.mobileVerified ? 'text-green-700' : 'text-red-700'}`}>{user.mobileVerified ? 'Yes' : 'No'}</span>
        </p>
      </li>
       <li className="flex items-center space-x-3">
        <div className="bg-purple-100 p-2 rounded-full"><CalendarDays className="h-5 w-5 text-purple-600"/></div>
        <p className="text-sm text-gray-600">Member since: <span className="font-medium text-gray-800">{new Date(user.signupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span></p>
      </li>
    </ul>
  </div>
);

const EventsTab = ({ user }: { user: UserProfile }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm text-center">
    <h3 className="text-lg font-medium text-gray-900 mb-4">My Tickets</h3>
    {user.totalTicketCount > 0 ? (
      <div>
        <p className="text-gray-600">You have {user.totalTicketCount} tickets in total.</p>
        <p className="text-gray-500 mt-2">A list of your event tickets will appear here.</p>
        {/* This is where you would map over actual ticket data */}
      </div>
    ) : (
      <p className="text-gray-500">You have not purchased any tickets yet.</p>
    )}
  </div>
);

const SettingsTab = ({ user, onLogout }: { user: UserProfile, onLogout: () => void }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm">
    <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
    <div className="space-y-4">
      <InfoField icon={Mail} label="Email Address" value={user.email} />
      <InfoField icon={Phone} label="Phone Number" value={user.phone || "Not Provided"} />
      <InfoField icon={User} label="Username" value={user.username} />
    </div>
    <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      <button className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2">
        <Edit className="w-4 h-4"/>
        <span>Edit Profile</span>
      </button>
      <button 
        onClick={onLogout}
        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium flex items-center justify-center space-x-2"
      >
        <LogOut className="w-4 h-4"/>
        <span>Log Out</span>
      </button>
    </div>
  </div>
);

const InfoField = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
  <div className="flex items-start py-2">
    <div className="flex-shrink-0 w-12 text-center">
      <Icon className="h-5 w-5 text-gray-400 mx-auto" />
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);