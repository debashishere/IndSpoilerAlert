import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../services/networkService';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('networkService Authorization Header Sync', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should send Authorization: Bearer <id_token> when user is authenticated', async () => {
    await firebaseAuthService.signupWithEmail('authtest@example.com', 'pass', { buyer: true, supplier: true });
    const token = await firebaseAuthService.getCurrentIdToken();

    await apiFetch('/test-endpoint');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
  });

  it('should not attach Authorization header when user is unauthenticated', async () => {
    await firebaseAuthService.logoutUser();

    await apiFetch('/public-endpoint');

    const fetchCallHeaders = (global.fetch as any).mock.calls[0][1].headers;
    expect(fetchCallHeaders.Authorization).toBeUndefined();
  });
});
