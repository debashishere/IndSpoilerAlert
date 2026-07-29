import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';

describe('Issue #78 / Slice 3: TipTap WYSIWYG Template Editor & Dynamic Token Palette', () => {
  const mockOnSave = vi.fn();
  const mockOnTemplateChange = vi.fn();

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
    vi.stubGlobal('fetch', vi.fn(async (url: string, opts?: any) => {
      if (url.includes('/api/email-templates')) {
        if (opts?.method === 'POST' || opts?.method === 'PUT') {
          const body = JSON.parse(opts.body || '{}');
          return new Response(JSON.stringify({ success: true, template: { ...body, templateId: body.templateId || 'tpl-saved-123' } }), { status: 200 });
        }
        return new Response(JSON.stringify({ success: true, templates: [initialTemplate] }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }));
  });

  it('Slice 3 - Criterion 1: renders TipTap WYSIWYG editor container with subject and toolbar', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Assert main elements render cleanly
    expect(screen.getByText(/TipTap WYSIWYG Email Template Editor/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Distressed Stock Clearance: {{lot_title}}')).toBeInTheDocument();
    expect(screen.getByTestId('tiptap-editor-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('tiptap-editable-content')).toBeInTheDocument();
  });

  it('Slice 3 - Criterion 2: renders 1-click Dynamic Token Chip palette and inserts tokens into content', async () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Verify token chips exist in palette
    expect(screen.getByRole('button', { name: /Buyer Account Name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dynamic Inventory Data Table/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1-Click Buyer Action Link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supplier Organization/i })).toBeInTheDocument();

    // Click on Supplier Organization token chip
    const supplierTokenBtn = screen.getByRole('button', { name: /Supplier Organization/i });
    fireEvent.click(supplierTokenBtn);

    // Assert that content now includes data-token="supplier_name"
    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="supplier_name"');
  });

  it('Slice 3 - Criterion 3: bidirectionally binds template state and issues POST/PUT save requests', async () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Change subject input
    const subjectInput = screen.getByPlaceholderText(/Email subject line/i);
    fireEvent.change(subjectInput, { target: { value: 'Updated Clearance Alert for {{buyer_name}}' } });

    // Click Save Template button
    const saveBtn = screen.getByRole('button', { name: /Save Template/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/email-templates'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Updated Clearance Alert for {{buyer_name}}'
    }));
  });

  it('Slice 3 - Criterion 4: synchronizes editor content in real time with Live Desktop/Mobile preview', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Switch to Mobile Viewport preview mode
    const mobileBtn = screen.getByRole('button', { name: /Mobile View/i });
    fireEvent.click(mobileBtn);

    const previewContainer = screen.getByTestId('live-device-preview');
    expect(previewContainer).toBeInTheDocument();
    expect(previewContainer.className).toContain('max-w-[375px]'); // Mobile width styling

    // Switch back to Desktop Viewport
    const desktopBtn = screen.getByRole('button', { name: /Desktop View/i });
    fireEvent.click(desktopBtn);
    expect(previewContainer.className).toContain('max-w-full');
  });

  it('Slice 3 - Criterion 5: allows creating a new template from scratch or picking presets', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={null}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Should default to templateId "default"
    const templateIdInput = screen.getByPlaceholderText(/templateId/i) as HTMLInputElement;
    expect(templateIdInput.value).toBe('default');

    // Click starter preset button
    const presetBtn = screen.getByRole('button', { name: /Load Starter Clearance Preset/i });
    fireEvent.click(presetBtn);

    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="inventory_table"');
  });

  it('Slice 3 - Seam 2: integrates Centralized Email Template Selector in LiquidationAutomationStudio', async () => {
    const { LiquidationAutomationStudio } = await import('../components/LiquidationAutomationStudio');
    render(
      <LiquidationAutomationStudio supplierId="sup-101" />
    );

    // Verify Centralized Email Template Attachment section exists
    expect(screen.getByText(/Attach Centralized Email Template/i)).toBeInTheDocument();
    expect(screen.getByTestId('attach-email-template-select')).toBeInTheDocument();
  });

  it('allows adding custom variable tokens via input box and inserting them', async () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    const input = screen.getByTestId('add-token-input');
    const addBtn = screen.getByTestId('add-token-button');

    // Add new custom token "discount_percent"
    fireEvent.change(input, { target: { value: 'discount_percent' } });
    fireEvent.click(addBtn);

    // Verify token chip is rendered
    const newTokenChipBtn = screen.getByRole('button', { name: /discount percent Component/i });
    expect(newTokenChipBtn).toBeInTheDocument();

    // Click to insert the new token
    fireEvent.click(newTokenChipBtn);

    // Assert bodyHtml includes data-token="discount_percent"
    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="discount_percent"');
  });

  it('allows removing tokens from availableTokens palette', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // Verify buyer_name chip is present
    expect(screen.getByRole('button', { name: /Buyer Account Name/i })).toBeInTheDocument();

    // Click remove button for buyer_name
    const removeBtn = screen.getByTestId('remove-token-buyer_name');
    fireEvent.click(removeBtn);

    // Verify buyer_name chip is no longer in the document
    expect(screen.queryByRole('button', { name: /Buyer Account Name/i })).not.toBeInTheDocument();
  });

  it('allows picking an Inventory Lot from the dropdown picker to visually render live item table and lot title', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    const lotPicker = screen.getByTestId('inventory-lot-picker') as HTMLSelectElement;
    expect(lotPicker).toBeInTheDocument();

    // Select second lot "sample-lot-912"
    fireEvent.change(lotPicker, { target: { value: 'sample-lot-912' } });

    // Assert live preview container updates with the second lot details
    const compiledContent = screen.getByTestId('compiled-email-content');
    expect(compiledContent.innerHTML).toContain('Artisan Wheat Loaf 400g');
    expect(compiledContent.innerHTML).toContain('Gluten-Free Granola 250g');
  });

  it('Issue 01 - Slice 1: renders toolbar quick insertion controls for Dynamic Header and Dynamic Inventory Table and inserts visual pill badges', () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    const insertHeaderBtn = screen.getByRole('button', { name: /Insert Dynamic Header/i });
    const insertTableBtn = screen.getByRole('button', { name: /Insert Dynamic Inventory Table/i });
    expect(insertHeaderBtn).toBeInTheDocument();
    expect(insertTableBtn).toBeInTheDocument();

    fireEvent.click(insertHeaderBtn);
    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="header"');
    expect(editorContent.innerHTML).toContain('Dynamic Header Component');

    fireEvent.click(insertTableBtn);
    expect(editorContent.innerHTML).toContain('data-token="inventory_table"');
    expect(editorContent.innerHTML).toContain('Dynamic Inventory Table');
  });

  it('Issue 01 - Slice 2: hydrates raw {{token}} Handlebars expressions in bodyHtml to visual UI component pill badges without raw {{}} text', () => {
    const templateWithRawTokens = {
      templateId: 'tpl-raw-tokens',
      name: 'Template With Raw Handlebars Tokens',
      subject: 'Special offer for {{buyer_name}}',
      bodyHtml: '<p>Hello {{buyer_name}}, check expiry: {{expiry_date}} and discount: {{discount_percent}} with {{header}} and {{inventory_table}}.</p>',
      category: 'clearance' as const,
      availableTokens: ['buyer_name', 'expiry_date', 'discount_percent', 'header', 'inventory_table']
    };

    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={templateWithRawTokens}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="buyer_name"');
    expect(editorContent.innerHTML).toContain('data-token="expiry_date"');
    expect(editorContent.innerHTML).toContain('data-token="discount_percent"');
    expect(editorContent.innerHTML).toContain('data-token="header"');
    expect(editorContent.innerHTML).toContain('data-token="inventory_table"');

    expect(editorContent.innerHTML).not.toContain('{{buyer_name}}');
    expect(editorContent.innerHTML).not.toContain('{{expiry_date}}');
  });

  it('Issue 01 - Slice 4: hydrates bracket token syntax [token] in bodyHtml to visual UI component pill badges without raw [] text', () => {
    const templateWithBracketTokens = {
      templateId: 'tpl-bracket-tokens',
      name: 'Template With Square Bracket Tokens',
      subject: 'Special offer for [buyer_name]',
      bodyHtml: '<p>Hello [buyer_name], check discount: [discount_percent] with [inventory_table].</p>',
      category: 'clearance' as const,
      availableTokens: ['buyer_name', 'discount_percent', 'inventory_table']
    };

    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={templateWithBracketTokens}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    const editorContent = screen.getByTestId('tiptap-editable-content');
    expect(editorContent.innerHTML).toContain('data-token="buyer_name"');
    expect(editorContent.innerHTML).toContain('data-token="discount_percent"');
    expect(editorContent.innerHTML).toContain('data-token="inventory_table"');

    expect(editorContent.innerHTML).not.toContain('[buyer_name]');
    expect(editorContent.innerHTML).not.toContain('[discount_percent]');
  });

  it('Issue 01 - Slice 3: clicking any dynamic UI pill in editor content or toolbar Info button opens activeTokenInfoModal with injected dynamic fields and sample values', async () => {
    render(
      <TipTapTemplateEditor
        supplierId="sup-101"
        initialTemplate={initialTemplate}
        onSave={mockOnSave}
        onChange={mockOnTemplateChange}
      />
    );

    // 1. Test clicking Toolbar Dynamic Token Info button
    const toolbarInfoBtn = screen.getByTestId('toolbar-token-info-button');
    fireEvent.click(toolbarInfoBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Dynamic Inventory Data Table').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Dynamically Injected Fields:')).toBeInTheDocument();
      expect(screen.getByText('✓ Quantity (Cases)')).toBeInTheDocument();
    });

    // Close modal
    const modalCloseBtn = screen.getByTestId('close-token-info-modal');
    fireEvent.click(modalCloseBtn);

    // 2. Test clicking palette Info button for Buyer Account Name
    const paletteInfoBtns = screen.getAllByTitle(/View Dynamic Workflow Data Schema/i);
    expect(paletteInfoBtns.length).toBeGreaterThan(0);
    fireEvent.click(paletteInfoBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Buyer Account Name').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Dynamically Injected Fields:')).toBeInTheDocument();
      expect(screen.getByText('✓ Buyer Account Name')).toBeInTheDocument();
    });
  });
});




