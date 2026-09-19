import type { ActivityFilterType, BidFilterStatus, BidStatusInfo } from '../types/lotOperations.types';

export const CATEGORY_ELASTICITIES: Record<string, number> = {
  Dairy: -1.8,
  Produce: -2.2,
  Meat: -2.0,
  'Dry Goods': -1.2,
  Beverages: -1.5,
};

export const BID_STATUS_FILTERS: BidFilterStatus[] = [
  'All',
  'Pending',
  'Countered',
  'Awarded',
  'Declined',
];

export const ACTIVITY_FILTERS: ActivityFilterType[] = [
  'all',
  'Email',
  'Call',
  'Meeting',
  'Note',
];

export const ACTIVITY_FORM_TYPES = [
  { value: 'Email', label: '📧 Email' },
  { value: 'Call', label: '📞 Call' },
  { value: 'Meeting', label: '🤝 Meeting' },
  { value: 'Note', label: '📝 Note' },
];

export const DEFAULT_BID_STATUS_INFO: Record<string, BidStatusInfo> = {
  countered: {
    label: 'Countered',
    key: 'Countered',
    className: 'badge-outline-primary',
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  awarded: {
    label: 'Awarded',
    key: 'Awarded',
    className: 'badge-success',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  declined: {
    label: 'Declined',
    key: 'Declined',
    className: 'badge-danger',
    bg: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  buyer_countered: {
    label: 'Buyer Countered',
    key: 'Buyer Countered',
    className: 'badge-indigo',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366f1',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  pending: {
    label: 'Pending',
    key: 'Pending',
    className: 'badge-warning',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
  },
};
