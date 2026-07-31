import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOAuthMailbox } from '../hooks/useOAuthMailbox';

describe('useOAuthMailbox Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('connectMailbox opens a popup window', () => {
    const mockOpen = vi.fn();
    vi.stubGlobal('window', { ...window, open: mockOpen });
    
    const { result } = renderHook(() => useOAuthMailbox('sup-123'));
    
    act(() => {
      result.current.connectMailbox();
    });
    
    expect(mockOpen).toHaveBeenCalledWith(
      '/api/oauth/start?supplierId=sup-123',
      'OAuthConnect',
      expect.any(String)
    );
  });
});
