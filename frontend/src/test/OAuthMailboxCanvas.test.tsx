import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import { WorkflowsView } from '../components/WorkflowsView';
import * as oauthHooks from '../hooks/useOAuthMailbox';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
    },
  });

describe('Workflows View - Unblocked Default SMTP Access', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders WorkflowsView normally when OAuth status is missing (using default SMTP)', async () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'missing',
      loading: false,
      connectMailbox: vi.fn(),
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Canvas blocking screen is not shown
    expect(screen.queryByText('Connect Your Mailbox to Build Campaigns')).not.toBeInTheDocument();
    // Liquidation Automations header is shown
    expect(screen.getByText('Liquidation Automations & Campaigns')).toBeInTheDocument();
  });

  it('renders Campaign Builder normally when OAuth status is connected', async () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'connected',
      loading: false,
      connectMailbox: vi.fn(),
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    expect(screen.queryByText('Connect Your Mailbox to Build Campaigns')).not.toBeInTheDocument();
    expect(screen.getByText('Liquidation Automations & Campaigns')).toBeInTheDocument();
  });
});
