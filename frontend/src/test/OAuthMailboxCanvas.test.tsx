import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Issue #72: Campaign Studio Entry Invariant & Mailbox Connection Canvas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Mailbox Connection Canvas when OAuth status is missing', async () => {
    // Mock the hook to return missing
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

    // The studio builder tabs should NOT be visible
    expect(screen.queryByText('Campaign Builder')).not.toBeInTheDocument();
    
    // The Canvas should be visible
    expect(screen.getByText('Connect Your Mailbox to Build Campaigns')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Mailbox/i })).toBeInTheDocument();
  });

  it('renders Campaign Builder normally when OAuth status is connected', async () => {
    // Mock the hook to return connected
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

    // The Canvas should NOT be visible
    expect(screen.queryByText('Connect Your Mailbox to Build Campaigns')).not.toBeInTheDocument();
    
    // The studio builder tabs should be visible
    expect(screen.getByText('Campaign Builder')).toBeInTheDocument();
  });

  it('triggers connectMailbox when the Connect Mailbox button is clicked', async () => {
    const mockConnect = vi.fn();
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      status: 'missing',
      loading: false,
      connectMailbox: mockConnect,
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    const btn = screen.getByRole('button', { name: /Connect Mailbox/i });
    fireEvent.click(btn);
    
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });
});
