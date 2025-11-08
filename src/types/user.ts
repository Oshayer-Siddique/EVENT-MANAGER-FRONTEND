export enum UserRole {
    USER = "ROLE_USER",
    ORG_ADMIN = "ROLE_ORG_ADMIN",
    EVENT_MANAGER = "ROLE_EVENT_MANAGER",
    OPERATOR = "ROLE_OPERATOR",
    EVENT_CHECKER = "ROLE_EVENT_CHECKER",
}

export interface User {
    id: string;
    username: string;
    email: string;
    roles: UserRole[];
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password?: string;
    roles: UserRole[];
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string;
    roles?: UserRole[];
}

export interface UserProfile {
    id: string;
    fullName: string;
    username: string;
    email: string;
    phone?: string | null;
    role: string;
    roleName?: string;
    imageUrl?: string | null;
    totalTicketCount: number;
    ticketsAtHand: number;
    ticketsUsed: number;
    totalTicketPrice: number;
    emailVerified: boolean;
    mobileVerified: boolean;
    signupDate: string;
}
