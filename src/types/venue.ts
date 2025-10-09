export interface Venue {
  id: string;
  typeCode: string;
  typeName: string;
  venueCode: string;
  venueName: string;
  address: string;
  email: string;
  phone: string;
  totalEvents: number;
  liveEvents: number;
  eventsUpcoming: number;
  maxCapacity: string | null;
  mapAddress: string | null;
  socialMediaLink: string | null;
  websiteLink: string | null;
}
