import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

// ─── shared setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ success: true, templates: [], lots: [] }), { status: 200 }),
    ),
  );
  Element.prototype.scrollIntoView = vi.fn();
});

const studioProps = {
  supplierId: 'sup-101',
  inventoryLots: [],
  buyers: [],
  apiBaseUrl: '/api',
};

// ─── helper: open the modal for a stage, then interact inside the dialog ──────

function openModalForStage(stageIndex: number) {
  fireEvent.click(screen.getByTestId(`configure-stage-email-btn-${stageIndex}`));
  return screen.getByRole('dialog');
}

// ─── Seam E: per-stage modal isolation ────────────────────────────────────────

describe('StageEmailModal — Seam E: per-stage isolation through LiquidationAutomationStudio', () => {
  test('clicking "Configure Stage Email" on Stage 1 opens modal for Stage 1', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    openModalForStage(1);

    // Modal header must identify Stage 1
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/Stage 1/i);
    expect(dialog).toHaveTextContent(/Email Configuration/i);
  });

  test('opening Stage 1 modal does not show Stage 2 in the header', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    openModalForStage(1);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/Stage 1 — Email Configuration/i);
    expect(dialog).not.toHaveTextContent(/Stage 2 — Email Configuration/i);
  });

  test('modal is dismissed and no longer rendered after Cancel', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    openModalForStage(1);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getAllByRole('button', { name: /cancel/i })[0]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ─── Seam F: badge reflects saved state ──────────────────────────────────────

describe('StageEmailModal — Seam F: "Email Configured ✓" badge reflects saved state', () => {
  test('"Email Configured ✓" badge is visible on Stage 1 by default (default stages ship with email data)', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    // Default Stage 1 ships with emailSubject: 'Stage 1 Priority Clearance Offer'
    // so the badge must already be visible on initial render
    expect(screen.getByTestId('email-configured-badge-1')).toBeInTheDocument();
  });

  test('"Email Configured ✓" badge appears on Stage 1 after saving email config', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    const dialog = openModalForStage(1);
    const modal = within(dialog);

    // Direct access to subject input as all sections are visible at once
    const subjectInput = modal.getByRole('textbox', { name: /subject/i });
    fireEvent.change(subjectInput, { target: { value: 'My Stage 1 Offer' } });

    // Save
    fireEvent.click(modal.getByRole('button', { name: /save email config/i }));

    // Badge must now be present for stage 1
    expect(screen.getByTestId('email-configured-badge-1')).toBeInTheDocument();
    expect(screen.getByTestId('email-configured-badge-1').textContent).toMatch(/Email Configured/i);
  });

  test('"Email Configured ✓" badge on Stage 1 does not appear on Stage 2', () => {
    render(<LiquidationAutomationStudio {...studioProps} />);

    const dialog = openModalForStage(1);
    const modal = within(dialog);

    const subjectInput = modal.getByRole('textbox', { name: /subject/i });
    fireEvent.change(subjectInput, {
      target: { value: 'Stage 1 Only Subject' },
    });
    fireEvent.click(modal.getByRole('button', { name: /save email config/i }));

    // Stage 2 must NOT have the badge
    expect(screen.queryByTestId('email-configured-badge-2')).not.toBeInTheDocument();
  });
});
