import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CentralAuthModal } from '../components/auth/CentralAuthModal';
import { AuthContext } from '../context/AuthContext';

describe('CentralAuthModal Google SSO Integration (Slice 02)', () => {
  const defaultMockAuthContext = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    loginWithGoogle: vi.fn().mockResolvedValue({
      uid: 'google-uid-123',
      email: 'test@example.com',
      profiles: { buyer: true, supplier: true },
    }),
    signup: vi.fn(),
    logout: vi.fn(),
    updateProfiles: vi.fn(),
  };

  it('renders "Continue with Google" button and visual "OR" divider in both Signup and Login modes', () => {
    const { rerender } = render(
      <AuthContext.Provider value={defaultMockAuthContext}>
        <CentralAuthModal isOpen={true} initialMode="signup" onClose={vi.fn()} />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();

    rerender(
      <AuthContext.Provider value={defaultMockAuthContext}>
        <CentralAuthModal isOpen={true} initialMode="login" onClose={vi.fn()} />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('triggers loginWithGoogle with selected profile roles when in Signup mode', async () => {
    const loginWithGoogle = vi.fn().mockResolvedValue({
      uid: 'google-uid-123',
      email: 'test@example.com',
      profiles: { buyer: false, supplier: true },
    });
    const onSuccess = vi.fn();

    render(
      <AuthContext.Provider value={{ ...defaultMockAuthContext, loginWithGoogle }}>
        <CentralAuthModal isOpen={true} initialMode="signup" onClose={vi.fn()} onSuccess={onSuccess} />
      </AuthContext.Provider>
    );

    // Unselect Retail Buyer role
    const buyerBtn = screen.getByText('Retail Buyer').closest('button');
    if (buyerBtn) fireEvent.click(buyerBtn);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(loginWithGoogle).toHaveBeenCalledWith({ buyer: false, supplier: true });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('triggers loginWithGoogle when in Login mode and handles loading states', async () => {
    const loginWithGoogle = vi.fn().mockReturnValue(new Promise(() => {})); // pending promise
    const onSuccess = vi.fn();

    render(
      <AuthContext.Provider value={{ ...defaultMockAuthContext, loginWithGoogle }}>
        <CentralAuthModal isOpen={true} initialMode="login" onClose={vi.fn()} onSuccess={onSuccess} />
      </AuthContext.Provider>
    );

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    expect(loginWithGoogle).toHaveBeenCalled();
    expect(googleBtn).toBeDisabled();
  });
});
