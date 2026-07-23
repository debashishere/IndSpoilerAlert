import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('AuthContext and useAuth hook', () => {
  beforeEach(async () => {
    localStorage.clear();
    await firebaseAuthService.logoutUser();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with null user and isAuthenticated = false when no session exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle signup and expose user identity with dual sub-profiles', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup('buyer_supplier@example.com', 'password123', {
        buyer: true,
        supplier: true,
      });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('buyer_supplier@example.com');
    expect(result.current.user?.profiles).toEqual({ buyer: true, supplier: true });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login and logout cleanly', async () => {
    await firebaseAuthService.signupWithEmail('logintest@example.com', 'password123', {
      buyer: true,
      supplier: false,
    });
    await firebaseAuthService.logoutUser();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('logintest@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('logintest@example.com');

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
