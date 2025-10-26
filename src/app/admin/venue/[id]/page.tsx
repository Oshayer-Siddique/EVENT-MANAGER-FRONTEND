'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getVenueById, deleteVenue, getVenueLayouts } from "@/services/venueService";
import { Venue } from "@/types/venue";
import { Layout } from "@/types/layout";
import LayoutPreview from "@/components/previews/LayoutPreview";
import { 
  ArrowLeft, MapPin, Mail, Phone, Users, Edit, Trash2, PlusSquare, ExternalLink, Building, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Main component
const VenueDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchVenueData = async () => {
        try {
          const [venueData, layoutsData] = await Promise.all([
            getVenueById(id),
            getVenueLayouts(id),
          ]);
          setVenue(venueData);
          setLayouts(layoutsData);
        } catch (error) {
          console.error("Failed to fetch venue data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchVenueData();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      try {
        await deleteVenue(id);
        router.push("/admin/venue");
      } catch (error) {
        console.error("Failed to delete venue:", error);
      }
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Loading venue details...</p></div>;
  }

  if (!venue) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Venue not found.</p></div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8 max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Venues
          </button>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">{venue.venueName}</h1>
              <p className="mt-1 text-lg text-slate-500 flex items-center">
                <Building size={16} className="mr-2 text-slate-400" />
                {venue.typeName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push(`/admin/venue/${venue.id}/edit`)} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDelete} 
                className="flex items-center gap-2 bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2.5 px-5 rounded-lg transition-colors duration-200"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white shadow-lg rounded-xl border border-slate-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Seating Layouts</h2>
                  <button
                    onClick={() => router.push(`/admin/venue/${venue.id}/layout/new`)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <PlusSquare size={16} />
                    <span>Add Layout</span>
                  </button>
                </div>
                {layouts.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {layouts.map(layout => (
                      <LayoutCard
                        key={layout.id}
                        layout={layout}
                        onManage={() => router.push(`/admin/venue/${venue.id}/layout/${layout.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-lg">
                    <h3 className="text-lg font-medium text-slate-700">No Seating Layouts</h3>
                    <p className="text-slate-500 mt-1">Get started by adding the first seating layout for this venue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white shadow-lg rounded-xl border border-slate-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Venue Details</h2>
                <div className="space-y-4">
                  <InfoItem icon={Users} label="Max Capacity" value={venue.maxCapacity || 'N/A'} />
                  <InfoItem icon={Mail} label="Email" value={venue.email} />
                  <InfoItem icon={Phone} label="Phone" value={venue.phone} />
                  {venue.websiteLink && <InfoItem icon={Globe} label="Website" value={venue.websiteLink} href={venue.websiteLink} />}
                  {venue.socialMediaLink && <InfoItem icon={ExternalLink} label="Social Media" value={venue.socialMediaLink} href={venue.socialMediaLink} />}
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-xl border border-slate-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Location</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base text-slate-700 font-medium">{venue.address}</p>
                    {venue.mapAddress && !venue.mapAddress.includes('/embed') && (
                        <a href={venue.mapAddress} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center text-sm font-semibold">
                            View on Map <ExternalLink className="ml-1.5" size={14} />
                        </a>
                    )}
                  </div>
                  {venue.mapAddress && venue.mapAddress.includes('/embed') ? (
                    <div className="relative w-full overflow-hidden rounded-lg border-2 border-slate-200" style={{ paddingTop: '75%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={venue.mapAddress}
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center p-4 text-center">
                      <div>
                        <MapPin className="mx-auto text-slate-400 w-9 h-9" />
                        <p className="mt-2 text-sm text-slate-500">Map preview not available.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, value, href }) => {
    if (!value) return null;

    const content = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 truncate font-semibold" title={value}>{value}</a>
    ) : (
        <span className="truncate text-slate-800 font-semibold" title={value}>{value}</span>
    );

    return (
        <div className="flex items-start">
            <Icon className="w-6 h-6 text-slate-400 mr-4 mt-1 flex-shrink-0" />
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-base">{content}</p>
            </div>
        </div>
    );
};

const LayoutCard = ({ layout, onManage }: { layout: Layout; onManage: (layoutId: string) => void }) => {
  const details = [
    {label: 'Capacity', value: layout.totalCapacity},
    layout.totalRows > 0 && {label: 'Rows', value: layout.totalRows},
    layout.totalCols > 0 && {label: 'Cols', value: layout.totalCols},
    layout.totalTables > 0 && {label: 'Tables', value: layout.totalTables},
    layout.chairsPerTable > 0 && {label: 'Chairs/Table', value: layout.chairsPerTable},
    layout.standingCapacity > 0 && {label: 'Standing', value: layout.standingCapacity},
  ].filter(Boolean);

  return (
    <div className="border-2 border-slate-200/80 rounded-xl p-4 transition-all hover:shadow-xl hover:border-slate-300 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg text-slate-800">{layout.layoutName}</h4>
          <p className="text-sm text-slate-500">{layout.typeName}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${layout.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
          {layout.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {details.map(item => (
                <div key={item.label}>
                    <p className="text-slate-500">{item.label}</p>
                    <p className="font-bold text-slate-700 text-base">{item.value}</p>
                </div>
            ))}
        </div>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-indigo-600 hover:underline font-semibold">Show Preview</summary>        
        <div className="mt-2 p-2 flex justify-center items-center bg-slate-50 rounded-lg border border-slate-200">
          <LayoutPreview {...layout} />
        </div>
      </details>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onManage(layout.id)}>
          Manage Seats
        </Button>
      </div>
    </div>
  );
};

export default VenueDetailsPage;
