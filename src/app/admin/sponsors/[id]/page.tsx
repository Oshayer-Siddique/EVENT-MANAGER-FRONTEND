"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSponsorById } from "@/services/sponsorService";
import { Sponsor } from "@/types/sponsor";
import { ArrowLeft, Mail, Phone, User, Briefcase, Globe, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";

export default function SponsorDetailsPage() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchSponsor = async () => {
        setIsLoading(true);
        try {
          const data = await getSponsorById(id);
          setSponsor(data);
        } catch (err) {
          setError("Failed to fetch sponsor details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSponsor();
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Loading sponsor details...</p></div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-red-500">{error}</p></div>;
  }

  if (!sponsor) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Sponsor not found.</p></div>;
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
            Back to Sponsors
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <img 
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-lg mb-4 md:mb-0"
              src={sponsor.imageUrl || `https://ui-avatars.com/api/?name=${sponsor.name.replace(' ', '+')}&background=random&color=fff&size=128`}
              alt="Profile image"
            />
            <div>
              <h1 className="text-4xl font-bold text-slate-800">{sponsor.name}</h1>
              <p className="mt-1 text-lg text-slate-500 flex items-center">
                <Briefcase size={16} className="mr-2 text-slate-400" />
                Sponsor
              </p>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title="Sponsor Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                <InfoItem icon={Mail} label="Email" value={sponsor.email} />
                <InfoItem icon={Phone} label="Mobile" value={sponsor.mobile} />
                <InfoItem icon={User} label="Address" value={sponsor.address} />
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{sponsor.description}</p>
              </div>
            </InfoCard>
          </div>

          <div className="lg:col-span-1">
            <InfoCard title="Social Links">
              <div className="space-y-3">
                <SocialLink icon={Facebook} label="Facebook" value={sponsor.facebookLink} />
                <SocialLink icon={Instagram} label="Instagram" value={sponsor.instagramLink} />
                <SocialLink icon={Youtube} label="YouTube" value={sponsor.youtubeLink} />
                <SocialLink icon={Globe} label="Website" value={sponsor.websiteLink} />
              </div>
            </InfoCard>
          </div>
        </main>
      </div>
    </div>
  );
}

const InfoCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white shadow-lg rounded-xl border border-slate-200 p-6 h-full">
    <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">{title}</h2>
    {children}
  </div>
);

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return null;

  return (
    <div className="flex items-start">
      <Icon className="w-6 h-6 text-slate-400 mr-4 mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-base text-slate-800 font-semibold">{value}</p>
      </div>
    </div>
  );
};

const SocialLink = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return (
    <div className="flex items-center text-slate-400">
      <Icon size={18} className="mr-3" />
      <span className="font-medium text-sm italic">Not provided</span>
    </div>
  );

  return (
    <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center text-slate-700 hover:text-blue-600 group">
      <Icon size={18} className="mr-3 text-slate-500 group-hover:text-blue-500" />
      <span className="font-medium text-sm">{label}</span>
    </a>
  );
};
