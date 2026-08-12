import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import workflowReducer from '../store/slices/workflowSlice';
import { SendBroadcastView } from '../components/SendBroadcastView';
import * as oauthHooks from '../hooks/useOAuthMailbox';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      workflow: workflowReducer,
    },
  });

describe('Slice 5: Send Broadcast Email Workspace & Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/emails/broadcast-preview')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            recipientCount: 5,
            totalCases: 250,
            previewSubject: 'Distressed Stock Clearance Offer for Test Buyer',
            previewBodyHtml: '<div>Compiled HTML Preview</div>'
          })
        });
      }
      if (url.includes('/emails/dispatch-broadcast')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            dispatchedCount: 5,
            message: 'Broadcast successfully dispatched to 5 buyers!'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  it('renders Send Broadcast Email tab button and shows status banner', async () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      mailbox: { status: 'connected', userEmail: 'supplier@ops.com' },
      loading: false,
      connecting: false,
      initiateOAuth: vi.fn(),
      disconnectMailbox: vi.fn(),
      fetchStatus: vi.fn()
    } as any);

    const store = createTestStore();

    render(
      <Provider store={store}>
        <SendBroadcastView supplierId="sup-101" />
      </Provider>
    );

    expect(screen.getByText('Send Broadcast Email')).toBeInTheDocument();
    expect(screen.getByText('OAuth Mailbox Authenticated & Connected')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Broadcast Email Now')).toBeInTheDocument();
  });

  it('dispatches campaign broadcast on button click when connected', async () => {
    vi.spyOn(oauthHooks, 'useOAuthMailbox').mockReturnValue({
      mailbox: { status: 'connected', userEmail: 'supplier@ops.com' },
      loading: false,
      connecting: false,
      initiateOAuth: vi.fn(),
      disconnectMailbox: vi.fn(),
      fetchStatus: vi.fn()
    } as any);

    const store = createTestStore();

    render(
      <Provider store={store}>
        <SendBroadcastView supplierId="sup-101" />
      </Provider>
    );

    const dispatchBtn = screen.getByRole('button', { name: /Dispatch Broadcast Email Now/i });
    fireEvent.click(dispatchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/emails/dispatch-broadcast'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByText(/Broadcast successfully dispatched to 5 buyers/i)).toBeInTheDocument();
    });
  });
});
