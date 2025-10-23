import { apiClient } from "./apiClient";
import { TicketResponse, TicketCreateRequest, TicketCheckInRequest, TicketRefundRequest } from "../types/ticket";

const TICKET_API_URL = "/api/tickets";

export const reserveTicket = (data: TicketCreateRequest): Promise<TicketResponse> => {
    return apiClient(`${TICKET_API_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const issueTicket = (ticketId: string): Promise<TicketResponse> => {
    return apiClient(`${TICKET_API_URL}/issue/${ticketId}`, {
        method: 'POST',
    });
};

export const checkInTicket = (ticketId: string, data: TicketCheckInRequest): Promise<TicketResponse> => {
    return apiClient(`${TICKET_API_URL}/checkin/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const refundTicket = (ticketId: string, data: TicketRefundRequest): Promise<TicketResponse> => {
    return apiClient(`${TICKET_API_URL}/refund/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};

export const getTicket = (ticketId: string): Promise<TicketResponse> => {
    return apiClient(`${TICKET_API_URL}/${ticketId}`);
};

export const listTicketsByEvent = (eventId: string): Promise<TicketResponse[]> => {
    return apiClient(`${TICKET_API_URL}?eventId=${eventId}`);
};

export const listTicketsByBuyer = (buyerId: string): Promise<TicketResponse[]> => {
    return apiClient(`${TICKET_API_URL}?buyerId=${buyerId}`);
};
