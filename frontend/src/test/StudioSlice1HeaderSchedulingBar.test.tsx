import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import {
  StudioHeaderSchedulingBar,
  useWorkflowStudio,
  compileFrontendCron,
  format12HourTime,
  formatWaitTime,
  TEMPLATE_DEFINITIONS
} from '../components/domain/workflows/studio';

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
          { _id: 'primary', name: 'Primary Retail Tiers', type: 'primary', buyerIds: ['b1'] },
          { _id: 'secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: ['b2'] }
        ],
        buyers: [
          { _id: 'b1', name: 'Primary Retailer', email: 'b1@buyer.com', tier: 'tier1' },
          { _id: 'b2', name: 'Secondary Liquidator', email: 'b2@liquidator.com', tier: 'secondary' }
        ],
        loading: false,
        error: null
      },
      workflow: {
        workflowSubTab: 'builder',
        automationRuns: [],
        liquidationAutomations: [],
        runsFilter: 'all',
        showRunDetailsModal: false,
        selectedRunDetails: null,
        editingCampaignId: null,
        loading: false
      },
      inventory: {
        inventoryList: [
          { _id: 'lot-1', lotNumber: 'LOT-101', sku: 'SKU-881', description: 'Fresh Apples', availableQty: 200, rsl: 0.15 }
        ],
        lotHubData: { bidsList: [] },
        loading: false
      }
    }
  });

describe('Slice 1: Shell, Header & Scheduling Engine (Modular Tracer Bullet)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pure Calculation Utilities', () => {
    it('compiles cron expression correctly from time and days of week', () => {
      expect(compileFrontendCron('09:00', [1])).toBe('0 9 * * 1');
      expect(compileFrontendCron('14:30', [1, 3, 5])).toBe('30 14 * * 1,3,5');
      expect(compileFrontendCron('02:15 PM', [2, 4])).toBe('15 14 * * 2,4');
      expect(compileFrontendCron('12:00 AM', [0])).toBe('0 0 * * 0');
    });

    it('formats 12-hour time correctly', () => {
      expect(format12HourTime('09:00')).toBe('9:00 AM');
      expect(format12HourTime('15:45')).toBe('3:45 PM');
      expect(format12HourTime('00:00')).toBe('12:00 AM');
      expect(format12HourTime('12:30')).toBe('12:30 PM');
    });

    it('formats wait time duration accurately', () => {
      expect(formatWaitTime(24)).toBe('1d');
      expect(formatWaitTime(48)).toBe('2d');
      expect(formatWaitTime(0.5)).toBe('30m');
      expect(formatWaitTime(2)).toBe('2h');
    });
  });

  describe('Headless useWorkflowStudio Hook', () => {
    it('initializes default campaign state and allows updating campaign name', () => {
      const store = createMockStore();
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () =>
          useWorkflowStudio({
            supplierId: 'sup-101',
            inventoryLots: [{ _id: 'lot-1', availableQty: 100, remainingShelfLife: 0.1 }],
            buyers: [{ _id: 'b1', name: 'Buyer 1' }],
          }),
        { wrapper }
      );

      expect(result.current.workflowName).toBe('Untitled Workflow');
      expect(result.current.executionType).toBe('immediate');

      act(() => {
        result.current.setWorkflowName('Custom Q3 Surplus Surge');
      });

      expect(result.current.workflowName).toBe('Custom Q3 Surplus Surge');
    });

    it('updates filters and stages when selecting a strategy template preset', () => {
      const store = createMockStore();
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () =>
          useWorkflowStudio({
            supplierId: 'sup-101',
            inventoryLots: [],
            buyers: [],
          }),
        { wrapper }
      );

      const categoryTemplate = TEMPLATE_DEFINITIONS.find(t => t.key === 'category_liquidation')!;
      act(() => {
        result.current.handleSelectTemplate('category_liquidation');
      });

      expect(result.current.selectedTemplateKey).toBe('category_liquidation');
      expect(result.current.categoryFilter).toBe(categoryTemplate.defaultFilters.category);
      expect(result.current.maxRslFilter).toBe(categoryTemplate.defaultFilters.maxRsl);
    });
  });

  describe('StudioHeaderSchedulingBar Component', () => {
    const TestHeaderContainer: React.FC<{ editingCampaignId?: string | null }> = ({
      editingCampaignId = null,
    }) => {
      const studio = useWorkflowStudio({
        supplierId: 'sup-101',
        editingCampaignId,
        inventoryLots: [{ _id: 'lot-1', availableQty: 50, remainingShelfLife: 0.1 }],
        buyers: [{ _id: 'b1', tier: 'tier1' }],
      });
      return (
        <StudioHeaderSchedulingBar
          studio={studio}
          editingCampaignId={editingCampaignId}
          onCancel={vi.fn()}
        />
      );
    };

    it('renders workflow name input with proper styling and handles changes', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <TestHeaderContainer />
        </Provider>
      );

      const input = screen.getByTestId('workflow-name-input');
      expect(input).toBeInTheDocument();
      expect(input.style.color).toContain('var(--text-primary)');

      fireEvent.change(input, { target: { value: 'New Test Campaign' } });
      expect(input).toHaveValue('New Test Campaign');
    });

    it('renders execution mode toggle and interacts with schedule popover', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <TestHeaderContainer />
        </Provider>
      );

      const runNowBtn = screen.getByRole('button', { name: /Run Now/i });
      const scheduledBtn = screen.getByRole('button', { name: /Scheduled/i });

      expect(runNowBtn).toBeInTheDocument();
      expect(scheduledBtn).toBeInTheDocument();

      // Open popover
      fireEvent.click(scheduledBtn);
      expect(screen.getByText('Configure Schedule')).toBeInTheDocument();

      // Click a day button (e.g. Wednesday 'We')
      const weBtn = screen.getByRole('button', { name: 'We' });
      fireEvent.click(weBtn);

      // Close via Apply
      const applyBtn = screen.getByRole('button', { name: /Apply Schedule/i });
      fireEvent.click(applyBtn);

      expect(screen.queryByText('Configure Schedule')).not.toBeInTheDocument();
    });

    it('renders editing banner when editingCampaignId is present', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <TestHeaderContainer editingCampaignId="camp-999" />
        </Provider>
      );

      expect(screen.getByText(/Editing Saved Campaign Strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: camp-999/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear & Start New Campaign/i })).toBeInTheDocument();
    });

    it('renders strategy template preset dropdown and logic flow stepper', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <TestHeaderContainer />
        </Provider>
      );

      expect(screen.getByText(/1. Sales Cycle & Workflow Template/i)).toBeInTheDocument();
      expect(screen.getByText(/Sales Strategy Template/i)).toBeInTheDocument();
      expect(screen.getByText(/Logic Flow:/i)).toBeInTheDocument();
    });
  });
});
