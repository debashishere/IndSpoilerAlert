import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import coreReducer from '../store/slices/coreSlice';
import authReducer from '../store/slices/authSlice';
import BuyerBidModal from '../components/domain/marketplace/BuyerBidModal';

const sampleListing = {
  _id: 'listing_123',
  publicTitle: 'Organic Fresh Whole Milk 1 Gallon',
  category: 'Dairy',
  remainingShelfLife: 0.75,
  availableQuantity: 100,
  publicPrice: 4.50,
  startingPrice: 3.50,
  minimumPrice: 2.50,
  status: 'published'
};

function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      core: coreReducer,
      auth: authReducer,
    },
    preloadedState,
  });
}

describe('0087 — BuyerBidModal Component & Bidding Verification Workflow', () => {
  it('renders modal with listing info, case inputs, and calculates total bid amount', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <BuyerBidModal
          isOpen={true}
          onClose={vi.fn()}
          listing={sampleListing}
        />
      </Provider>
    );

    expect(screen.getByText(/Submit Marketplace Bid/i)).toBeInTheDocument();
    expect(screen.getByText(/Organic Fresh Whole Milk 1 Gallon/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Stock:/i)).toBeInTheDocument();

    const qtyInput = screen.getByLabelText(/Case Quantity/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/Bid Price Per Case/i) as HTMLInputElement;

    fireEvent.change(qtyInput, { target: { value: '20' } });
    fireEvent.change(priceInput, { target: { value: '4.00' } });

    // Total = 20 * 4.00 = $80.00
    expect(screen.getByTestId('total-bid-amount')).toHaveTextContent('$80.00');
  });

  it('auto-fills buyer details for authenticated verified buyer and submits bid', async () => {
    const store = createTestStore({
      auth: {
        isAuthenticated: true,
        buyer: {
          id: 'buyer_99',
          email: 'logged.in@verified.com',
          companyName: 'Verified Supermarket Inc',
          isVerified: true,
        },
        token: 'token_xyz',
      },
    });

    const originalFetch = global.fetch;
    const mockFetch = vi.fn((url: any) => {
      if (String(url).includes('/marketplace/bids')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, _id: 'offer_1' }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });
    global.fetch = mockFetch;

    const handleSuccess = vi.fn();

    render(
      <Provider store={store}>
        <BuyerBidModal
          isOpen={true}
          onClose={vi.fn()}
          listing={sampleListing}
          onSuccess={handleSuccess}
        />
      </Provider>
    );

    // Verified badge and buyer info should be displayed
    expect(screen.getByText(/Verified Supermarket Inc/i)).toBeInTheDocument();
    expect(screen.getByText(/logged.in@verified.com/i)).toBeInTheDocument();

    const qtyInput = screen.getByLabelText(/Case Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '50' } });

    const priceInput = screen.getByLabelText(/Bid Price Per Case/i);
    fireEvent.change(priceInput, { target: { value: '3.80' } });

    const submitButton = screen.getByRole('button', { name: /Confirm & Submit Bid/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/marketplace/bids'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"buyerEmail":"logged.in@verified.com"'),
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
    });

    global.fetch = originalFetch;
  });

  it('prompts unauthenticated buyer for business email and email verification before bid submission', async () => {
    const store = createTestStore(); // unauthenticated

    const originalFetch = global.fetch;
    const mockFetch = vi.fn((url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/send-verification')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, devOtp: '654321', email: 'guest@newretailer.com' }),
        } as Response);
      }
      if (urlStr.includes('/auth/verify-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            token: 'guest_token',
            buyer: {
              id: 'buyer_guest',
              email: 'guest@newretailer.com',
              companyName: 'Newretailer Retail',
              isVerified: true,
            },
          }),
        } as Response);
      }
      if (urlStr.includes('/marketplace/bids')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, _id: 'offer_2' }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });
    global.fetch = mockFetch;

    render(
      <Provider store={store}>
        <BuyerBidModal
          isOpen={true}
          onClose={vi.fn()}
          listing={sampleListing}
        />
      </Provider>
    );

    // Unauthenticated state prompts for business email
    const emailInput = screen.getByPlaceholderText(/buyer@company.com/i);
    fireEvent.change(emailInput, { target: { value: 'guest@newretailer.com' } });

    const sendCodeButton = screen.getByText(/Send Verification Code/i);
    fireEvent.click(sendCodeButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
    });

    // Enter verification OTP
    const otpInput = screen.getByPlaceholderText(/123456/i);
    fireEvent.change(otpInput, { target: { value: '654321' } });

    const verifyBtn = screen.getByText(/Verify Email & Submit Bid/i);
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/marketplace/bids'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    global.fetch = originalFetch;
  });
});
