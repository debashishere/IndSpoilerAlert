import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { EmailMetadataForm } from '../components/EmailMetadataForm';
import { TagsDrawer, MERGE_TAG_CATEGORIES } from '../components/TagsDrawer';
import { WorkflowEmailBuilder } from '../components/WorkflowEmailBuilder';

describe('EmailMetadataForm & TagsDrawer - Slice 3 TDD', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* SEAM 1: EmailMetadataForm Component                                        */
  /* -------------------------------------------------------------------------- */
  describe('Seam 1: EmailMetadataForm', () => {
    const defaultProps = {
      template: 'distressed-stock-v1',
      fromEmail: 'sales@spoiler-alert.com',
      subject: 'Flash Sale: Distressed Dairy & Beverage Stock',
      signature: 'default-sales-sig',
      templates: [
        { id: 'distressed-stock-v1', name: 'Distressed Stock Clearance' },
        { id: 'auction-notice-v1', name: 'Liquidation Auction Notice' }
      ],
      fromEmailOptions: ['sales@spoiler-alert.com', 'clearance@spoiler-alert.com', 'deals@spoiler-alert.com'],
      signatures: [
        { id: 'default-sales-sig', name: 'Default Sales Operations Team' },
        { id: 'executive-sig', name: 'Executive Director Signature' }
      ],
      onChange: vi.fn()
    };

    test('renders all 4 metadata fields: Template, From Email*, Subject*, and Signature', () => {
      render(<EmailMetadataForm {...defaultProps} />);

      expect(screen.getByLabelText(/Template/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/From Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Signature/i)).toBeInTheDocument();
    });

    test('displays current values in form fields', () => {
      render(<EmailMetadataForm {...defaultProps} />);

      expect(screen.getByLabelText(/Template/i)).toHaveValue('distressed-stock-v1');
      expect(screen.getByLabelText(/From Email/i)).toHaveValue('sales@spoiler-alert.com');
      expect(screen.getByLabelText(/Subject/i)).toHaveValue('Flash Sale: Distressed Dairy & Beverage Stock');
      expect(screen.getByLabelText(/Signature/i)).toHaveValue('default-sales-sig');
    });

    test('calls onChange handler when template, fromEmail, subject, or signature changes', () => {
      const handleChange = vi.fn();
      render(<EmailMetadataForm {...defaultProps} onChange={handleChange} />);

      const subjectInput = screen.getByLabelText(/Subject/i);
      fireEvent.change(subjectInput, { target: { value: 'New Liquidation Offer {{lot.number}}' } });
      expect(handleChange).toHaveBeenCalledWith('subject', 'New Liquidation Offer {{lot.number}}');

      const templateSelect = screen.getByLabelText(/Template/i);
      fireEvent.change(templateSelect, { target: { value: 'auction-notice-v1' } });
      expect(handleChange).toHaveBeenCalledWith('template', 'auction-notice-v1');

      const fromSelect = screen.getByLabelText(/From Email/i);
      fireEvent.change(fromSelect, { target: { value: 'clearance@spoiler-alert.com' } });
      expect(handleChange).toHaveBeenCalledWith('fromEmail', 'clearance@spoiler-alert.com');

      const sigSelect = screen.getByLabelText(/Signature/i);
      fireEvent.change(sigSelect, { target: { value: 'executive-sig' } });
      expect(handleChange).toHaveBeenCalledWith('signature', 'executive-sig');
    });

    test('shows required asterisk indicator for From Email and Subject', () => {
      render(<EmailMetadataForm {...defaultProps} />);

      const fromLabel = screen.getByText('From Email').closest('label');
      const subjectLabel = screen.getByText('Subject').closest('label');

      expect(fromLabel?.textContent).toContain('*');
      expect(subjectLabel?.textContent).toContain('*');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* SEAM 2: TagsDrawer Component                                               */
  /* -------------------------------------------------------------------------- */
  describe('Seam 2: TagsDrawer', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onSelectTag: vi.fn()
    };

    test('renders slide-out panel header with "< Tags" title and close button when isOpen is true', () => {
      render(<TagsDrawer {...defaultProps} />);

      expect(screen.getByTestId('tags-drawer-panel')).toBeInTheDocument();
      expect(screen.getByText(/Tags/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<TagsDrawer {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('renders 4 domain categories: Buyer, Inventory Lot, Supplier/Agent, and Action Links', () => {
      render(<TagsDrawer {...defaultProps} />);

      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('Inventory Lot')).toBeInTheDocument();
      expect(screen.getByText('Supplier/Agent')).toBeInTheDocument();
      expect(screen.getByText('Action Links')).toBeInTheDocument();
    });

    test('renders domain merge tag pills: {{buyer.name}}, {{lot.number}}, {{lot.inventory_table_html}}, {{quick_bid_link}}', () => {
      render(<TagsDrawer {...defaultProps} />);

      expect(screen.getByText('{{buyer.name}}')).toBeInTheDocument();
      expect(screen.getByText('{{lot.number}}')).toBeInTheDocument();
      expect(screen.getByText('{{lot.inventory_table_html}}')).toBeInTheDocument();
      expect(screen.getByText('{{quick_bid_link}}')).toBeInTheDocument();
    });

    test('filters merge tag pills when searching in the search bar', () => {
      render(<TagsDrawer {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search merge tags/i);
      fireEvent.change(searchInput, { target: { value: 'inventory_table' } });

      expect(screen.getByText('{{lot.inventory_table_html}}')).toBeInTheDocument();
      expect(screen.queryByText('{{buyer.name}}')).not.toBeInTheDocument();
    });

    test('invokes onSelectTag with full token string when tag pill is clicked', () => {
      const handleSelectTag = vi.fn();
      render(<TagsDrawer {...defaultProps} onSelectTag={handleSelectTag} />);

      const tagPill = screen.getByText('{{buyer.name}}');
      fireEvent.click(tagPill);

      expect(handleSelectTag).toHaveBeenCalledWith('{{buyer.name}}');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* SEAM 3: Integrated WorkflowEmailBuilder Metadata & Dynamic Tags Drawer     */
  /* -------------------------------------------------------------------------- */
  describe('Seam 3: WorkflowEmailBuilder Integration', () => {
    test('renders EmailMetadataForm and TagsDrawer toggle in WorkflowEmailBuilder', () => {
      render(<WorkflowEmailBuilder />);

      expect(screen.getByTestId('email-metadata-form')).toBeInTheDocument();
      expect(screen.getByTestId('tags-drawer-toggle')).toBeInTheDocument();
    });

    test('toggles slide-out TagsDrawer when toggle button is clicked', () => {
      render(<WorkflowEmailBuilder />);

      const toggleButton = screen.getByTestId('tags-drawer-toggle');
      expect(screen.queryByTestId('tags-drawer-panel')).not.toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByTestId('tags-drawer-panel')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('tags-drawer-panel')).not.toBeInTheDocument();
    });

    test('inserts clicked merge tag token into Subject input when Subject is focused or active', () => {
      render(<WorkflowEmailBuilder />);

      const toggleButton = screen.getByTestId('tags-drawer-toggle');
      fireEvent.click(toggleButton);

      const subjectInput = screen.getByLabelText(/Subject/i) as HTMLInputElement;
      fireEvent.focus(subjectInput);

      const tagPill = screen.getByText('{{lot.number}}');
      fireEvent.click(tagPill);

      expect(subjectInput.value).toContain('{{lot.number}}');
    });
  });
});
