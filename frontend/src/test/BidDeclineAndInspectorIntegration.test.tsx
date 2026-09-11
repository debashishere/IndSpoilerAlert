import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setInventoryList, setSelectedLotHubId, setLotHubSubTab, setLotHubData } from '../store/slices/inventorySlice';
import { setActiveTab } from '../store/slices/coreSlice';
import LotOperationsHubView from '../components/LotOperationsHubView';
import { InventoryService } from '../services/inventoryService';

describe('Frontend Seam B: Bid Action Inspector & Decline Flow Integration (Issue #02)', () => {
  const dummyLot = {
    _id: 'lot-hub-bids-99',
    lotNumber: 'LOT-99',
    status: 'active',
    quantityCases: 300,
    availableQty: 300,
    costPerCase: 3.50,
    standardSellPrice: 6.00,
    productId: {
      _id: 'prod-99',
      sku: 'SKU-APPLES',
      description: 'Organic Honeycrisp Apples'
    }
  };

  const initialBids = [
    {
      _id: 'bid-test-1',
      lotId: 'lot-hub-bids-99',
      buyerId: {
        _id: 'buyer-test-1',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 4.20,
      quantity: 150,
      status: 'pending',
      submittedAt: '2026-09-08T10:00:00.000Z'
    }
  ];

  beforeEach(() => {
    store.dispatch(setInventoryList([dummyLot]));
    store.dispatch(setSelectedLotHubId('lot-hub-bids-99'));
    store.dispatch(setLotHubSubTab('bids'));
    store.dispatch(setActiveTab('lot-hub'));
    store.dispatch(setLotHubData({ bidsList: initialBids, negotiationBids: initialBids }));
    vi.restoreAllMocks();
  });

  it('opens Bid Action Inspector modal when bid row is clicked, executes decline flow, shows feedback toast, and updates bid row badge to Declined', async () => {
    const declineSpy = vi.spyOn(InventoryService, 'declineBid').mockResolvedValueOnce({
      _id: 'bid-test-1',
      status: 'rejected'
    });

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Initial status: filter tab + row badge both display Pending
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(2);

    // Click bid row to open inspector
    fireEvent.click(screen.getByText('Apex Liquidators'));

    // Inspector modal opens
    expect(await screen.findByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Switch to Decline Offer mode
    const declineTabBtn = screen.getByRole('button', { name: /decline offer/i });
    fireEvent.click(declineTabBtn);

    // Select reason
    const reasonSelect = screen.getByLabelText(/Decline Reason/i);
    fireEvent.change(reasonSelect, {
      target: { value: 'Price below minimum recovery floor' }
    });

    // Enter rationale notes
    const notesInput = screen.getByPlaceholderText(/Add specific rationale or notes/i);
    fireEvent.change(notesInput, {
      target: { value: 'Counter-floor is $5.00/cs minimum.' }
    });

    // Confirm decline
    const confirmBtn = screen.getByRole('button', { name: /confirm decline/i });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    // Verify decline API call
    await waitFor(() => {
      expect(declineSpy).toHaveBeenCalledWith(
        'bid-test-1',
        'Price below minimum recovery floor',
        'Counter-floor is $5.00/cs minimum.'
      );
    });

    // Toast feedback appears
    expect(await screen.findByText(/Offer declined/i)).toBeInTheDocument();

    // Badge in the table updates to Declined (now filter tab + row badge both display Declined)
    await waitFor(() => {
      expect(screen.getAllByText('Declined').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('allows adaptive lifecycle reset of a declined bid back to pending', async () => {
    const resetSpy = vi.spyOn(InventoryService, 'resetBid').mockResolvedValueOnce({
      _id: 'bid-test-1',
      status: 'pending'
    });

    // Start with rejected bid
    const rejectedBids = [
      {
        ...initialBids[0],
        status: 'rejected'
      }
    ];
    store.dispatch(setLotHubData({ bidsList: rejectedBids, negotiationBids: rejectedBids }));

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    expect(screen.getAllByText('Declined').length).toBeGreaterThanOrEqual(2);

    // Click bid row to open inspector
    fireEvent.click(screen.getByText('Apex Liquidators'));

    // Inspector modal opens
    expect(await screen.findByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Reset button is visible
    const resetBtn = screen.getByRole('button', { name: /reset bid to pending/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith('bid-test-1');
    });

    // Badge updates back to Pending
    await waitFor(() => {
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('enforces In-Situ Continuity in LotOperationsHubView: keeps inspector open upon counter dispatch and updates parent bids state in the background', async () => {
    const renegotiateSpy = vi.spyOn(InventoryService, 'renegotiateBid').mockResolvedValueOnce({
      _id: 'bid-test-1',
      status: 'countered',
      price: 4.20,
      quantity: 150,
      messages: [
        {
          sender: 'supplier',
          content: 'Margin floor counter proposal.',
          proposedPrice: 4.75,
          proposedQuantity: 120,
          timestamp: '2026-09-08T11:00:00.000Z'
        }
      ]
    });

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Open inspector
    fireEvent.click(screen.getByText('Apex Liquidators'));
    expect(await screen.findByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Switch to Re-negotiate / Counter tab
    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);
    const messageInput = screen.getByPlaceholderText(/explain your counter-offer parameters/i);

    fireEvent.change(priceInput, { target: { value: '4.75' } });
    fireEvent.change(quantityInput, { target: { value: '120' } });
    fireEvent.change(messageInput, { target: { value: 'Margin floor counter proposal.' } });

    const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
    fireEvent.click(dispatchBtn);

    // Verify renegotiateBid API call
    await waitFor(() => {
      expect(renegotiateSpy).toHaveBeenCalledWith(
        'bid-test-1',
        4.75,
        120,
        expect.stringContaining('Margin floor counter proposal.')
      );
    });

    // In-Situ Continuity: Inspector modal MUST REMAIN OPEN!
    expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Modal status badge updates to Countered
    await waitFor(() => {
      expect(screen.getByTestId('modal-status-badge')).toHaveTextContent(/countered/i);
    });

    // Parent toast feedback is shown
    expect(await screen.findByText(/Counter-offer dispatched/i)).toBeInTheDocument();

    // Redux store bidsList is updated in background
    const currentBids = store.getState().inventory.lotHubData.bidsList;
    expect(currentBids.find((b: any) => b._id === 'bid-test-1')?.status).toBe('countered');
  });

  it('displays warning toast in LotOperationsHubView when email dispatch transport fails', async () => {
    vi.spyOn(InventoryService, 'renegotiateBid').mockResolvedValueOnce({
      _id: 'bid-test-1',
      status: 'countered',
      price: 4.20,
      quantity: 150,
      emailDispatch: {
        dispatched: false,
        warning: 'Google OAuth token expired'
      },
      messages: [
        {
          sender: 'supplier',
          content: 'Counter proposal under disconnected SMTP.',
          proposedPrice: 4.80,
          proposedQuantity: 100,
          timestamp: '2026-09-08T11:00:00.000Z'
        }
      ]
    });

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Open inspector
    fireEvent.click(screen.getByText('Apex Liquidators'));
    expect(await screen.findByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Switch to Re-negotiate / Counter tab
    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);
    fireEvent.change(priceInput, { target: { value: '4.80' } });
    fireEvent.change(quantityInput, { target: { value: '100' } });

    const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
    fireEvent.click(dispatchBtn);

    // Warning feedback toast is shown with delivery telemetry details
    expect(await screen.findByText(/email dispatch warning: Google OAuth token expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();
  });

  it('executes accept flow from LotOperationsHubView, invokes InventoryService.acceptBid, updates lot available quantity, and shows success toast', async () => {
    const acceptSpy = vi.spyOn(InventoryService, 'acceptBid').mockResolvedValueOnce({
      _id: 'bid-test-1',
      status: 'fully_accepted',
      awardedQty: 150,
      dealId: 'deal-999',
      dealToken: 'mock-deal-token',
      emailDispatch: {
        dispatched: true,
        messageId: 'msg-acc-1'
      }
    });

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Open inspector
    fireEvent.click(screen.getByText('Apex Liquidators'));
    expect(await screen.findByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // In Accept Offer mode by default, click Confirm & Initiate Settlement
    const confirmBtn = screen.getByRole('button', { name: /confirm & initiate settlement/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith('bid-test-1', expect.objectContaining({
        awardedQuantity: 150,
        pickupAddress: expect.any(String),
        pickupHours: expect.any(String),
        templateHtml: expect.any(String)
      }));
    });

    // Success toast shown
    expect(await screen.findByText(/Offer successfully accepted \(150 cases awarded\)/i)).toBeInTheDocument();
  });
});
