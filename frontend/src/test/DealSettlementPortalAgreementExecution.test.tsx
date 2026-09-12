import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DealSettlementPortalView } from '../views/DealSettlementPortalView';
import { dealService, DealData } from '../services/dealService';

describe('Frontend Seam: Dual-Mode Signature Capture & Legal Agreement Execution (Issue #04C)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseDeal: DealData = {
    _id: 'deal-04c-789',
    awardedQty: 200,
    price: 15.00,
    totalAmount: 3000.00,
    pickupLocation: '7400 E 40th Ave, Denver, CO 80207',
    pickupHours: '08:00 AM - 04:30 PM CST',
    paymentStatus: 'confirmed',
    signatureStatus: 'pending',
    product: {
      name: 'Cold Pressed Orange Juice 1L',
      sku: 'SKU-JUICE-01',
      brand: 'SunHarvest',
      category: 'Beverages'
    },
    lot: {
      _id: 'lot-04c',
      lotNumber: 'LOT-JUICE-01',
      quantityCases: 250,
      availableQty: 50
    },
    buyer: {
      _id: 'buyer-04c',
      companyName: 'Apex Liquidators',
      email: 'buyer@apexliquidators.com'
    }
  };

  describe('Slice 3: Locked Step 2 Banner & Formal Agreement Display', () => {
    it('renders locked banner and disables signature submission when payment is pending', async () => {
      const pendingDeal: DealData = {
        ...baseDeal,
        paymentStatus: 'pending'
      };

      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(pendingDeal);

      render(<DealSettlementPortalView dealId="deal-04c-789" token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('step-2-agreement-container')).toBeInTheDocument();
      });

      expect(screen.getByTestId('step-2-agreement-container')).toHaveAttribute('data-locked', 'true');
      expect(screen.getByText(/Locked until payment is confirmed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('legal-agreement-document')).not.toBeInTheDocument();
      expect(screen.queryByTestId('signature-submit-button')).not.toBeInTheDocument();
    });

    it('renders formal B2B Surplus Asset Purchase Agreement with commercial terms, DC pickup logistics, and legal inputs when payment is confirmed', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(baseDeal);

      render(<DealSettlementPortalView dealId="deal-04c-789" token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('legal-agreement-document')).toBeInTheDocument();
      });

      const doc = screen.getByTestId('legal-agreement-document');

      // Formal agreement text and clauses inside the document
      expect(doc).toHaveTextContent(/B2B Surplus Asset Purchase Agreement/i);
      expect(doc).toHaveTextContent(/As-Is, Where-Is/i);
      expect(doc).toHaveTextContent(/Non-Returnable Salvage/i);
      expect(doc).toHaveTextContent(/7400 E 40th Ave, Denver, CO 80207/i);
      expect(doc).toHaveTextContent(/08:00 AM - 04:30 PM CST/i);

      // Legal execution inputs
      expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Corporate Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/I confirm that I am legally authorized/i)).toBeInTheDocument();
      expect(screen.getByTestId('signature-submit-button')).toBeInTheDocument();
    });
  });

  describe('Slice 4: Dual-Mode Signature Pad (Draw & Type) and Submission Flow', () => {
    it('supports switching between Draw and Type signature modes and submitting execution audit', async () => {
      vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce(baseDeal);
      const signSpy = vi.spyOn(dealService, 'signDeal').mockResolvedValueOnce({
        ...baseDeal,
        signatureStatus: 'executed',
        executionAudit: {
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          signatureType: 'type',
          signatureData: 'Jane Doe',
          signedAt: new Date().toISOString()
        }
      });

      const user = userEvent.setup();

      render(<DealSettlementPortalView dealId="deal-04c-789" token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('legal-agreement-document')).toBeInTheDocument();
      });

      // Toggle to Type mode
      const typeModeButton = screen.getByTestId('signature-mode-type');
      await user.click(typeModeButton);

      // Verify cursive preview exists
      expect(screen.getByTestId('typed-signature-preview')).toBeInTheDocument();

      // Fill in legal inputs
      const nameInput = screen.getByLabelText(/Full Legal Name/i);
      const titleInput = screen.getByLabelText(/Corporate Title/i);
      const authCheckbox = screen.getByLabelText(/I confirm that I am legally authorized/i);

      await user.type(nameInput, 'Jane Doe');
      await user.type(titleInput, 'VP Procurement');
      await user.click(authCheckbox);

      // Submit signature
      const submitButton = screen.getByTestId('signature-submit-button');
      expect(submitButton).toBeEnabled();
      await user.click(submitButton);

      expect(signSpy).toHaveBeenCalledWith(
        'deal-04c-789',
        expect.objectContaining({
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          authorized: true,
          signatureType: 'type',
          signatureData: 'Jane Doe'
        }),
        'valid-token'
      );

      // Transitions to executed state dashboard
      await waitFor(() => {
        expect(screen.getByTestId('agreement-executed-certificate')).toBeInTheDocument();
      });

      expect(screen.getByText(/Agreement Executed & Sealed/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/VP Procurement/i)).toBeInTheDocument();
    });
  });
});
