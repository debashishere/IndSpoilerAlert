import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dealService } from '../services/dealService';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('Frontend Seam 2: dealService.confirmPayment (Issue #04B)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('dispatches POST to /deals/:dealId/confirm-payment with token parameter and returns updated deal', async () => {
    const mockResponseDeal = {
      _id: 'deal-abc',
      awardedQty: 50,
      price: 20,
      totalAmount: 1000,
      paymentStatus: 'confirmed',
      signatureStatus: 'pending'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, deal: mockResponseDeal })
    } as any);

    const result = await dealService.confirmPayment('deal-abc', 'token-xyz-123');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deals/deal-abc/confirm-payment?token=token-xyz-123'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );

    expect(result.paymentStatus).toBe('confirmed');
    expect(result._id).toBe('deal-abc');
  });

  it('attaches Bearer authorization token when logged in', async () => {
    vi.spyOn(firebaseAuthService, 'getCurrentIdToken').mockResolvedValueOnce('mock-buyer-jwt');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, deal: { _id: 'deal-abc', paymentStatus: 'confirmed' } })
    } as any);

    await dealService.confirmPayment('deal-abc');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deals/deal-abc/confirm-payment'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-buyer-jwt'
        })
      })
    );
  });

  it('throws an error if payment confirmation fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Unauthorized deal access.' })
    } as any);

    await expect(dealService.confirmPayment('deal-abc', 'bad-token')).rejects.toThrow(
      'Unauthorized deal access.'
    );
  });
});
