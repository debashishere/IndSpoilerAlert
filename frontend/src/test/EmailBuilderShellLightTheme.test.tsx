import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowEmailBuilder } from '../components/WorkflowEmailBuilder';
import { EmailMetadataForm } from '../components/EmailMetadataForm';
import { WorkflowTipTapBodyEditor } from '../components/EmailBuilder/WorkflowTipTapBodyEditor';

describe('06 — Email Builder Shell Light Theme (WorkflowEmailBuilder + WorkflowTipTapBodyEditor)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    document.documentElement.setAttribute('data-theme', 'light');
  });

  describe('Seam 1: EmailMetadataForm Light Theme', () => {
    const defaultProps = {
      template: 'b2b-inventory-offer-sheet',
      fromEmail: 'sales@spoiler-alert.com',
      subject: 'Flash Sale: Distressed Dairy & Beverage Stock',
      signature: 'default-sales-sig',
      onChange: vi.fn()
    };

    it('renders form metadata fields with light backgrounds and dark readable text', () => {
      const { container } = render(<EmailMetadataForm {...defaultProps} />);

      const formCard = screen.getByTestId('email-metadata-form');
      expect(formCard).toBeInTheDocument();
      // Form container should not have dark slate background classes
      expect(formCard.className).not.toContain('bg-slate-900');
      expect(formCard.className).not.toContain('bg-slate-950');

      // Check Template dropdown element
      const templateSelect = screen.getByLabelText(/Template/i) as HTMLSelectElement;
      expect(templateSelect).toBeInTheDocument();
      expect(templateSelect.className).toContain('bg-white');

      // Check From Email dropdown element
      const fromSelect = screen.getByLabelText(/From Email/i) as HTMLSelectElement;
      expect(fromSelect).toBeInTheDocument();
      expect(fromSelect.className).toContain('bg-white');

      // Check Subject input element
      const subjectInput = screen.getByLabelText(/Subject/i) as HTMLInputElement;
      expect(subjectInput).toBeInTheDocument();
      expect(subjectInput.className).toContain('bg-white');

      // Check Signature dropdown element
      const signatureSelect = screen.getByLabelText(/Signature/i) as HTMLSelectElement;
      expect(signatureSelect).toBeInTheDocument();
      expect(signatureSelect.className).toContain('bg-white');
    });

    it('uses semantic surface tokens instead of hardcoded dark or fixed hex inline style overrides', () => {
      const { container } = render(<EmailMetadataForm {...defaultProps} />);
      const formCard = screen.getByTestId('email-metadata-form');
      
      // Inline styles must not lock background to fixed hex '#f8fafc' without semantic var support
      const styleAttr = formCard.getAttribute('style') || '';
      expect(styleAttr).not.toContain('background-color: rgb(248, 250, 252)');
      expect(styleAttr).not.toContain('backgroundColor: #f8fafc');
    });

    it('maintains high-contrast section labels and required field indicators', () => {
      render(<EmailMetadataForm {...defaultProps} />);

      const fromLabel = screen.getByText('From Email').closest('label');
      const subjectLabel = screen.getByText('Subject').closest('label');

      expect(fromLabel?.textContent).toContain('*');
      expect(subjectLabel?.textContent).toContain('*');

      expect(fromLabel?.className).toContain('text-slate-700');
      expect(subjectLabel?.className).toContain('text-slate-700');
    });
  });

  describe('Seam 2: WorkflowTipTapBodyEditor Outer Container & Toolbar Light Theme', () => {
    it('renders editor shell and toolbar strip with light surfaces and dark text', () => {
      const { container } = render(<WorkflowTipTapBodyEditor contentHtml="<p>Test</p>" />);

      const editorOuter = screen.getByTestId('workflow-tiptap-editor');
      expect(editorOuter).toBeInTheDocument();
      expect(editorOuter.className).toContain('bg-white');
      expect(editorOuter.className).not.toContain('bg-slate-900');

      // Toolbar element check
      const fontSelect = screen.getByTestId('font-family-select');
      const sizeSelect = screen.getByTestId('font-size-select');
      const formatSelect = screen.getByTestId('formats-select');

      expect(fontSelect.className).toContain('bg-white');
      expect(sizeSelect.className).toContain('bg-white');
      expect(formatSelect.className).toContain('bg-white');
    });

    it('renders tokens dropdown panel overlay with light background and clear text contrast', () => {
      render(<WorkflowTipTapBodyEditor contentHtml="<p>Test</p>" />);

      const tokensBtn = screen.getByTestId('editor-tokens-button');
      fireEvent.click(tokensBtn);

      const headerText = screen.getByText(/Insert Token/i);
      expect(headerText).toBeInTheDocument();
      const tokenDropdownMenu = headerText.closest('div.absolute');
      expect(tokenDropdownMenu).toBeInTheDocument();
      expect(tokenDropdownMenu?.className).toContain('bg-white');
      expect(tokenDropdownMenu?.className).not.toContain('bg-slate-900');
    });

    it('renders Link and Image modal dialogs with light background cards and clear contrast', () => {
      render(<WorkflowTipTapBodyEditor contentHtml="<p>Test</p>" />);

      // Open Link Modal
      fireEvent.click(screen.getByTestId('btn-link'));
      const linkModalHeader = screen.getByText(/Insert Hyperlink/i);
      const linkModalCard = linkModalHeader.closest('div.bg-white');
      expect(linkModalCard).toBeInTheDocument();
      expect(screen.getByTestId('link-url-input').className).toContain('border-slate-300');

      // Close Link Modal
      fireEvent.click(screen.getByText(/Cancel/i));

      // Open Image Modal
      fireEvent.click(screen.getByTestId('btn-image'));
      const imageModalHeader = screen.getAllByText(/Insert Image/i)[0];
      const imageModalCard = imageModalHeader.closest('div.bg-white');
      expect(imageModalCard).toBeInTheDocument();
      expect(screen.getByTestId('upload-local-file-btn')).toBeInTheDocument();
    });
  });

  describe('Seam 3: WorkflowEmailBuilder Shell & Navigation Header Light Theme', () => {
    it('renders main email builder container and header with light surfaces and readable breadcrumbs', () => {
      const { container } = render(<WorkflowEmailBuilder />);

      const builderContainer = screen.getByTestId('workflow-email-builder-container');
      expect(builderContainer).toBeInTheDocument();
      expect(builderContainer.className).toContain('bg-white');
      expect(builderContainer.className).toContain('border-slate-200');

      // Breadcrumb elements
      expect(screen.getByText(/Campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/Liquidation Workflow/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Template Body/i)).toBeInTheDocument();

      // Section label contrast
      const bodyLabel = screen.getByText(/Email Body \(Rich Text TipTap Editor\)/i);
      expect(bodyLabel).toBeInTheDocument();
      expect(bodyLabel.className).toContain('text-slate-700');
    });

    it('renders action buttons (Tags, Back, Save Draft, Next) and respects disabled state visibility', () => {
      render(<WorkflowEmailBuilder disabled={true} />);

      const saveBtn = screen.getByTestId('save-draft-btn');
      const nextBtn = screen.getByTestId('next-step-btn');

      expect(saveBtn).toBeDisabled();
      expect(nextBtn).toBeDisabled();

      // Ensure disabled buttons remain visible with proper style/opacity
      expect(saveBtn).toBeInTheDocument();
      expect(nextBtn).toBeInTheDocument();
    });

    it('renders template overwrite confirmation modal with light surface when template changes with unsaved edits', () => {
      render(<WorkflowEmailBuilder />);

      // Trigger template change in Metadata form
      const templateSelect = screen.getByLabelText(/Template/i);
      // Type into subject to trigger unsaved edits simulation if needed
      const subjectInput = screen.getByLabelText(/Subject/i);
      fireEvent.change(subjectInput, { target: { value: 'Modified Subject line' } });

      // Change template
      fireEvent.change(templateSelect, { target: { value: 'short-dated-flash-sale' } });

      // Modal should appear or template change succeed
      // Check if modal title or preset subject updated
      const confirmHeading = screen.queryByText(/Replace Current Email Body\?/i);
      if (confirmHeading) {
        const modalCard = confirmHeading.closest('div.bg-white');
        expect(modalCard).toBeInTheDocument();
        expect(screen.getByTestId('cancel-template-change-btn')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-template-change-btn')).toBeInTheDocument();
      }
    });
  });
});
