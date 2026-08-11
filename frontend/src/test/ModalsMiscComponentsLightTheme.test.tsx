import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import authReducer from '../store/slices/authSlice';
import { QuickBidModal } from '../components/QuickBidModal';
import { BuyerBidModal } from '../components/domain/marketplace/BuyerBidModal';
import { SmartAudienceLotSelector } from '../components/SmartAudienceLotSelector';
import { BuyerListManagerModal } from '../components/domain/ingestion/BuyerListManagerModal';
import { LiveDevicePreview } from '../components/LiveDevicePreview';
import { InteractiveTour } from '../components/InteractiveTour';

function createMockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      core: coreReducer,
      auth: authReducer,
    },
    preloadedState,
  });
}

describe('Issue 09 — Modals & Misc Components Light Theme', () => {

  describe('1. QuickBidModal Light Theme', () => {
    it('renders QuickBidModal dialog with light mode background, border, text, and inputs', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/bids/quick-bid-info')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              buyerEmail: 'buyer@test.com',
              listingId: 'LIST-100',
              defaultAmount: 15.00
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }));

      render(<QuickBidModal token="test-token" onClose={vi.fn()} />);

      const heading = await screen.findByText('1-Click Buyer Quick Bid');
      expect(heading).toBeInTheDocument();
      expect(heading.className).toContain('text-slate-900');
      expect(heading.className).toContain('dark:text-white');

      const card = heading.closest('.rounded-2xl') as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-slate-900');
      expect(card.className).toContain('border-slate-200');
      expect(card.className).toContain('dark:border-slate-700/80');

      const priceInput = screen.getByDisplayValue('15');
      expect(priceInput).toBeInTheDocument();
      expect(priceInput.className).toContain('bg-slate-50');
      expect(priceInput.className).toContain('dark:bg-slate-950');
      expect(priceInput.className).toContain('text-slate-900');
      expect(priceInput.className).toContain('dark:text-white');
    });
  });

  describe('2. BuyerBidModal Light Theme', () => {
    it('renders BuyerBidModal with light card background, inputs, and listing summary box', () => {
      const store = createMockStore();
      const mockListing: any = {
        _id: 'listing-101',
        publicTitle: 'Organic Milk 1L Surplus Lot',
        availableQuantity: 50,
        startingPrice: 2.50,
        publicPrice: 2.50,
      };

      render(
        <Provider store={store}>
          <BuyerBidModal isOpen={true} onClose={vi.fn()} listing={mockListing} />
        </Provider>
      );

      const modalTitle = screen.getByText('Submit Marketplace Bid');
      expect(modalTitle).toBeInTheDocument();
      expect(modalTitle.className).toContain('text-slate-900');
      expect(modalTitle.className).toContain('dark:text-slate-100');

      const card = modalTitle.closest('.rounded-2xl') as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-slate-900');
      expect(card.className).toContain('border-slate-200');

      const caseInput = screen.getByLabelText('Case Quantity');
      expect(caseInput.className).toContain('bg-slate-50');
      expect(caseInput.className).toContain('dark:bg-slate-950');
      expect(caseInput.className).toContain('text-slate-900');
      expect(caseInput.className).toContain('dark:text-slate-100');
    });
  });

  describe('3. SmartAudienceLotSelector Light Theme', () => {
    it('renders panel containers, segments, and lot items with light mode surface tokens', () => {
      render(<SmartAudienceLotSelector supplierId="supp-1" />);

      const targetingHeading = screen.getByText('Smart Audience Targeting');
      expect(targetingHeading).toBeInTheDocument();
      expect(targetingHeading.className).toContain('text-slate-900');
      expect(targetingHeading.className).toContain('dark:text-white');

      const segmentBtn = screen.getByText('Short-Dated Grocers').closest('button') as HTMLElement;
      expect(segmentBtn).toBeInTheDocument();

      const unselectedSegmentBtn = screen.getByText('Discount Retailers').closest('button') as HTMLElement;
      expect(unselectedSegmentBtn).toBeInTheDocument();
      expect(unselectedSegmentBtn.className).toContain('bg-slate-50');
      expect(unselectedSegmentBtn.className).toContain('dark:bg-slate-900');
      expect(unselectedSegmentBtn.className).toContain('border-slate-200');
      expect(unselectedSegmentBtn.className).toContain('dark:border-slate-800');
    });
  });

  describe('4. BuyerListManagerModal Light Theme', () => {
    it('renders modal dialog, side directory, and two-column lists with light mode theme support', () => {
      const store = createMockStore({
        core: {
          buyerLists: [
            { _id: 'list-1', name: 'Primary Distributors', type: 'primary', buyerIds: ['b1'] },
            { _id: 'list-2', name: 'Custom Outlet List', type: 'custom', buyerIds: ['b2'] },
          ],
          buyers: [
            { _id: 'b1', name: 'Metro Fresh', email: 'metro@test.com', companyName: 'Metro Fresh' },
            { _id: 'b2', name: 'Discount Food', email: 'discount@test.com', companyName: 'Discount Food' },
          ],
        },
      });

      render(
        <Provider store={store}>
          <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
        </Provider>
      );

      const headerTitle = screen.getByText('Buyer List Manager');
      expect(headerTitle).toBeInTheDocument();
      expect(headerTitle.className).toContain('text-slate-900');
      expect(headerTitle.className).toContain('dark:text-white');

      const modalCard = headerTitle.closest('.rounded-xl') as HTMLElement;
      expect(modalCard).toBeInTheDocument();
      expect(modalCard.className).toContain('bg-white');
      expect(modalCard.className).toContain('dark:bg-slate-900');
      expect(modalCard.className).toContain('border-slate-200');

      const currentMembersCol = screen.getByTestId('current-members-column');
      expect(currentMembersCol.className).toContain('bg-white');
      expect(currentMembersCol.className).toContain('dark:bg-slate-900/60');
      expect(currentMembersCol.className).toContain('border-slate-200');
    });
  });

  describe('5. LiveDevicePreview Light Theme', () => {
    it('renders viewport header controls and preview container frame in light mode', () => {
      render(
        <LiveDevicePreview
          subject="Test Subject"
          bodyHtml="<p>Test Content</p>"
        />
      );

      const headerText = screen.getByText('Live Device Viewport Preview');
      expect(headerText).toBeInTheDocument();
      expect(headerText.className).toContain('text-slate-900');
      expect(headerText.className).toContain('dark:text-slate-200');

      const headerContainer = headerText.closest('.rounded-2xl') as HTMLElement;
      expect(headerContainer).toBeInTheDocument();
      expect(headerContainer.className).toContain('bg-white');
      expect(headerContainer.className).toContain('dark:bg-slate-950/80');
      expect(headerContainer.className).toContain('border-slate-200');

      const desktopBtn = screen.getByTestId('device-toggle-desktop');
      const mobileBtn = screen.getByTestId('device-toggle-mobile');
      expect(mobileBtn.className).toContain('text-slate-600');
      expect(mobileBtn.className).toContain('dark:text-slate-400');
    });
  });

  describe('6. InteractiveTour Light Theme', () => {
    it('renders tour assistant widget card legibly with light mode theme support', () => {
      render(
        <InteractiveTour
          activeTab="ingestion"
          setActiveTab={vi.fn()}
          selectedSupplier="supp-1"
          setSelectedSupplier={vi.fn()}
          setFile={vi.fn()}
          setParsedResult={vi.fn()}
          setMappings={vi.fn()}
          setIsImported={vi.fn()}
          setImportCount={vi.fn()}
          setImportedLotIds={vi.fn()}
          setSelectedLot={vi.fn()}
          setSelectedLotHubId={vi.fn()}
          inventoryList={[]}
          fetchInventory={vi.fn()}
          fetchShipments={vi.fn()}
          API_BASE_URL="/api"
          suppliers={[]}
          openLotOperationsHub={vi.fn()}
        />
      );

      const tourTitle = screen.getByText('Surplus Liquidation Loop');
      expect(tourTitle).toBeInTheDocument();
      expect(tourTitle.className).toContain('text-slate-900');
      expect(tourTitle.className).toContain('dark:text-white');

      const widgetCard = tourTitle.closest('div.fixed') as HTMLElement;
      expect(widgetCard).toBeInTheDocument();
      expect(widgetCard.className).toContain('bg-white');
      expect(widgetCard.className).toContain('dark:bg-slate-900');
      expect(widgetCard.className).toContain('border-slate-200');
    });
  });
});
