import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { MarketplaceLayout } from '../components/shell/MarketplaceLayout';
import { AuthContext } from '../context/AuthContext';

describe('Issue 04 — Shell: MarketplaceLayout Light Theme', () => {
  it('renders sticky header with light surface and semantic tokens instead of hardcoded dark slate classes', () => {
    const { container } = render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog</div>
        </MarketplaceLayout>
      </Provider>
    );

    const rootContainer = container.querySelector('.marketplace-container');
    expect(rootContainer).toBeInTheDocument();
    // Must not use hardcoded dark page background bg-slate-950 or hardcoded dark text text-slate-100
    expect(rootContainer?.className).not.toContain('bg-slate-950');
    expect(rootContainer?.className).not.toContain('text-slate-100');

    const header = screen.getByTestId('marketplace-header');
    expect(header).toBeInTheDocument();
    // Header must not have hardcoded dark background bg-slate-900/90 or border-slate-800
    expect(header.className).not.toContain('bg-slate-900/90');
    expect(header.className).not.toContain('border-slate-800');
  });

  it('renders user dropdown menu with semantic token surfaces and readable items in light mode', () => {
    const mockAuthValue = {
      user: {
        uid: 'buyer-123',
        email: 'buyer@example.com',
        displayName: 'Retail Store Inc',
        profiles: { buyer: true },
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    const { container } = render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthValue}>
          <MarketplaceLayout>
            <div>Marketplace Catalog</div>
          </MarketplaceLayout>
        </AuthContext.Provider>
      </Provider>
    );

    const triggerButton = screen.getByText('Retail Store Inc').closest('button');
    expect(triggerButton).toBeInTheDocument();
    // Click to open user dropdown
    if (triggerButton) {
      fireEvent.click(triggerButton);
    }

    const dropdownMenu = screen.getByText(/Signed in as/i).closest('div.absolute');
    expect(dropdownMenu).toBeInTheDocument();
    // Dropdown card must not have hardcoded dark slate background or border
    expect(dropdownMenu?.className).not.toContain('bg-slate-900');
    expect(dropdownMenu?.className).not.toContain('border-slate-800');
  });

  it('renders footer with light surface and muted text — no dark slate bleed', () => {
    const { container } = render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog</div>
        </MarketplaceLayout>
      </Provider>
    );

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    // Footer must not have hardcoded dark page background bg-slate-950 or border-slate-900
    expect(footer?.className).not.toContain('bg-slate-950');
    expect(footer?.className).not.toContain('border-slate-900');
    expect(footer?.className).not.toContain('text-slate-500');
  });

  it('preserves emerald/teal brand accents vibrant styling and renders logo and buyer badge legibly', () => {
    const { container } = render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog</div>
        </MarketplaceLayout>
      </Provider>
    );

    expect(screen.getByText('InventoryFlowing')).toBeInTheDocument();
    expect(screen.getByText('Buyer Marketplace')).toBeInTheDocument();
    
    // Check that brand icon has emerald/teal gradient
    const logoIcon = container.querySelector('.bg-gradient-to-tr');
    expect(logoIcon?.className).toContain('from-emerald-500');
    expect(logoIcon?.className).toContain('to-teal-400');
  });
});
