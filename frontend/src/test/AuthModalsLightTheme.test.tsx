import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { CentralAuthModal } from '../components/auth/CentralAuthModal';
import { BuyerAuthModal } from '../components/domain/marketplace/BuyerAuthModal';
import { AuthContext } from '../context/AuthContext';
import { openAuthModal } from '../store/slices/authSlice';

describe('Issue 05 — Auth Modals Light Theme (CentralAuthModal + BuyerAuthModal)', () => {
  const mockAuthContext = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    updateProfiles: vi.fn(),
  };

  describe('CentralAuthModal Light Theme', () => {
    it('renders CentralAuthModal card with light mode surface and text colors without hardcoded dark slate background', () => {
      const { container } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <CentralAuthModal isOpen={true} initialMode="signup" onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      const modalElement = screen.getByLabelText('Central Auth Modal');
      expect(modalElement).toBeInTheDocument();

      const card = modalElement.firstElementChild as HTMLElement;
      expect(card).toBeInTheDocument();

      // Card must not use hardcoded bg-slate-900 or border-slate-800 without light mode support
      expect(card.className).not.toBe('relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8');
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-slate-900');

      // Heading must use dark text in light mode
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.className).toContain('text-slate-900');
      expect(heading.className).toContain('dark:text-white');
    });

    it('renders input fields with light backgrounds and dark text in light mode', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <CentralAuthModal isOpen={true} initialMode="login" onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      const emailInput = screen.getByPlaceholderText('name@company.com');
      expect(emailInput).toBeInTheDocument();

      // Input must have light background in light mode and dark text
      expect(emailInput.className).toContain('bg-slate-50');
      expect(emailInput.className).toContain('dark:bg-slate-950');
      expect(emailInput.className).toContain('text-slate-900');
      expect(emailInput.className).toContain('dark:text-white');
    });

    it('renders role toggle selection buttons legibly in light mode', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <CentralAuthModal isOpen={true} initialMode="signup" onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      const supplierBtn = screen.getByText('CPG Supplier').closest('button');
      expect(supplierBtn).toBeInTheDocument();
      // Click to toggle unselected
      if (supplierBtn) fireEvent.click(supplierBtn);

      expect(supplierBtn?.className).toContain('bg-slate-50');
      expect(supplierBtn?.className).toContain('dark:bg-slate-950');
      expect(supplierBtn?.className).toContain('text-slate-700');
    });
  });

  describe('BuyerAuthModal Light Theme', () => {
    it('renders BuyerAuthModal card and header with light surface and text tokens', () => {
      store.dispatch(openAuthModal('login'));

      const { container } = render(
        <Provider store={store}>
          <BuyerAuthModal />
        </Provider>
      );

      const heading = screen.getByText('Buyer Authentication & Verification');
      expect(heading).toBeInTheDocument();

      const modalCard = heading.closest('.rounded-2xl') as HTMLElement;
      expect(modalCard).toBeInTheDocument();

      // Modal container should use light background with dark mode override
      expect(modalCard.className).toContain('bg-white');
      expect(modalCard.className).toContain('dark:bg-slate-900');

      // Heading text must be slate-900 in light mode
      expect(heading.className).toContain('text-slate-900');
      expect(heading.className).toContain('dark:text-slate-100');
    });

    it('renders BuyerAuthModal inputs and submit buttons with clean contrast in light mode', () => {
      store.dispatch(openAuthModal('login'));

      render(
        <Provider store={store}>
          <BuyerAuthModal />
        </Provider>
      );

      const emailInput = screen.getByPlaceholderText('buyer@company.com');
      expect(emailInput).toBeInTheDocument();

      expect(emailInput.className).toContain('bg-slate-50');
      expect(emailInput.className).toContain('dark:bg-slate-950');
      expect(emailInput.className).toContain('text-slate-900');
      expect(emailInput.className).toContain('dark:text-slate-100');
    });
  });
});
