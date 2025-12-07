export type DiscountValueType = 'AMOUNT' | 'PERCENTAGE';

export interface DiscountLineItem {
  seatId?: string;
  tierCode: string;
  quantity: number;
  unitPrice: number;
}

export interface DiscountValidationRequest {
  eventId: string;
  buyerId?: string;
  discountCode?: string;
  includeAutomaticDiscounts?: boolean;
  items: DiscountLineItem[];
}

export interface DiscountValidationResponseItem {
  discountId: string;
  code: string;
  name: string;
  amount: number;
  autoApplied: boolean;
  stackable: boolean;
}

export interface DiscountValidationResponse {
  subtotal: number;
  discountTotal: number;
  totalDue: number;
  appliedDiscounts: DiscountValidationResponseItem[];
}

export interface DiscountResponse {
  id: string;
  name: string;
  code: string;
  valueType: DiscountValueType;
  value: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  maxRedemptions?: number;
  maxRedemptionsPerBuyer?: number;
  startsAt?: string;
  endsAt?: string;
  eventId?: string;
  tierCode?: string;
  autoApply: boolean;
  stackable: boolean;
  active: boolean;
  allowGuestRedemption: boolean;
  priority: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountRequest {
  name: string;
  code: string;
  valueType: DiscountValueType;
  value: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  maxRedemptions?: number;
  maxRedemptionsPerBuyer?: number;
  startsAt?: string;
  endsAt?: string;
  eventId?: string;
  tierCode?: string;
  autoApply?: boolean;
  stackable?: boolean;
  active?: boolean;
  allowGuestRedemption?: boolean;
  priority?: number;
  notes?: string;
}
