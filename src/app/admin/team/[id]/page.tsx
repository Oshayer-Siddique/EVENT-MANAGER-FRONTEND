"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventManagers, getOperators } from "@/services/userService";
import { ArrowLeft, Mail, Phone, User, Briefcase, ShieldCheck, Calendar, UserSquare, Globe, Linkedin, Twitter } from "lucide-react";

export default function MemberDetailsPage() {
  const [member, setMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchMember = async () => {
        setIsLoading(true);
        try {
          const [managers, operators] = await Promise.all([
            getEventManagers(),
            getOperators(),
          ]);
          const allMembers = [...managers, ...operators];
          const foundMember = allMembers.find((m) => m.username === id);
          if (foundMember) {
            setMember(foundMember);
          } else {
            setError("Member not found.");
          }
        } catch (err) {
          setError("Failed to fetch member details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchMember();
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Loading member details...</p></div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-red-500">{error}</p></div>;
  }

  if (!member) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Member not found.</p></div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Team
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <img 
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-lg mb-4 md:mb-0"
              src={member.imageUrl || `https://ui-avatars.com/api/?name=${(member.fullName || member.username).replace(' ', '+')}&background=random&color=fff&size=128`}
              alt="Profile image"
            />
            <div>
              <h1 className="text-4xl font-bold text-slate-800">{member.fullName || member.username}</h1>
              <p className="mt-1 text-lg text-slate-500 flex items-center">
                <Briefcase size={16} className="mr-2 text-slate-400" />
                {member.roleName || 'N/A'}
              </p>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title="Member Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                <InfoItem icon={User} label="Username" value={member.username} />
                <InfoItem icon={UserSquare} label="Full Name" value={member.fullName} />
                <InfoItem icon={User} label="First Name" value={member.firstName} />
                <InfoItem icon={User} label="Last Name" value={member.lastName} />
                <InfoItem icon={Mail} label="Email" value={member.email} />
                <InfoItem icon={Phone} label="Phone" value={member.phone} />
                <InfoItem icon={ShieldCheck} label="Status" value={member.status} />
                <InfoItem icon={Briefcase} label="Role" value={member.roleName} />
              </div>
            </InfoCard>

          </div>

          <div className="lg:col-span-1">
            <InfoCard title="Assigned Events">
              <div className="space-y-3">
                {(member.assignedEvents && member.assignedEvents.length > 0) ? (
                  member.assignedEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center text-slate-700 p-2 rounded-md hover:bg-slate-100">
                      <Calendar size={16} className="mr-3 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{event.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No events assigned.</p>
                )}
              </div>
            </InfoCard>
          </div>
        </main>
      </div>
    </div>
  );
}

const InfoCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white shadow-lg rounded-xl border border-slate-200 p-6">
    <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">{title}</h2>
    {children}
  </div>
);

const InfoItem = ({ icon: Icon, label, value, isLink = false }: { icon: React.ElementType, label: string, value: string, isLink?: boolean }) => {
  if (!value) return (
    <div className="flex items-start">
      <Icon className="w-6 h-6 text-slate-300 mr-4 mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className="text-base text-slate-400 italic">Not provided</p>
      </div>
    </div>
  );

  return (
    <div className="flex items-start">
      <Icon className="w-6 h-6 text-slate-400 mr-4 mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-base text-indigo-600 hover:text-indigo-800 font-semibold break-all">{value}</a>
        ) : (
          <p className="text-base text-slate-800 font-semibold">{value}</p>
        )}
      </div>
    </div>
  );
};