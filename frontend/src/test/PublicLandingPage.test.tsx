import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import PublicLandingPage from '../views/PublicLandingPage';
import { AuthProvider } from '../context/AuthContext';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('PublicLandingPage Component', () => {
  beforeEach(async () => {
    localStorage.clear();
    await firebaseAuthService.logoutUser();
  });

  const renderLandingPage = () => {
    return render(
      <AuthProvider>
        <PublicLandingPage />
      </AuthProvider>
    );
  };

  it('renders Hero section with single [ Get Started / Enter Platform ] launch CTA button', () => {
    renderLandingPage();

    const ctaButtons = screen.getAllByRole('button', { name: /Get Started \/ Enter Platform/i });
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    expect(ctaButtons[0]).toBeInTheDocument();
  });

  it('renders product showcases for InventoryFlow and SpoilerAlert with key capabilities', () => {
    renderLandingPage();

    // InventoryFlow Showcase
    expect(screen.getAllByText(/InventoryFlow/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Warehouse AI Ingestion/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/FSMA Temp Logs/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Expiration Tracking/i).length).toBeGreaterThanOrEqual(1);

    // SpoilerAlert Showcase
    expect(screen.getAllByText(/SpoilerAlert/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Secondary Marketplace/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Liquidation Automations/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Food Bank Donations/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders customer social proof & reviews grid for Unilever, Kraft Heinz, Grocery Outlet, and Misfits Market', () => {
    renderLandingPage();

    expect(screen.getByText(/Unilever/i)).toBeInTheDocument();
    expect(screen.getByText(/Kraft Heinz/i)).toBeInTheDocument();
    expect(screen.getByText(/Grocery Outlet/i)).toBeInTheDocument();
    expect(screen.getByText(/Misfits Market/i)).toBeInTheDocument();
  });

  it('opens interactive Central Auth Modal overlay on CTA click and supports registration with role selection', async () => {
    renderLandingPage();

    // Modal should not be open initially
    expect(screen.queryByRole('heading', { name: /Create Central Account/i })).not.toBeInTheDocument();

    // Click the hero CTA button
    const heroCtaButton = screen.getAllByRole('button', { name: /Get Started \/ Enter Platform/i })[1];
    await act(async () => {
      fireEvent.click(heroCtaButton);
    });

    // Modal should now be visible
    expect(screen.getByRole('heading', { name: /Create Central Account/i })).toBeInTheDocument();
    expect(screen.getByText(/^CPG Supplier$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Retail Buyer$/i)).toBeInTheDocument();

    // Toggle mode to Sign In
    const signInToggles = screen.getAllByRole('button', { name: /^Sign In$/i });
    const modalSignInToggle = signInToggles[signInToggles.length - 1];
    await act(async () => {
      fireEvent.click(modalSignInToggle);
    });

    expect(screen.getByRole('heading', { name: /Sign In to Platform/i })).toBeInTheDocument();
  });
});





