import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StageEmailModal } from '../components/domain/workflows/StageEmailModal';

// ─── shared test doubles ──────────────────────────────────────────────────────

const noOp = vi.fn();

const defaultProps = {
  open: true,
  stageIndex: 2,
  initialData: {
    emailSubject: '',
    emailBodyHtml: '',
    emailTemplateId: 'default',
  },
  onSave: noOp,
  onClose: noOp,
};

beforeEach(() => {
  vi.restoreAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

// ─── Seam A: modal renders stage header + all 4 sections visible ─────────────

describe('StageEmailModal — Seam A: renders with stage header and all sections', () => {
  test('displays the correct stage number in the modal header', () => {
    render(<StageEmailModal {...defaultProps} stageIndex={2} />);

    expect(screen.getByText(/Stage 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Configuration/i)).toBeInTheDocument();
  });

  test('all 4 section headings are visible simultaneously (no step nav)', () => {
    render(<StageEmailModal {...defaultProps} />);

    // Each section heading is rendered as a <span> — getAllByText handles duplicates
    expect(screen.getAllByText(/Email Template/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Email Subject/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Edit Email Body/i)).toBeInTheDocument();
    // Preview heading rendered inside an Eye-icon div
    expect(screen.getByText(/^Preview$/i)).toBeInTheDocument();
  });

  test('modal is not rendered when open=false', () => {
    render(<StageEmailModal {...defaultProps} open={false} />);

    expect(screen.queryByText(/Email Configuration/i)).not.toBeInTheDocument();
  });
});

// ─── Seam B: Cancel / Escape fires onClose, never onSave ─────────────────────

describe('StageEmailModal — Seam B: Cancel and Escape close without saving', () => {
  test('clicking Cancel fires onClose and does not fire onSave', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<StageEmailModal {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  test('pressing Escape fires onClose and does not fire onSave', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<StageEmailModal {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

// ─── Seam C: pre-seeded subject appears in subject input ─────────────────────

describe('StageEmailModal — Seam C: modal opens pre-seeded with initialData', () => {
  test('subject input is pre-populated with initialData.emailSubject', () => {
    render(
      <StageEmailModal
        {...defaultProps}
        initialData={{
          emailSubject: 'Stage 2 Priority Clearance Offer',
          emailBodyHtml: '',
          emailTemplateId: 'default',
        }}
      />
    );

    // Subject input is always visible — no navigation needed
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    expect(subjectInput).toHaveValue('Stage 2 Priority Clearance Offer');
  });
});

// ─── Seam D: Save fires onSave with current local values ─────────────────────

describe('StageEmailModal — Seam D: Save commits local state via onSave', () => {
  test('clicking "Save Email Config" calls onSave with the current subject value', () => {
    const onSave = vi.fn();
    render(
      <StageEmailModal
        {...defaultProps}
        onSave={onSave}
        initialData={{
          emailSubject: 'Original Subject',
          emailBodyHtml: '',
          emailTemplateId: 'default',
        }}
      />
    );

    // Subject input is always visible — edit it directly
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    fireEvent.change(subjectInput, { target: { value: 'Updated Subject' } });

    fireEvent.click(screen.getByRole('button', { name: /save email config/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ emailSubject: 'Updated Subject' })
    );
  });
});

// ─── Seam G: Section Minimise / Expand Toggles ───────────────────────────────

describe('StageEmailModal — Seam G: section minimise / expand toggles', () => {
  test('minimise button toggles Edit Email Body visibility', () => {
    render(<StageEmailModal {...defaultProps} />);

    const minimiseBtn = screen.getByTestId('minimise-body-btn');
    expect(minimiseBtn).toHaveTextContent(/Minimise/i);

    // Click to minimise
    fireEvent.click(minimiseBtn);
    expect(minimiseBtn).toHaveTextContent(/Expand/i);

    // Click again to expand
    fireEvent.click(minimiseBtn);
    expect(minimiseBtn).toHaveTextContent(/Minimise/i);
  });

  test('minimise button toggles Preview section visibility', () => {
    render(<StageEmailModal {...defaultProps} />);

    const minimiseBtn = screen.getByTestId('minimise-preview-btn');
    expect(minimiseBtn).toHaveTextContent(/Minimise/i);

    // Click to minimise
    fireEvent.click(minimiseBtn);
    expect(minimiseBtn).toHaveTextContent(/Expand/i);

    // Click again to expand
    fireEvent.click(minimiseBtn);
    expect(minimiseBtn).toHaveTextContent(/Minimise/i);
  });

  test('does not render minimise buttons on Email Template or Email Subject sections', () => {
    render(<StageEmailModal {...defaultProps} />);

    expect(screen.queryByTestId('minimise-template-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('minimise-subject-btn')).not.toBeInTheDocument();
  });

  test('applies ColorHunt radiant palette gradient to modal backdrop dialog', () => {
    render(<StageEmailModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.style.background).toContain('radial-gradient');
    expect(dialog.style.background).toContain('rgba(227, 242, 253');
    expect(dialog.style.background).toContain('rgba(144, 202, 249');
    expect(dialog.style.background).toContain('rgba(33, 150, 243');
    expect(dialog.style.background).toContain('rgba(13, 71, 161');
  });

  test('clicking Token Config button inside email body editor opens Dynamic Token Config modal', () => {
    render(<StageEmailModal {...defaultProps} />);

    const tokenConfigBtn = screen.getByTestId('editor-dynamic-token-config-button');
    expect(tokenConfigBtn).toBeInTheDocument();

    fireEvent.click(tokenConfigBtn);

    expect(screen.getByTestId('dynamic-token-config-modal')).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Token Config/i)).toBeInTheDocument();
  });
});
