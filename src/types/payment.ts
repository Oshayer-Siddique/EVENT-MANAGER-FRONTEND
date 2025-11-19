export enum PaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

export interface CreatePaymentIntentRequest {
  holdId: string;
  currency?: string;
  customerEmail?: string;
  description?: string;
}

export interface CreatePaymentIntentResponse {
  paymentId: string;
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
}
