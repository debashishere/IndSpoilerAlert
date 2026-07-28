import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { MarketplaceLayout } from '../components/shell/MarketplaceLayout';
import { SupplierLayout } from '../components/shell/SupplierLayout';
import { AuthContext } from '../context/AuthContext';

describe('0083 — Route & Layout Separation (Supplier App vs Public Buyer Marketplace)', () => {
  it('should render MarketplaceLayout shell with InventoryFlowing branding, catalog navigation link, and Buyer Login/Register action buttons', () => {
    render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div data-testid="marketplace-content">Public Catalog Grid</div>
        </MarketplaceLayout>
      </Provider>
    );

    expect(screen.getByTestId('marketplace-header')).toBeInTheDocument();
    expect(screen.getByText('InventoryFlowing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buyer login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByTestId('marketplace-content')).toBeInTheDocument();
  });

  it('should render MarketplaceLayout shell with user profile dropdown and hide Buyer Login/Register when authenticated via AuthContext', () => {
    const mockAuthValue = {
      user: {
        uid: 'user-777',
        email: 'authenticated-buyer@example.com',
        displayName: 'Acme Retail',
        profiles: { buyer: true, supplier: true },
      },
      token: 'mock-auth-token',
      isAuthenticated: true,
      isLoading: false,
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthValue}>
          <MarketplaceLayout>
            <div data-testid="marketplace-content">Public Catalog Grid</div>
          </MarketplaceLayout>
        </AuthContext.Provider>
      </Provider>
    );

    expect(screen.getByTestId('marketplace-header')).toBeInTheDocument();
    expect(screen.getByText('InventoryFlowing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /buyer login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
    expect(screen.getByText('Acme Retail')).toBeInTheDocument();
    expect(screen.getByText('authenticated-buyer@example.com')).toBeInTheDocument();
  });

  it('should render SupplierLayout with Sidebar and main content for supplier workspace', () => {
    const { container } = render(
      <Provider store={store}>
        <SupplierLayout>
          <div data-testid="supplier-content">Supplier Ingestion Engine</div>
        </SupplierLayout>
      </Provider>
    );

    expect(container.querySelector('aside.sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-content')).toBeInTheDocument();
  });
});
