import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { coreSlice, type Buyer } from '../store/slices/coreSlice';
import networkService from '../services/networkService';
import { BuyerDetailDrawer } from '../components/domain/ingestion/BuyerDetailDrawer';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      core: coreSlice.reducer,
    },
    preloadedState: {
      core: {
        activeTab: 'ingestion',
        sidebarExpanded: false,
        backendHealthy: true,
        sidecarHealthy: true,
        suppliers: [],
        buyers: [],
        buyerLists: [
          { _id: 'l1', name: 'Primary Retailers', type: 'primary', buyerIds: ['b1'] },
          { _id: 'l2', name: 'Secondary Outlet', type: 'secondary', buyerIds: [] },
          { _id: 'l3', name: 'Custom North', type: 'custom', buyerIds: ['b1'] },
        ],
        loading: false,
        error: null,
        analyticsSummary: null,
        analyticsLoading: false,
        ...preloadedState,
      },
    },
  });
};

const mockBuyer: Buyer = {
  _id: 'b1',
  companyName: 'Acme Supermarket',
  email: 'acme@store.com',
  tier: 'tier1',
  isActive: true,
  optInBidding: true,
  optInSales: true,
  phone: '555-123-4567',
  address: '123 Main St, Boston, MA',
  notes: 'Key buyer for organic produce',
  acceptsShortDated: true,
  minShelfLife: 7,
  transportRadius: 50,
};

