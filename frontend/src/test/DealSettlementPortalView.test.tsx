import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DealSettlementPortalView } from '../views/DealSettlementPortalView';
import { dealService } from '../services/dealService';

describe('Frontend Seam 2: Deal Settlement Portal & Standalone Shell (Issue #04A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Slice 2A: Unauthorized Access Denied State', () => {
    it('renders a distraction-free access-denied state when dealService returns a 403 Forbidden error', async () => {
      vi.spyOn(dealService, 'getDeal').mockRejectedValueOnce(
        new Error('Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.')
      );

      render(<DealSettlementPortalView dealId="invalid-deal-id" token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('deal-access-denied')).toBeInTheDocument();
      });

      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/valid HMAC dealToken or matching authorized session/i)).toBeInTheDocument();
      // Ensure supplier navigation headers and sidebar controls are omitted
      expect(screen.queryByTestId('supplier-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByText('IndSpoiler Alert')).not.toBeInTheDocument();
    });
  });

  describe('Slice 2B: Authorized Standalone Shell & Deal Summary Display', () => {
    const mockDealData = {
      _id: 'deal-test-xyz-123',
      awardedQty: 150,
      price: 12.50,
      totalAmount: 1875.00,
      pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
      pickupHours: '08:00 AM - 04:30 PM CST',
      paymentStatus: 'pending' as const,
      signatureStatus: 'pending' as const,
      product: {
        name: 'Organic Honeycrisp Apples 40lb Box',
        sku: 'SKU-HONEY-01'
      },
      lot: {
        _id: 'lot-123',
        lotNumber: 'LOT-HONEY-01',
        quantityCases: 200,
        availableQty: 50
      },
      buyer: {
        _id: 'buyer-123',
        companyName: 'Apex Liquidators',
        email: 'buyer@apexliquidators.com'
      }
    };

    it('renders the complete awarded deal summary and omits internal supplier sidebar/nav', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(mockDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('deal-settlement-portal')).toBeInTheDocument();
      });

      // Product and SKU
      expect(screen.getByText('Organic Honeycrisp Apples 40lb Box')).toBeInTheDocument();
      expect(screen.getByText('SKU-HONEY-01')).toBeInTheDocument();

      // Awarded quantity and pricing
      expect(screen.getAllByText(/150 cases/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$12\.50/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$1,875\.00/).length).toBeGreaterThanOrEqual(1);

      // DC pickup address and warehouse dock hours
      expect(screen.getByText('7400 E 40th Ave, Denver, CO 80207')).toBeInTheDocument();
      expect(screen.getByText('08:00 AM - 04:30 PM CST')).toBeInTheDocument();

      // Standalone shell check: internal supplier navigation and chrome are omitted
      expect(screen.queryByTestId('supplier-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByText('Workflow Automation')).not.toBeInTheDocument();
      expect(screen.queryByText('Emails Hub')).not.toBeInTheDocument();
    });
  });

  describe('Slice 2C: Step 1 Payment Gate & Locked Step 2 (Issue #04B)', () => {
    const pendingDealData = {
      _id: 'deal-test-xyz-123',
      awardedQty: 150,
      price: 12.50,
      totalAmount: 1875.00,
      pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
      pickupHours: '08:00 AM - 04:30 PM CST',
      paymentStatus: 'pending' as const,
      signatureStatus: 'pending' as const,
      product: {
        name: 'Organic Honeycrisp Apples 40lb Box',
        sku: 'SKU-HONEY-01'
      }
    };

    it('renders Step 1 Payment Gate with instructions, QR code, and locked Step 2', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(pendingDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('step-1-payment-gate')).toBeInTheDocument();
      });

      // Total deal value in payment gate
      expect(screen.getByTestId('payment-gate-total')).toHaveTextContent('$1,875.00');

      // Wire/payment simulation instructions
      expect(screen.getByText(/Wire \/ ACH Settlement Instructions/i)).toBeInTheDocument();

      // Scan-to-pay QR code graphic
      expect(screen.getByTestId('scan-to-pay-qr')).toBeInTheDocument();

      // Interactive Pay Now button
      const payButton = screen.getByRole('button', { name: /Pay Now \(Simulate Payment Confirmation\)/i });
      expect(payButton).toBeInTheDocument();
      expect(payButton).toBeEnabled();

      // Step 2 is locked
      expect(screen.getByTestId('step-2-agreement-container')).toHaveAttribute('data-locked', 'true');
      expect(screen.getByText(/Locked until payment is confirmed/i)).toBeInTheDocument();
    });
  });

  describe('Slice 2D: Interactive Payment Confirmation & State Transition (Issue #04B)', () => {
    const pendingDealData = {
      _id: 'deal-test-xyz-123',
      awardedQty: 150,
      price: 12.50,
      totalAmount: 1875.00,
      pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
      pickupHours: '08:00 AM - 04:30 PM CST',
      paymentStatus: 'pending' as const,
      signatureStatus: 'pending' as const,
      product: {
        name: 'Organic Honeycrisp Apples 40lb Box',
        sku: 'SKU-HONEY-01'
      }
    };

    it('confirms payment on click, updates payment badge, and transitions to unlock Step 2', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(pendingDealData);
      const confirmSpy = vi.spyOn(dealService, 'confirmPayment').mockResolvedValueOnce({
        ...pendingDealData,
        paymentStatus: 'confirmed'
      });

      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('simulate-payment-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('simulate-payment-button'));

      expect(confirmSpy).toHaveBeenCalledWith('deal-test-xyz-123', 'valid-deal-token-hmac');

      await waitFor(() => {
        expect(screen.getByTestId('payment-cleared-badge')).toBeInTheDocument();
      });

      // Step 2 is now unlocked
      expect(screen.getByTestId('step-2-agreement-container')).toHaveAttribute('data-locked', 'false');
      expect(screen.getByText(/Step 2 Unlocked: Ready for Agreement Execution/i)).toBeInTheDocument();
    });
  });

  describe('Slice 2E: Durability & Reload Continuity (Issue #04B)', () => {
    it('preserves confirmed payment state when loaded and directly unlocks Step 2', async () => {
      const confirmedDealData = {
        _id: 'deal-test-xyz-123',
        awardedQty: 150,
        price: 12.50,
        totalAmount: 1875.00,
        pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
        pickupHours: '08:00 AM - 04:30 PM CST',
        paymentStatus: 'confirmed' as const,
        signatureStatus: 'pending' as const,
        product: {
          name: 'Organic Honeycrisp Apples 40lb Box',
          sku: 'SKU-HONEY-01'
        }
      };

      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(confirmedDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('payment-cleared-badge')).toBeInTheDocument();
      });

      expect(screen.getByTestId('step-2-agreement-container')).toHaveAttribute('data-locked', 'false');
      expect(screen.queryByTestId('simulate-payment-button')).not.toBeInTheDocument();
    });
  });

  describe('Slice 2F: Deep Linking (#payment) (Issue #04B)', () => {
    it('scrolls or focuses payment section when URL hash is #payment', async () => {
      window.location.hash = '#payment';
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce({
        _id: 'deal-test-xyz-123',
        awardedQty: 150,
        price: 12.50,
        totalAmount: 1875.00,
        pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
        pickupHours: '08:00 AM - 04:30 PM CST',
        paymentStatus: 'pending',
        signatureStatus: 'pending',
        product: { name: 'Organic Honeycrisp Apples', sku: 'SKU-HONEY-01' }
      });

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('step-1-payment-gate')).toBeInTheDocument();
      });

      expect(scrollIntoViewMock).toHaveBeenCalled();
      window.location.hash = '';
    });
  });

  describe('Frontend Seam 2: Executed Deal Portal Dashboard (Issue #04D)', () => {
    const executedDealData = {
      _id: 'deal-test-xyz-123',
      awardedQty: 150,
      price: 12.50,
      totalAmount: 1875.00,
      pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
      pickupHours: '08:00 AM - 04:30 PM CST',
      paymentStatus: 'confirmed' as const,
      signatureStatus: 'executed' as const,
      poPdfUrl: '/api/deals/deal-test-xyz-123/pdf',
      executionAudit: {
        signerName: 'Jane Doe',
        signerTitle: 'VP Procurement',
        signatureType: 'draw' as const,
        signatureData: 'data:image/png;base64,mockSignatureData',
        signedAt: new Date('2026-09-12T10:00:00Z'),
        ipAddress: '192.168.1.50',
        verificationHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b'
      },
      product: {
        name: 'Organic Honeycrisp Apples 40lb Box',
        sku: 'SKU-HONEY-01'
      },
      lot: {
        _id: 'lot-123',
        lotNumber: 'LOT-HONEY-01',
        quantityCases: 200,
        availableQty: 50
      },
      buyer: {
        _id: 'buyer-123',
        companyName: 'Apex Liquidators',
        email: 'buyer@apexliquidators.com'
      }
    };

    it('renders the Executed Deal Dashboard with verified digital seal and execution audit metadata', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(executedDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('executed-deal-dashboard')).toBeInTheDocument();
      });

      // Digital execution seal and certificate elements
      expect(screen.getByText(/Agreement Executed & Sealed/i)).toBeInTheDocument();
      expect(screen.getByText(/Executed & Verified/i)).toBeInTheDocument();
      expect(screen.getByText(/Tamper-Evident ESIGN Record/i)).toBeInTheDocument();

      // Signer audit trail
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('VP Procurement').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b/)).toBeInTheDocument();
    });

    it('provides one-click PDF contract download button and DC dock pickup logistics instructions', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(executedDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('download-pdf-button')).toBeInTheDocument();
      });

      const downloadButton = screen.getByTestId('download-pdf-button');
      expect(downloadButton).toHaveAttribute('href', expect.stringContaining('/deals/deal-test-xyz-123/pdf?token=valid-deal-token-hmac'));
      expect(downloadButton).toHaveTextContent(/Download Agreement PDF/i);

      // Logistics summary
      expect(screen.getByTestId('executed-logistics-summary')).toBeInTheDocument();
      expect(screen.getByText(/Buyer Arranged Freight \(FOB Origin\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('7400 E 40th Ave, Denver, CO 80207').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('08:00 AM - 04:30 PM CST').length).toBeGreaterThanOrEqual(1);
    });

    it('locks and omits signature capture pad and payment simulation controls in executed revisit state', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(executedDealData);

      render(<DealSettlementPortalView dealId="deal-test-xyz-123" token="valid-deal-token-hmac" />);

      await waitFor(() => {
        expect(screen.getByTestId('executed-deal-dashboard')).toBeInTheDocument();
      });

      // Interactive controls must not be present
      expect(screen.queryByTestId('signature-pad-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('signature-submit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('simulate-payment-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-2-agreement-container')).not.toBeInTheDocument();
    });
  });
});

