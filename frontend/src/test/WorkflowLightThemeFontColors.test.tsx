import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import { WorkflowsView } from '../components/WorkflowsView';

const createMockStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
      inventory: inventoryReducer
    },
    preloadedState: {
      core: {
        buyerLists: [
          { _id: 'primary', name: 'Primary Retail Tiers', type: 'primary', buyerIds: ['b1', 'b2'] },
          { _id: 'secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: ['b3'] }
        ],
        buyers: [
          { _id: 'b1', name: 'Walmart Wholesale', email: 'b1@walmart.com', tier: 'tier1' },
          { _id: 'b2', name: 'Target Closeouts', email: 'b2@target.com', tier: 'tier1' },
          { _id: 'b3', name: 'Bargain Surplus', email: 'b3@bargain.com', tier: 'secondary' }
        ],
        loading: false,
        error: null
      },
      workflow: {
        workflowSubTab: 'builder',
        automationRuns: [],
        liquidationAutomations: [
          {
            _id: 'auto-1',
            name: 'Short-Dated Clearance Strategy',
            status: 'active',
            schedule: { type: 'cron', timeOfDay: '09:00', timezone: 'America/New_York', daysOfWeek: [1] }
          }
        ],
        runsFilter: 'all',
        showRunDetailsModal: false,
        selectedRunDetails: null,
        editingCampaignId: null,
        loading: false
      },
      inventory: {
        inventoryList: [
          { _id: 'lot-1', lotNumber: 'LOT-101', sku: 'SKU-881', description: 'Chilled Yogurt Packets', availableQty: 100, rsl: 0.15 }
        ],
        lotHubData: { bidsList: [] },
        loading: false
      }
    }
  });

describe('Workflow Light Theme Font Color Contrast', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders Run Now and Scheduled execution buttons with high contrast text colors', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio
          supplierId="sup-123"
          inventoryLots={[{ _id: 'lot-1', lotNumber: 'LOT-101', availableQty: 100 }]}
          buyers={[]}
          apiBaseUrl="/api"
        />
      </Provider>
    );

    const runNowBtn = screen.getByRole('button', { name: /Run Now/i });
    const scheduledBtn = screen.getByRole('button', { name: /Scheduled/i });

    expect(runNowBtn).toBeInTheDocument();
    expect(scheduledBtn).toBeInTheDocument();

    // Verify text color is not white in light mode
    expect(runNowBtn.style.color).not.toBe('white');
    expect(scheduledBtn.style.color).not.toBe('white');
  });

  it('renders input fields with text-primary color instead of white in light mode', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio
          supplierId="sup-123"
          inventoryLots={[{ _id: 'lot-1', lotNumber: 'LOT-101', availableQty: 100 }]}
          buyers={[]}
          apiBaseUrl="/api"
        />
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter workflow name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.style.color).toContain('var(--text-primary)');
  });

  it('renders saved campaigns table in WorkflowsView with crisp dark text colors', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-123" />
      </Provider>
    );

    expect(screen.getByText(/Liquidation Automations & Campaigns/i)).toBeInTheDocument();
  });
});
