import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';

describe('Issue #02 — Standalone Template Editor "Buyer Account Name" Token Chip', () => {
  const mockOnSave = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Buyer Account Name" in the dynamic token palette', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        onSave={mockOnSave}
        onChange={mockOnChange}
      />
    );

    // Verify "Buyer Account Name" chip is listed in the dynamic token palette
    const buyerNameChip = screen.getByRole('button', { name: /Buyer Account Name/i });
    expect(buyerNameChip).toBeInTheDocument();
  });

  it('inserts an uneditable interactive pill element into the WYSIWYG editor canvas when "Buyer Account Name" chip is clicked', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        onSave={mockOnSave}
        onChange={mockOnChange}
      />
    );

    const buyerNameChip = screen.getByRole('button', { name: /Buyer Account Name/i });
    fireEvent.click(buyerNameChip);

    const editorContent = screen.getByTestId('tiptap-editable-content');
    // Verify interactive pill element with contenteditable="false" and data-token="buyer_name" is inserted
    expect(editorContent.innerHTML).toContain('data-token="buyer_name"');
    expect(editorContent.innerHTML).toContain('contenteditable="false"');
    expect(editorContent.innerHTML).toContain('Buyer Account Name');
  });

  it('allows creating and saving email templates in standalone mode with {{buyer_name}} unbound placeholder without requiring buyer selection', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, opts?: any) => {
      const body = JSON.parse(opts?.body || '{}');
      return new Response(
        JSON.stringify({
          success: true,
          template: { ...body, _id: 'tpl-new-99' }
        }),
        { status: 200 }
      );
    }));

    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        onSave={mockOnSave}
        onChange={mockOnChange}
      />
    );

    // Click "Buyer Account Name" chip to insert into canvas
    const buyerNameChip = screen.getByRole('button', { name: /Buyer Account Name/i });
    fireEvent.click(buyerNameChip);

    // Save template
    const saveBtn = screen.getByRole('button', { name: /Save Template/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyHtml: expect.stringContaining('data-token="buyer_name"')
        })
      );
    });
  });
});
