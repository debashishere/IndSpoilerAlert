import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';

describe('Template Picker Dropdown & Overwrite Confirmation Modal', () => {
  const defaultProps = {
    supplierId: 'supplier-123'
  };

  it('renders template picker dropdown in toolbar with B2B presets and Blank Slate', () => {
    render(<TipTapTemplateEditor {...defaultProps} />);

    const select = screen.getByTestId('template-picker-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.options).map((opt) => opt.text);
    expect(options.some((opt) => opt.includes('B2B Inventory Offer Sheet'))).toBe(true);
    expect(options.some((opt) => opt.includes('Short-Dated Flash Sale'))).toBe(true);
    expect(options.some((opt) => opt.includes('Bulk Clearance Announcement'))).toBe(true);
    expect(options.some((opt) => opt.includes('Blank Slate'))).toBe(true);
  });

  it('prompts overwrite confirmation modal when selecting template on non-empty editor', () => {
    render(<TipTapTemplateEditor {...defaultProps} initialTemplate={{
      templateId: 'custom-1',
      name: 'Custom',
      subject: 'Sub',
      bodyHtml: '<p>User typed active text</p>',
      category: 'clearance'
    }} />);

    const select = screen.getByTestId('template-picker-select');
    fireEvent.change(select, { target: { value: 'short-dated-flash-sale' } });

    expect(screen.getByText(/Replace editor content with selected template\?/i)).toBeInTheDocument();
  });

  it('replaces editor content when confirmation modal is accepted', () => {
    render(<TipTapTemplateEditor {...defaultProps} initialTemplate={{
      templateId: 'custom-1',
      name: 'Custom',
      subject: 'Sub',
      bodyHtml: '<p>Original text</p>',
      category: 'clearance'
    }} />);

    const select = screen.getByTestId('template-picker-select');
    fireEvent.change(select, { target: { value: 'short-dated-flash-sale' } });

    const confirmBtn = screen.getByTestId('confirm-overwrite-template-button');
    fireEvent.click(confirmBtn);

    const editable = screen.getByTestId('tiptap-editable-content');
    expect(editable.innerHTML).toContain('Time-Sensitive Clearance Opportunity');
  });

  it('retains existing content when confirmation modal is canceled', () => {
    render(<TipTapTemplateEditor {...defaultProps} initialTemplate={{
      templateId: 'custom-1',
      name: 'Custom',
      subject: 'Sub',
      bodyHtml: '<p>Original text untouched</p>',
      category: 'clearance'
    }} />);

    const select = screen.getByTestId('template-picker-select');
    fireEvent.change(select, { target: { value: 'short-dated-flash-sale' } });

    const cancelBtn = screen.getByTestId('cancel-overwrite-template-button');
    fireEvent.click(cancelBtn);

    const editable = screen.getByTestId('tiptap-editable-content');
    expect(editable.innerHTML).toContain('Original text untouched');
  });

  it('loads template immediately without prompt if editor is empty', () => {
    render(<TipTapTemplateEditor {...defaultProps} initialTemplate={{
      templateId: 'custom-1',
      name: 'Custom',
      subject: 'Sub',
      bodyHtml: '',
      category: 'clearance'
    }} />);

    const select = screen.getByTestId('template-picker-select');
    fireEvent.change(select, { target: { value: 'short-dated-flash-sale' } });

    expect(screen.queryByText(/Replace editor content with selected template\?/i)).not.toBeInTheDocument();
    const editable = screen.getByTestId('tiptap-editable-content');
    expect(editable.innerHTML).toContain('Time-Sensitive Clearance Opportunity');
  });
});
