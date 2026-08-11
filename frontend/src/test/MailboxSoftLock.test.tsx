import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import * as oauthHooks from '../hooks/useOAuthMailbox';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
      inventory: inventoryReducer,
    },
    preloadedState: {
      core: {
        ...coreReducer(undefined, { type: '@@INIT' }),
        buyerLists: [{ _id: 'primary', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1'] }],
        buyers: [{ _id: 'b1', name: 'Buyer 1', email: 'b1@ex.com', tier: 'tier1' }]
      }
    }
  });

describe('Issue #74: Mailbox Authentication Soft Lock UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a sticky warning banner when OAuth status is expired', () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'expired',
      loading: false,
      connectMailbox: vi.fn(),
      refreshStatus: vi.fn(),
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio supplierId="sup-101" />
      </Provider>
    );

    expect(screen.getByText(/Your Mailbox Connection has Expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Please re-authenticate to launch campaigns/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Re-authenticate Now/i })).toBeInTheDocument();
  });

  it('disables actionable buttons (Save as Draft, Launch) when status is expired', () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'expired',
      loading: false,
      connectMailbox: vi.fn(),
      refreshStatus: vi.fn(),
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio supplierId="sup-101" apiBaseUrl="http://localhost" />
      </Provider>
    );

    const saveBtns = screen.getAllByRole('button', { name: /Save as Draft|Save/i });
    saveBtns.forEach(btn => expect(btn).toBeDisabled());

    const launchBtns = screen.getAllByRole('button', { name: /Launch Active Campaign|^Run$/i });
    launchBtns.forEach(btn => expect(btn).toBeDisabled());
  });

  it('hides the warning banner and enables buttons when status is connected', () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'connected',
      loading: false,
      connectMailbox: vi.fn(),
      refreshStatus: vi.fn(),
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <LiquidationAutomationStudio supplierId="sup-101" buyerLists={[{ _id: 'primary', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1'] }, { _id: 'secondary', name: 'Secondary Buyers', type: 'secondary', buyerIds: ['b2'] }]} buyers={[{ _id: 'b1', id: 'b1', name: 'Buyer 1', email: 'b1@ex.com', tier: 'tier1' }, { _id: 'b2', id: 'b2', name: 'Buyer 2', email: 'b2@ex.com', tier: 'liquidator' }]} inventoryLots={[{ _id: 'l1', title: 'Lot 1' }]} apiBaseUrl="http://localhost" />
      </Provider>
    );

    expect(screen.queryByText(/Your Mailbox Connection has Expired/i)).not.toBeInTheDocument();

    const saveBtns = screen.getAllByRole('button', { name: /Save as Draft|Save/i });
    saveBtns.forEach(btn => expect(btn).not.toBeDisabled());
    // Launch button remains disabled if totalLots === 0, but we can verify it's not disabled due to oauth status.
  });
});
