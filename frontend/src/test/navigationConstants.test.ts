import { describe, it, expect } from 'vitest';
import { PRIMARY_NAVIGATION_TABS } from '../components/navigation/constants/navigationConstants';

describe('Seam: PRIMARY_NAVIGATION_TABS configuration', () => {
  it('contains strictly the primary supplier tabs and excludes the legacy marketplace tab', () => {
    const tabIds = PRIMARY_NAVIGATION_TABS.map((tab) => tab.id);

    expect(tabIds).toEqual(['ingestion', 'inventory', 'workflows', 'inbox', 'settings']);
    expect(tabIds).not.toContain('marketplace');
  });

  it('maps operational tab labels correctly', () => {
    const tabMap = Object.fromEntries(PRIMARY_NAVIGATION_TABS.map((t) => [t.id, t.label]));

    expect(tabMap).toEqual({
      ingestion: 'Ingestion',
      inventory: 'Insight',
      workflows: 'Workflow',
      inbox: 'Inbox',
      settings: 'Settings',
    });
  });
});
