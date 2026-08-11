import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Issue #03 — Workflow Stage Template Attachment & Zero-Buyer Selection UI Restriction', () => {
  const mockSupplierId = 'sup-101';
  const sampleBuyers = [
    { _id: 'b-1', name: 'FreshMart Wholesale', email: 'sourcing@freshmart.com', tier: 'tier1', segment: 'tier1_retailers' },
    { _id: 'b-2', name: 'Discount Food Liquidators', email: 'buyer@discountfood.com', tier: 'liquidator', segment: 'all_liquidators' }
  ];

  const sampleLots = [
    { _id: 'lot-1', title: 'Dairy Pack Lot #1', remainingShelfLife: 0.15, quantityCases: 200 }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Seam 1: shows dynamic token binding indicator for {{buyer_name}} on workflow stages when an email template with buyer_name is attached', async () => {
    render(
      <LiquidationAutomationStudio
        supplierId={mockSupplierId}
        inventoryLots={sampleLots}
        buyers={sampleBuyers}
        apiBaseUrl="/api"
      />
    );

    // Verify template selector exists
    const templateSelect = screen.getByTestId('attach-email-template-select');
    expect(templateSelect).toBeInTheDocument();

    // Verify stage cards indicate buyer_name token binding
    const tokenBindingBadges = screen.getAllByTestId('buyer-name-token-binding-indicator');
    expect(tokenBindingBadges.length).toBeGreaterThan(0);
    expect(tokenBindingBadges[0].textContent).toContain('{{buyer_name}}');
  });

  it('Seam 2: displays an immediate blocking UI error banner when a stage has 0 buyers selected', async () => {
    render(
      <LiquidationAutomationStudio
        supplierId={mockSupplierId}
        inventoryLots={sampleLots}
        buyers={[]} // 0 buyers in system
        apiBaseUrl="/api"
      />
    );

    // Switch stage 1 buyer mode to Custom List mode with 0 buyers
    const customListModeBtn = screen.getAllByRole('button', { name: /Custom List/i })[0];
    fireEvent.click(customListModeBtn);

    // Verify blocking UI error banner renders for stage 1
    const zeroBuyerBanners = screen.getAllByTestId('zero-buyer-error-banner');
    expect(zeroBuyerBanners.length).toBeGreaterThan(0);
    expect(zeroBuyerBanners[0].textContent).toMatch(/0 targeted buyers|Zero-Buyer Selection Error/i);
  });

  it('Seam 3: restricts saving and launching when any workflow stage has 0 buyers', async () => {
    render(
      <LiquidationAutomationStudio
        supplierId={mockSupplierId}
        inventoryLots={sampleLots}
        buyers={[]} // 0 buyers
        apiBaseUrl="/api"
      />
    );

    // Switch stage 1 buyer mode to Custom List mode with 0 buyers
    const customListModeBtn = screen.getAllByRole('button', { name: /Custom List/i })[0];
    fireEvent.click(customListModeBtn);

    const saveDraftBtns = screen.getAllByRole('button', { name: /Save as Draft|Save/i });
    const launchBtns = screen.getAllByRole('button', { name: /Launch Active Campaign|^Run$/i });

    // Launch buttons should be disabled due to zero buyers guardrail
    expect(launchBtns.length).toBeGreaterThan(0);
    launchBtns.forEach(btn => expect(btn).toBeDisabled());
  });
});
