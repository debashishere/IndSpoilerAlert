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

  describe('Accessibility & Keyboard Navigation (Escape Key & ARIA)', () => {
    it('exposes aria-expanded attribute on the info button reflecting open state', () => {
      render(
        <InsightCard
          title="Carbon Offset"
          value="45 Tons"
          subtext="Net avoided"
          tooltipText="Estimated carbon offset."
        />
      );

      const infoBtn = screen.getByRole('button', { name: /more information about carbon offset/i });
      expect(infoBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(infoBtn);
      expect(infoBtn).toHaveAttribute('aria-expanded', 'true');

      const overlay = screen.getByTestId('info-overlay');
      expect(overlay).toHaveAttribute('role', 'dialog');
    });

    it('dismisses popover when Escape key is pressed in uncontrolled mode', () => {
      render(
        <InsightCard
          title="Carbon Offset"
          value="45 Tons"
          subtext="Net avoided"
          tooltipText="Estimated carbon offset."
        />
      );

      const infoBtn = screen.getByRole('button', { name: /more information about carbon offset/i });
      fireEvent.click(infoBtn);
      expect(screen.getByTestId('info-overlay')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();
    });

    it('invokes onToggle when Escape key is pressed in controlled mode', () => {
      const handleToggle = vi.fn();
      render(
        <InsightCard
          title="Carbon Offset"
          value="45 Tons"
          subtext="Net avoided"
          tooltipText="Estimated carbon offset."
          isExpanded={true}
          onToggle={handleToggle}
        />
      );

      expect(screen.getByTestId('info-overlay')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout & Responsive Geometry', () => {
    it('applies flex-wrap to value and subtext container to prevent overflow', () => {
      const { container } = render(
        <InsightCard
          title="COGS Recovery Rate"
          value="72%"
          subtext="Recovered: $45,000 of $62,500 sold COGS"
          tooltipText="Formula explanation."
        />
      );

      const valueRow = container.querySelector('.flex.flex-wrap');
      expect(valueRow).toBeInTheDocument();
    });

    it('positions popover with right-0 when popoverAlign="right" to avoid right-edge clipping', () => {
      render(
        <InsightCard
          title="CO2 Emissions Saved"
          value="51.2 Tons"
          subtext="Reduced greenhouse gas impact"
          tooltipText="Formula explanation."
          isExpanded={true}
          popoverAlign="right"
        />
      );

      const overlay = screen.getByTestId('info-overlay');
      expect(overlay).toHaveClass('right-0');
      expect(overlay).not.toHaveClass('left-0');
    });

    it('defaults popover alignment to left-0 when popoverAlign is not specified', () => {
      render(
        <InsightCard
          title="COGS Recovery Rate"
          value="72%"
          subtext="Recovered"
          tooltipText="Formula explanation."
          isExpanded={true}
        />
      );

      const overlay = screen.getByTestId('info-overlay');
      expect(overlay).toHaveClass('left-0');
    });
  });
});