describe('02 — Buyer Detail Drawer Component', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.restoreAllMocks();
  });

  describe('Slice 1: Opening, Closing & Tab Navigation', () => {
    it('renders null or hidden state when isOpen is false or buyer is null', () => {
      const { rerender } = render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={false} onClose={vi.fn()} />
        </Provider>
      );
      expect(screen.queryByText('Acme Supermarket')).not.toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={null} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );
      expect(screen.queryByText('Acme Supermarket')).not.toBeInTheDocument();
    });

    it('renders drawer header and default Tab 1 (Profile & Settings) when open', () => {
      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      expect(screen.getByText('Acme Supermarket')).toBeInTheDocument();
      expect(screen.getByText('acme@store.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /profile & settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /communications/i })).toBeInTheDocument();
    });

    it('calls onClose when clicking close icon button or overlay backdrop', () => {
      const handleClose = vi.fn();
      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={handleClose} />
        </Provider>
      );

      const closeButton = screen.getByTestId('buyer-drawer-close-btn');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const overlay = screen.getByTestId('buyer-drawer-backdrop');
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('switches tabs when clicking Tab buttons', () => {
      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const commsTabBtn = screen.getByRole('button', { name: /communications/i });
      fireEvent.click(commsTabBtn);

      expect(screen.getByTestId('buyer-drawer-tab-communications')).toBeInTheDocument();

      const profileTabBtn = screen.getByRole('button', { name: /profile & settings/i });
      fireEvent.click(profileTabBtn);

      expect(screen.getByTestId('buyer-drawer-tab-profile')).toBeInTheDocument();
    });
  });

  describe('Slice 2: Profile & Settings Inline Edit & Opt-Out Controls', () => {
    it('saves updated profile fields to PUT /buyers/:id and updates store', async () => {
      const updateBuyerSpy = vi.spyOn(networkService, 'updateBuyer').mockResolvedValue({
        _id: 'b1',
        companyName: 'Acme Mega Store',
        email: 'acme-updated@store.com',
        phone: '555-999-0000',
      });

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const nameInput = screen.getByTestId('input-companyName');
      fireEvent.change(nameInput, { target: { value: 'Acme Mega Store' } });

      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'acme-updated@store.com' } });

      const phoneInput = screen.getByTestId('input-phone');
      fireEvent.change(phoneInput, { target: { value: '555-999-0000' } });

      const saveBtn = screen.getByTestId('save-profile-btn');
      fireEvent.click(saveBtn);

      expect(updateBuyerSpy).toHaveBeenCalledWith('b1', expect.objectContaining({
        companyName: 'Acme Mega Store',
        email: 'acme-updated@store.com',
        phone: '555-999-0000',
      }));

      expect(await screen.findByText('Buyer profile updated successfully')).toBeInTheDocument();
    });

    it('toggles optInBidding and optInSales pill toggles and displays skipped badge when OFF', async () => {
      const updateBuyerSpy = vi.spyOn(networkService, 'updateBuyer').mockResolvedValue({
        _id: 'b1',
        optInBidding: false,
      });

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      expect(screen.queryByTestId('badge-skipped-bidding')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-skipped-sales')).not.toBeInTheDocument();

      const biddingToggle = screen.getByTestId('toggle-opt-in-bidding');
      fireEvent.click(biddingToggle);

      expect(updateBuyerSpy).toHaveBeenCalledWith('b1', { optInBidding: false });
      expect(await screen.findByTestId('badge-skipped-bidding')).toBeInTheDocument();
    });
  });

  describe('Slice 3: List Memberships Grid', () => {
    it('renders all buyer lists with lock icon on system lists', () => {
      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      expect(screen.getByText('Primary Retailers')).toBeInTheDocument();
      expect(screen.getByText('Secondary Outlet')).toBeInTheDocument();
      expect(screen.getByText('Custom North')).toBeInTheDocument();

      // System lists should have lock icons
      expect(screen.getByTestId('lock-icon-l1')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon-l2')).toBeInTheDocument();
      expect(screen.queryByTestId('lock-icon-l3')).not.toBeInTheDocument();
    });

    it('toggling a buyer list checkbox calls updateBuyerListMembers and updates store', async () => {
      const updateListMembersSpy = vi.spyOn(networkService, 'updateBuyerListMembers').mockResolvedValue({
        _id: 'l2',
        name: 'Secondary Outlet',
        type: 'secondary',
        buyerIds: ['b1'],
      });

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const l2Checkbox = screen.getByTestId('checkbox-list-l2') as HTMLInputElement;
      expect(l2Checkbox.checked).toBe(false);

      fireEvent.click(l2Checkbox);

      expect(updateListMembersSpy).toHaveBeenCalledWith('l2', ['b1']);
    });
  });

  describe('Slice 4: Deactivation & Reactivation Flow', () => {
    it('deactivates active buyer with reason on confirm', async () => {
      const deactivateSpy = vi.spyOn(networkService, 'deactivateBuyer').mockResolvedValue({
        _id: 'b1',
        isActive: false,
        deactivatedReason: 'Store closing down',
        deactivatedAt: '2026-08-05T00:00:00Z',
      });

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const deactivateBtn = screen.getByTestId('deactivate-buyer-btn');
      fireEvent.click(deactivateBtn);

      const reasonInput = screen.getByTestId('input-deactivate-reason');
      fireEvent.change(reasonInput, { target: { value: 'Store closing down' } });

      const confirmBtn = screen.getByTestId('confirm-deactivate-btn');
      fireEvent.click(confirmBtn);

      expect(deactivateSpy).toHaveBeenCalledWith('b1', 'Store closing down');
    });

    it('renders inactive banner and reactivates inactive buyer', async () => {
      const inactiveBuyer: Buyer = {
        ...mockBuyer,
        isActive: false,
        deactivatedReason: 'Non-payment of invoices',
        deactivatedAt: '2026-07-01T00:00:00Z',
      };

      const reactivateSpy = vi.spyOn(networkService, 'reactivateBuyer').mockResolvedValue({
        _id: 'b1',
        isActive: true,
      });

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={inactiveBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      expect(screen.getByText(/Non-payment of invoices/)).toBeInTheDocument();

      const reactivateBtn = screen.getByTestId('reactivate-buyer-btn');
      fireEvent.click(reactivateBtn);

      expect(reactivateSpy).toHaveBeenCalledWith('b1');
    });
  });

  describe('Slice 5: Communications Tab', () => {
    it('fetches email threads by buyer email, truncates snippet, and shows unread indicator', async () => {
      const mockThreads = [
        {
          _id: 't1',
          subject: 'Weekly Q3 Purchase Order Inquiry',
          buyerEmail: 'acme@store.com',
          lastMessageSnippet: 'We would like to inquire about the upcoming short-dated organic produce lots available for immediate dispatch next Monday morning.',
          unread: true,
          updatedAt: '2026-08-04T10:00:00Z',
        },
      ];

      const getThreadsSpy = vi.spyOn(networkService, 'getEmailThreadsByBuyerEmail').mockResolvedValue(mockThreads as any);

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const commsTabBtn = screen.getByRole('button', { name: /communications/i });
      fireEvent.click(commsTabBtn);

      expect(getThreadsSpy).toHaveBeenCalledWith('acme@store.com');

      expect(await screen.findByText('Weekly Q3 Purchase Order Inquiry')).toBeInTheDocument();
      expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('open-in-hub-t1')).toBeInTheDocument();
    });

    it('renders empty state when no email threads exist for buyer', async () => {
      vi.spyOn(networkService, 'getEmailThreadsByBuyerEmail').mockResolvedValue([]);

      render(
        <Provider store={store}>
          <BuyerDetailDrawer buyer={mockBuyer} isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const commsTabBtn = screen.getByRole('button', { name: /communications/i });
      fireEvent.click(commsTabBtn);

      expect(await screen.findByTestId('comms-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No communication history found for this buyer.')).toBeInTheDocument();
    });
  });
});
