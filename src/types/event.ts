
export interface Event {
  id: string;
  typeCode: string;
  typeName: string;
  eventCode: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  venueId: string;
  seatLayoutId?: string;
  eventManager: string;
  eventOperator1: string;
  eventOperator2?: string;
  eventChecker1: string;
  eventChecker2?: string;
  vipTickets?: number;
  vipTicketPrice?: number;
  platTickets?: number;
  platTicketPrice?: number;
  goldTickets?: number;
  goldTicketPrice?: number;
  silverTickets?: number;
  silverTicketPrice?: number;
  artistIds?: string[];
  sponsorIds?: string[];
  organizerIds?: string[];
}
