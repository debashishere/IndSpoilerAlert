import type { NavigationTabConfig } from '../types/navigation.types';

export const PRIMARY_NAVIGATION_TABS: NavigationTabConfig[] = [
  {
    id: 'ingestion',
    label: 'Ingestion',
    iconName: 'database',
    badge: { type: 'pill', label: 'Active', className: 'bg-white/20 text-white' },
    targetRole: 'supplier',
  },
  {
    id: 'inventory',
    label: 'Insight',
    iconName: 'query_stats',
    targetRole: 'supplier',
  },
  {
    id: 'workflows',
    label: 'Workflow',
    iconName: 'account_tree',
    targetRole: 'supplier',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    iconName: 'notifications',
    targetRole: 'all',
  },
  {
    id: 'settings',
    label: 'Settings',
    iconName: 'settings',
    targetRole: 'all',
  },
];

export const BRAND_CONFIG = {
  name: 'IndSpoiler Alert',
  subtitle: 'Enterprise Liquidation OS',
  version: 'OS v4.2',
  nodeLabel: 'Northeast Hub Newark',
  nodeId: 'Node: NA-SOUTH-TX-HUB',
  auditTag: 'FSMA 204 Audited',
  securityTag: 'TLS 1.3 End-to-End',
};
