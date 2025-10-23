
import { EventSeat } from "./eventSeat";
import { User } from "./user";


export enum TicketStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  USED = 'USED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

export interface Ticket {
  id: string; // UUID
  status: TicketStatus;
  eventSeat: EventSeat;
  buyer: User;
  reservedUntil?: string; // OffsetDateTime
  issuedAt?: string; // OffsetDateTime
  checkedInAt?: string; // OffsetDateTime
  qrCode: string;
  verificationCode: string;
  holderName: string;
  holderEmail: string;
  checker?: User;
  gate?: string;
  refundAmount?: number; // BigDecimal
  refundedAt?: string; // OffsetDateTime
  createdAt: string; // OffsetDateTime
  updatedAt: string; // OffsetDateTime
  version: number;
}

export interface TicketCreateRequest {
    eventId: string;
    seatId: string;
    buyerId: string;
    reservedUntil?: string;
    holderName?: string;
    holderEmail?: string;
}

export interface TicketCheckInRequest {
    checkerId: string;
    gate?: string;
}

export interface TicketRefundRequest {
    refundAmount: number;
}

export interface TicketResponse {
    id: string;
    status: string;
    eventId: string;
    buyerId: string;
    seatId: string;
    seatLabel: string;
    tierCode: string;
    price: number;
    qrCode: string;
    verificationCode: string;
    holderName: string;
    holderEmail: string;
    gate?: string;
    checkerId?: string;
    checkedInAt?: string;
    reservedUntil?: string;
    issuedAt?: string;
    refundAmount?: number;
    refundedAt?: string;
    createdAt: string;
    updatedAt: string;
}
