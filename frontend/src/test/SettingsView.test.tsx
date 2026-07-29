import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import { SettingsView } from '../views/SettingsView';
import { EmailCommunicationsView } from '../views/EmailCommunicationsView';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
    },
  });

describe('Settings UI Clean-up & Platform Configuration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Central Platform Settings header and non-email platform setting tabs', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsView supplierId="sup-101" initialSubTab="profile" />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /Central Platform Settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supplier Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Platform Prefs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security & Access/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /System Defaults/i })).toBeInTheDocument();

    // Legacy email tabs should NOT exist in Settings
    expect(screen.queryByRole('button', { name: /^Mails$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mailbox & Identity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send Direct Email/i })).not.toBeInTheDocument();
  });

  it('renders Supplier Profile section details and account actions', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsView supplierId="sup-101" initialSubTab="profile" />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /Supplier Identity & Profile/i })).toBeInTheDocument();
    expect(screen.getAllByText('sup-101')[0]).toBeInTheDocument();
    expect(screen.getByText(/Revoke all active quick-bid tokens/i)).toBeInTheDocument();
  });

  it('renders Platform Preferences and toggles settings', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsView supplierId="sup-101" initialSubTab="platform" />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /Platform Preferences/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Token Expiry/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Preferences/i })).toBeInTheDocument();
  });
});

describe('Inbox View & Direct Email Dispatch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([])
    } as any);
  });

  it('renders Inbox Workspace and opens Send Direct Email modal without Create Thread option', async () => {
    render(<EmailCommunicationsView supplierId="sup-101" accountName="Unilever Operations" emailAddress="ops@unilever.com" />);

    expect(screen.getByRole('heading', { name: /Inbox Workspace/i })).toBeInTheDocument();
    expect(screen.getByTestId('inbox-account-name')).toHaveTextContent('Unilever Operations');
    expect(screen.getByTestId('inbox-email-address')).toHaveTextContent('ops@unilever.com');
    expect(screen.queryByRole('button', { name: /Create Thread/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New Thread/i })).not.toBeInTheDocument();

    const sendEmailBtn = screen.getByRole('button', { name: /Send Email/i });
    expect(sendEmailBtn).toBeInTheDocument();

    fireEvent.click(sendEmailBtn);

    expect(await screen.findByRole('heading', { name: /Send Direct Email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/To \(Recipient Email\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject Line/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message Body/i)).toBeInTheDocument();
  });

  it('fetches SMTP configuration and renders account name and email address dynamically', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/settings/smtp')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            configured: true,
            senderName: 'Acme Corp Mailbox',
            senderEmail: 'support@acmecorp.com'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ([])
      });
    }) as any;

    render(<EmailCommunicationsView supplierId="sup-202" />);

    expect(await screen.findByTestId('inbox-account-name')).toHaveTextContent('Acme Corp Mailbox');
    expect(screen.getByTestId('inbox-email-address')).toHaveTextContent('support@acmecorp.com');
  });

  it('renders sent emails filter button and filters threads with outbound supplier messages', async () => {
    const mockThreads = [
      {
        threadId: 'th-1',
        supplierId: 'sup-101',
        buyerEmail: 'buyer1@ethereal.email',
        subject: 'Offer for Dairy Lot',
        status: 'active',
        openCount: 2,
        messages: [{ messageId: 'm1', senderType: 'supplier', senderEmail: 'ops@unilever.com', body: 'Dispatched offer', sentAt: '2026-08-01T12:00:00Z' }],
        updatedAt: '2026-08-01T12:00:00Z',
        createdAt: '2026-08-01T12:00:00Z'
      },
      {
        threadId: 'th-2',
        supplierId: 'sup-101',
        buyerEmail: 'buyer2@ethereal.email',
        subject: 'Inquiry on Ketchup',
        status: 'active',
        openCount: 0,
        messages: [{ messageId: 'm2', senderType: 'buyer', senderEmail: 'buyer2@ethereal.email', body: 'Is this lot available?', sentAt: '2026-08-01T12:00:00Z' }],
        updatedAt: '2026-08-01T12:00:00Z',
        createdAt: '2026-08-01T12:00:00Z'
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/email-threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThreads
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    }) as any;

    render(<EmailCommunicationsView supplierId="sup-101" />);

    expect(await screen.findByText('buyer1@ethereal.email')).toBeInTheDocument();
    expect(screen.getByText('buyer2@ethereal.email')).toBeInTheDocument();

    const sentFilterBtn = screen.getByRole('button', { name: /sent/i });
    expect(sentFilterBtn).toBeInTheDocument();

    fireEvent.click(sentFilterBtn);

    expect(screen.getByText('buyer1@ethereal.email')).toBeInTheDocument();
    expect(screen.queryByText('buyer2@ethereal.email')).not.toBeInTheDocument();
  });

  it('opens 3-dot action menu on a thread card and renders TelemetryModal', async () => {
    const mockThreads = [
      {
        threadId: 'th-100',
        supplierId: 'sup-101',
        buyerEmail: 'buyer100@ethereal.email',
        subject: 'Telemetry Test Thread',
        status: 'active',
        openCount: 5,
        firstOpenedAt: '2026-08-01T10:00:00Z',
        lastOpenedAt: '2026-08-01T11:00:00Z',
        messages: [{ messageId: 'm100', senderType: 'supplier', senderEmail: 'ops@unilever.com', body: 'Telemetry sample message', sentAt: '2026-08-01T09:00:00Z' }],
        updatedAt: '2026-08-01T11:00:00Z',
        createdAt: '2026-08-01T09:00:00Z'
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/email-threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThreads
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    }) as any;

    render(<EmailCommunicationsView supplierId="sup-101" />);

    expect(await screen.findByText('buyer100@ethereal.email')).toBeInTheDocument();

    const dotsBtn = screen.getByTestId('thread-actions-th-100');
    expect(dotsBtn).toBeInTheDocument();

    fireEvent.click(dotsBtn);

    const telemetryBtn = await screen.findByText('TELEMETRY');
    expect(telemetryBtn).toBeInTheDocument();

    fireEvent.click(telemetryBtn);

    expect(await screen.findByTestId('telemetry-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Email Telemetry & Open Audit/i })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
