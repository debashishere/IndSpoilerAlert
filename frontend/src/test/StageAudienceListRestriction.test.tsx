import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WorkflowRunTimelineStepper, resolveStageBuyers } from '../components/WorkflowRunTimelineStepper';

describe('Workflow Stage Audience & Buyer List Restriction in Audit View', () => {
  // 50 mock buyers
  const mock50Buyers = Array.from({ length: 50 }, (_, i) => ({
    _id: `buyer-${i + 1}`,
    id: `buyer-${i + 1}`,
    name: `Buyer ${i + 1} Corp`,
    companyName: `Buyer ${i + 1} Corp`,
    email: `buyer${i + 1}@example.com`,
    tier: i % 2 === 0 ? 'tier1' : 'tier2'
  }));

  const mockBuyerListAbc = {
    _id: 'list-abc-123',
    name: 'abc buyer list',
    type: 'custom',
    buyerIds: ['buyer-5'] // Exactly 1 buyer
  };

  it('resolveStageBuyers resolves strictly 1 buyer when configured with buyerList containing 1 buyer out of 50', () => {
    const stageWithList = {
      stageNumber: 1,
      name: 'Stage 1: ABC Target',
      stageType: 'liquidation',
      buyerMode: 'list',
      buyerListId: 'list-abc-123',
      buyerListName: 'abc buyer list',
      waitHours: 24
    };

    const resolved = resolveStageBuyers(stageWithList, mock50Buyers, [mockBuyerListAbc]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('buyer-5');
    expect(resolved[0].name).toBe('Buyer 5 Corp');
    expect(resolved[0].email).toBe('buyer5@example.com');
  });

  it('renders "abc buyer list (1 Partner)" and only 1 contact row in Stage Audit Telemetry & Trace', () => {
    const mockRun = {
      _id: 'run-flow-9',
      status: 'evaluating',
      evaluatedBuyerIds: ['buyer-5'],
      buyerEmails: ['buyer5@example.com'],
      campaignSnapshot: {
        name: 'flow-9',
        stages: [
          {
            stageNumber: 1,
            name: 'Stage 1: ABC Target',
            stageType: 'liquidation',
            buyerMode: 'list',
            buyerListId: 'list-abc-123',
            buyerListName: 'abc buyer list',
            waitHours: 24
          }
        ]
      }
    };

    render(
      <WorkflowRunTimelineStepper
        run={mockRun}
        stages={mockRun.campaignSnapshot.stages}
        allBuyers={mock50Buyers}
        buyerLists={[mockBuyerListAbc]}
      />
    );

    // Verify stage card header shows target
    expect(screen.getByText('abc buyer list')).toBeInTheDocument();

    // Expand stage audit panel
    const stage1Card = screen.getByTestId('stage-step-1');
    const expandBtn = stage1Card.querySelector('[data-testid="expand-audit-btn"]');
    expect(expandBtn).toBeTruthy();
    fireEvent.click(expandBtn!);

    // Check Stage Audit Telemetry & Trace panel
    const auditPanel = screen.getByTestId('stage-audit-panel');
    expect(auditPanel).toBeInTheDocument();

    // Audience targeting section header badge
    const audienceBadge = within(auditPanel).getByTestId('stage-audience-header-badge');
    expect(audienceBadge).toHaveTextContent(/abc buyer list/i);
    expect(audienceBadge).toHaveTextContent(/1 Partner/i);
    expect(audienceBadge).not.toHaveTextContent(/50 Partners/i);

    // Expand contacts
    const toggleContactsBtn = within(auditPanel).getByTestId('toggle-contacts-btn');
    expect(toggleContactsBtn).toHaveTextContent(/View Contacts \(1\)/i);
    fireEvent.click(toggleContactsBtn);

    // Contact rows must contain ONLY 1 partner
    const contactRows = within(auditPanel).getAllByTestId('stage-audience-contact-row');
    expect(contactRows).toHaveLength(1);
    expect(within(contactRows[0]).getByText('Buyer 5 Corp')).toBeInTheDocument();
    expect(within(contactRows[0]).getByText('buyer5@example.com')).toBeInTheDocument();
  });

  it('restricts audience correctly when stage is configured with customBuyers', () => {
    const stageWithCustom = {
      stageNumber: 1,
      name: 'Stage 1: Custom VIP',
      stageType: 'liquidation',
      buyerMode: 'custom',
      customBuyers: [
        { id: 'buyer-12', name: 'VIP Buyer 12', email: 'vip12@example.com', tier: 'custom' }
      ],
      waitHours: 24
    };

    const resolved = resolveStageBuyers(stageWithCustom, mock50Buyers, [mockBuyerListAbc]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].name).toBe('VIP Buyer 12');
  });

  it('uses past execution evaluatedBuyerIds from run record when list doc is not available', () => {
    const stageWithUnloadedList = {
      stageNumber: 1,
      name: 'Stage 1: Historical Executed List',
      stageType: 'liquidation',
      buyerMode: 'list',
      buyerListId: 'historical-list-999',
      buyerListName: 'Old Buyer List',
      waitHours: 24
    };

    const historicalRun = {
      _id: 'run-hist-1',
      status: 'awarded',
      evaluatedBuyerIds: ['buyer-7'],
      buyerEmails: ['buyer7@example.com']
    };

    const resolved = resolveStageBuyers(stageWithUnloadedList, mock50Buyers, [], historicalRun);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('buyer-7');
    expect(resolved[0].name).toBe('Buyer 7 Corp');
  });
});
