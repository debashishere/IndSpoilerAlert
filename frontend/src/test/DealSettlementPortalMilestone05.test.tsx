import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DealSettlementPortalView } from '../views/DealSettlementPortalView';
import { dealService, DealData } from '../services/dealService';

describe('Issue #05 Milestone: Buyer Deal Settlement Portal with Payment Gate & E-Sign Agreement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const initialDealData: DealData = {
    _id: 'deal-milestone-05',
    awardedQty: 250,
    price: 18.00,
    totalAmount: 4500.00,
    pickupLocation: 'Denver Logistics Center, 7400 E 40th Ave',
    pickupHours: '08:00 AM - 04:30 PM CST',
    paymentStatus: 'pending',
    signatureStatus: 'pending',
    product: {
      name: 'Organic Cold-Pressed Orange Juice 1L',
      sku: 'SKU-ORANGE-05',
      brand: 'HarvestBest',
      category: 'Beverages'
    },
    lot: {
      _id: 'lot-milestone-05',
      lotNumber: 'LOT-ORANGE-05',
      quantityCases: 500,
      availableQty: 250
    },
    buyer: {
      _id: 'buyer-milestone-05',
      companyName: 'Apex Liquidators Corp',
      email: 'procurement@issue05-buyer.org'
    }
  };

  it('completes the entire end-to-end Issue 05 workflow: payment gate -> e-sign -> executed contract dashboard', async () => {
    const user = userEvent.setup();

    // 1. Initial Load: Standalone portal loads transaction details, lot/product, DC pickup depot, and dock hours
    vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(initialDealData);

    render(<DealSettlementPortalView dealId="deal-milestone-05" token="milestone-token-xyz" />);

    await waitFor(() => {
      expect(screen.getByTestId('deal-settlement-portal')).toBeInTheDocument();
    });

    // Check deal summary, lot/product, DC pickup depot, dock hours
    expect(screen.getByText('Organic Cold-Pressed Orange Juice 1L')).toBeInTheDocument();
    expect(screen.getByText('SKU-ORANGE-05')).toBeInTheDocument();
    expect(screen.getByText('Denver Logistics Center, 7400 E 40th Ave')).toBeInTheDocument();
    expect(screen.getByText('08:00 AM - 04:30 PM CST')).toBeInTheDocument();

    // 2. Step 1 (Payment Gate) presents total payment amount, scan-to-pay QR code, and interactive Pay Now button
    expect(screen.getByTestId('step-1-payment-gate')).toBeInTheDocument();
    expect(screen.getByTestId('payment-gate-total')).toHaveTextContent('$4,500.00');
    expect(screen.getByTestId('scan-to-pay-qr')).toBeInTheDocument();
    const payNowBtn = screen.getByRole('button', { name: /Pay Now \(Simulate Payment Confirmation\)/i });
    expect(payNowBtn).toBeInTheDocument();
    expect(payNowBtn).toBeEnabled();

    // 3. Step 2 (Agreement & E-Sign) is strictly locked with a locked banner
    const step2Container = screen.getByTestId('step-2-agreement-container');
    expect(step2Container).toHaveAttribute('data-locked', 'true');
    expect(screen.getByText(/Locked until payment is confirmed/i)).toBeInTheDocument();
    expect(screen.queryByTestId('legal-agreement-document')).not.toBeInTheDocument();

    // 4. Clicking "Pay Now" transitions payment to confirmed and unlocks Step 2
    const confirmedDealData: DealData = {
      ...initialDealData,
      paymentStatus: 'confirmed'
    };
    const confirmPaymentSpy = vi.spyOn(dealService, 'confirmPayment').mockResolvedValueOnce(confirmedDealData);

    await user.click(payNowBtn);

    expect(confirmPaymentSpy).toHaveBeenCalledWith('deal-milestone-05', 'milestone-token-xyz');

    await waitFor(() => {
      expect(screen.getByTestId('payment-cleared-badge')).toBeInTheDocument();
    });
    expect(step2Container).toHaveAttribute('data-locked', 'false');
    expect(screen.getByTestId('legal-agreement-document')).toBeInTheDocument();

    // 5. Interactive signature pad supports typing legal name with authorization acknowledgment checkbox
    const typeModeBtn = screen.getByTestId('signature-mode-type');
    await user.click(typeModeBtn);
    expect(screen.getByTestId('typed-signature-preview')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Legal Name/i);
    const titleInput = screen.getByLabelText(/Corporate Title/i);
    const authCheckbox = screen.getByLabelText(/I confirm that I am legally authorized/i);

    await user.type(nameInput, 'Alex Morgan');
    await user.type(titleInput, 'Chief Procurement Officer');
    await user.click(authCheckbox);

    // 6. Submitting signature marks the deal contract as EXECUTED, generates audit record, and enables PDF download
    const executedDealData: DealData = {
      ...confirmedDealData,
      signatureStatus: 'executed',
      poPdfUrl: '/api/deals/deal-milestone-05/pdf',
      executionAudit: {
        signerName: 'Alex Morgan',
        signerTitle: 'Chief Procurement Officer',
        signatureType: 'type',
        signatureData: 'Alex Morgan',
        signedAt: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    };
    const signDealSpy = vi.spyOn(dealService, 'signDeal').mockResolvedValueOnce(executedDealData);

    const submitBtn = screen.getByTestId('signature-submit-button');
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    expect(signDealSpy).toHaveBeenCalledWith(
      'deal-milestone-05',
      expect.objectContaining({
        signerName: 'Alex Morgan',
        signerTitle: 'Chief Procurement Officer',
        authorized: true,
        signatureType: 'type',
        signatureData: 'Alex Morgan'
      }),
      'milestone-token-xyz'
    );

    // 7. Transitions to Executed Deal Dashboard with verified seal, PDF download, and logistics
    await waitFor(() => {
      expect(screen.getByTestId('executed-deal-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText(/Agreement Executed & Sealed/i)).toBeInTheDocument();
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('Chief Procurement Officer')).toBeInTheDocument();

    const downloadPdfBtn = screen.getByTestId('download-pdf-button');
    expect(downloadPdfBtn).toBeInTheDocument();
    expect(downloadPdfBtn).toHaveAttribute('href', expect.stringContaining('/deals/deal-milestone-05/pdf'));

    // Logistics summary
    expect(screen.getByTestId('executed-logistics-summary')).toBeInTheDocument();
    expect(screen.getAllByText('Denver Logistics Center, 7400 E 40th Ave').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('08:00 AM - 04:30 PM CST').length).toBeGreaterThanOrEqual(1);
  });
});
