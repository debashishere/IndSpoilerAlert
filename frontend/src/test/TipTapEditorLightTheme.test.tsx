import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';

describe('07 — TipTap Rich Editor Light Theme (TipTapTemplateEditor)', () => {
  const mockOnSave = vi.fn();
  const mockOnChange = vi.fn();

  const initialTemplate = {
    templateId: 'custom-clearance-01',
    name: 'Short-Dated Clearance Offer',
    subject: 'Distressed Stock Clearance: {{lot_title}}',
    bodyHtml: '<p>Dear {{buyer_name}},</p><p>We have urgent stock available:</p>{{inventory_table}}<p><a href="{{quick_bid_link}}">Place Bid Now</a></p>',
    category: 'clearance' as const,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name']
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.setAttribute('data-theme', 'light');
  });

  describe('Seam 1: TipTapTemplateEditor Header Bar, Preset Select & Overwrite Modal Light Theme', () => {
    it('renders header bar and template metadata controls with light surfaces and readable text', () => {
      const { container } = render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      // Template picker select
      const templatePicker = screen.getByTestId('template-picker-select') as HTMLSelectElement;
      expect(templatePicker).toBeInTheDocument();
      expect(templatePicker.className).toContain('bg-white');
      expect(templatePicker.className).toContain('text-slate-800');

      // Header fields (Name, templateId Ref, Category, Subject Line)
      const nameInput = screen.getByPlaceholderText('Template Name') as HTMLInputElement;
      expect(nameInput.className).toContain('bg-white');
      expect(nameInput.className).toContain('text-slate-900');

      const templateIdInput = screen.getByPlaceholderText('templateId') as HTMLInputElement;
      expect(templateIdInput.className).toContain('bg-white');
      expect(templateIdInput.className).toContain('text-slate-900');

      const subjectInput = screen.getByPlaceholderText('Email subject line') as HTMLInputElement;
      expect(subjectInput.className).toContain('bg-white');
      expect(subjectInput.className).toContain('text-slate-900');
    });

    it('renders overwrite confirmation modal with white card background and dark text when preset is changed with existing content', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      const templatePicker = screen.getByTestId('template-picker-select');
      fireEvent.change(templatePicker, { target: { value: 'short-dated-flash-sale' } });

      const confirmText = screen.getByText(/Replace editor content with selected template\?/i);
      expect(confirmText).toBeInTheDocument();

      const modalCard = confirmText.closest('div.rounded-2xl');
      expect(modalCard).toBeInTheDocument();
      expect(modalCard?.className).toContain('bg-white');
      expect(modalCard?.className).toContain('dark:bg-slate-900');
      expect(confirmText.className).toContain('text-slate-900');
    });
  });

  describe('Seam 2: Dynamic Token Palette & Sample Data Mapping Light Theme', () => {
    it('renders dynamic token palette container and input fields with light background surfaces', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      // Custom token input
      const addTokenInput = screen.getByTestId('add-token-input');
      expect(addTokenInput.className).toContain('bg-white');
      expect(addTokenInput.className).toContain('text-slate-900');

      // Inventory lot picker
      const lotPicker = screen.getByTestId('inventory-lot-picker');
      expect(lotPicker.className).toContain('bg-white');
      expect(lotPicker.className).toContain('text-slate-800');

      // Sample data inputs
      const sampleBuyerInput = screen.getByTestId('sample-data-input-buyer_name');
      expect(sampleBuyerInput.className).toContain('bg-white');
      expect(sampleBuyerInput.className).toContain('text-slate-900');
    });

    it('renders token chips palette with readable contrasting backgrounds and borders', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      const buyerChipBtn = screen.getByRole('button', { name: /Buyer Account Name/i });
      const chipContainer = buyerChipBtn.closest('div.inline-flex');
      expect(chipContainer).toBeInTheDocument();
      expect(chipContainer?.className).toContain('bg-indigo-50');
      expect(chipContainer?.className).toContain('border-indigo-200');
    });
  });

  describe('Seam 3: TipTap Editor Toolbar, Canvas Surface & Token Info Modal Light Theme', () => {
    it('renders toolbar strip and toolbar buttons with light surfaces', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      const toolbar = screen.getByTestId('tiptap-editor-toolbar');
      expect(toolbar.className).toContain('bg-slate-50');
      expect(toolbar.className).toContain('dark:bg-slate-900');

      const boldBtn = screen.getByTitle('Bold');
      expect(boldBtn.className).toContain('bg-white');
      expect(boldBtn.className).toContain('text-slate-700');
    });

    it('renders editable content canvas writing surface in light mode with high-contrast readable dark text', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      const canvas = screen.getByTestId('tiptap-editable-content');
      expect(canvas.className).toContain('bg-white');
      expect(canvas.className).toContain('text-slate-800');
    });

    it('renders dynamic token info popup modal with white card surface and clear dark text contrast', () => {
      render(
        <TipTapTemplateEditor
          supplierId="sup-101"
          initialTemplate={initialTemplate}
          onSave={mockOnSave}
          onChange={mockOnChange}
        />
      );

      const infoBtn = screen.getByTestId('toolbar-token-info-button');
      fireEvent.click(infoBtn);

      const modalTitle = screen.getByTestId('active-token-info-title');
      expect(modalTitle).toBeInTheDocument();

      const modalCard = modalTitle.closest('div.rounded-2xl');
      expect(modalCard).toBeInTheDocument();
      expect(modalCard?.className).toContain('bg-white');
      expect(modalCard?.className).toContain('dark:bg-slate-900');
      expect(modalTitle.className).toContain('text-slate-900');
    });
  });
});
