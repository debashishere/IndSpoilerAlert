import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightCard } from '../components/InsightCard';

describe('InsightCard Component Seam (0126 - Slice 1)', () => {
  describe('Minimalist Metric Display & Icon Elimination', () => {
    it('renders title, value, subtext, and info button without any decorative right-hand icon wrapper', () => {
      const { container } = render(
        <InsightCard
          title="Active Portfolio Value"
          value="$1,250,000"
          subtext="Available to liquidate"
          tooltipText="Total potential sales value of inventory available to sell."
          icon={<span data-testid="legacy-icon">Icon</span>}
          iconBgClass="bg-blue-50"
          iconTextClass="text-blue-600"
        />
      );

      // Verify title, value, subtext, and info button exist
      expect(screen.getByText('Active Portfolio Value')).toBeInTheDocument();
      expect(screen.getByText('$1,250,000')).toBeInTheDocument();
      expect(screen.getByText('Available to liquidate')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /more information about active portfolio value/i })).toBeInTheDocument();

      // Acceptance criterion 1: All decorative right-hand icon wrappers (w-10 h-10 containers) are removed
      expect(screen.queryByTestId('legacy-icon')).not.toBeInTheDocument();
      const iconWrappers = container.querySelectorAll('.w-10.h-10');
      expect(iconWrappers.length).toBe(0);
    });
  });

  describe('Uncontrolled Info Disclosure', () => {
    it('opens popover when info button is clicked and closes when X button is clicked', () => {
      render(
        <InsightCard
          title="Critical Expirations"
          value={12}
          subtext="Lots expiring in < 14 days"
          tooltipText="Number of inventory lots that are within 14 days of expiration."
        />
      );

      // Initially not visible
      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

      // Click "i" button to open
      const infoBtn = screen.getByRole('button', { name: /more information about critical expirations/i });
      fireEvent.click(infoBtn);

      const overlay = screen.getByTestId('info-overlay');
      expect(overlay).toBeInTheDocument();
      expect(screen.getByText('Critical Expirations Info')).toBeInTheDocument();
      expect(screen.getByText('Number of inventory lots that are within 14 days of expiration.')).toBeInTheDocument();

      // Click "X" close button to dismiss
      const closeBtn = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Controlled Single-Active Exclusivity', () => {
    it('respects isExpanded prop and delegates toggle events to onToggle', () => {
      const handleToggle = vi.fn();

      const { rerender } = render(
        <InsightCard
          title="Matched Buyer Network"
          value="48 Buyers"
          subtext="Active in your category"
          tooltipText="Number of verified buyers currently active in the network."
          isExpanded={false}
          onToggle={handleToggle}
        />
      );

      // Initially closed because isExpanded is false
      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

      // Click "i" button — should invoke onToggle, should NOT open on its own
      const infoBtn = screen.getByRole('button', { name: /more information about matched buyer network/i });
      fireEvent.click(infoBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

      // Parent updates isExpanded to true
      rerender(
        <InsightCard
          title="Matched Buyer Network"
          value="48 Buyers"
          subtext="Active in your category"
          tooltipText="Number of verified buyers currently active in the network."
          isExpanded={true}
          onToggle={handleToggle}
        />
      );

      expect(screen.getByTestId('info-overlay')).toBeInTheDocument();

      // Click "X" close button — should invoke onToggle
      const closeBtn = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeBtn);
      expect(handleToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Outside Click Dismissal', () => {
    it('dismisses popover when user clicks outside the card in uncontrolled mode', () => {
      render(
        <div>
          <button data-testid="outside-area">Outside Content</button>
          <InsightCard
            title="Landfill Diversion Rate"
            value="84%"
            subtext="Sold, Donated, or Recycled"
            tooltipText="Percentage of inventory diverted from landfills."
          />
        </div>
      );

      // Open popover
      const infoBtn = screen.getByRole('button', { name: /more information about landfill diversion rate/i });
      fireEvent.click(infoBtn);
      expect(screen.getByTestId('info-overlay')).toBeInTheDocument();

      // Click outside area
      fireEvent.mouseDown(screen.getByTestId('outside-area'));
      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();
    });

    it('invokes onToggle when user clicks outside the card in controlled mode while expanded', () => {
      const handleToggle = vi.fn();

      render(
        <div>
          <button data-testid="outside-area">Outside Content</button>
          <InsightCard
            title="Landfill Diversion Rate"
            value="84%"
            subtext="Sold, Donated, or Recycled"
            tooltipText="Percentage of inventory diverted from landfills."
            isExpanded={true}
            onToggle={handleToggle}
          />
        </div>
      );

      expect(screen.getByTestId('info-overlay')).toBeInTheDocument();

      // Click outside area
      fireEvent.mouseDown(screen.getByTestId('outside-area'));
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });
});
