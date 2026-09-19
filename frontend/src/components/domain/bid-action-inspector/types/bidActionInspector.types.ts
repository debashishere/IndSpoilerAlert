export type InspectorMode = 'accept' | 'counter' | 'decline' | 'timeline';

export type TimelineCategoryFilter = 'all' | 'negotiations' | 'system' | 'status';

export type CommunicationChannel = 'email' | 'in-app' | 'sms';

export interface InSituToastData {
  message: string;
  type: 'success' | 'warning';
}

export type InSituToastState = InSituToastData | string | null;

export interface TimelineEvent {
  id: string;
  category: 'negotiations' | 'system' | 'status';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  referenceId: string;
}

export interface DeclinePayload {
  reason: string;
  rationale: string;
  templateHtml?: string;
  emailSubject?: string;
  autoRelist?: boolean;
}

export interface AcceptPayload {
  awardedQuantity: number;
  pickupAddress: string;
  pickupHours: string;
  templateHtml: string;
  pricePerCase?: number;
}

export interface CounterPayload {
  price: number;
  quantity: number;
  message: string;
}

export interface BidActionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: any;
  lot?: any;
  onDecline?: (payload: DeclinePayload) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onAccept?: (payload?: AcceptPayload) => Promise<any> | void;
  onCounter?: (counterData: CounterPayload) => Promise<any> | void;
  onResendSettlement?: (bidId: string) => Promise<any> | void;
  isSubmitting?: boolean;
}
