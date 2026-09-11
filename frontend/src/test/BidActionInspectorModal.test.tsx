import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import BidActionInspectorModal from '../components/BidActionInspectorModal';

describe('Frontend Seam A: BidActionInspectorModal (Issue #02)', () => {
  const sampleBid = {
    _id: 'bid-101',
    lotId: 'lot-101',
    buyerId: {
      _id: 'buyer-1',
      companyName: 'Apex Liquidators',
      email: 'apex@liquidators.com'
    },
    price: 3.50,
    quantity: 150,
    status: 'pending',
    submittedAt: '2026-09-08T10:00:00.000Z',
    messages: [
      {
        sender: 'buyer',
        content: 'Initial offer submitted at $3.50/cs for 150 cases.',
        timestamp: '2026-09-08T10:00:00.000Z'
      }
    ]
  };

  const sampleLot = {
    _id: 'lot-101',
    lotNumber: 'LOT-99',
    standardSellPrice: 5.00,
    productId: {
      sku: 'SKU-APPLES',
      description: 'Organic Honeycrisp Apples'
    }
  };

  it('renders active bid details, buyer info, and lot summary header', () => {
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
      />
    );

    // Modal title & lot header
    expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();
    expect(screen.getByText(/LOT-99/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Organic Honeycrisp Apples/i)[0]).toBeInTheDocument();

    // Buyer info & commercial metrics
    expect(screen.getAllByText(/Apex Liquidators/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/apex@liquidators.com/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/\$3\.50/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/150/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/\$525\.00/i)[0]).toBeInTheDocument(); // 150 * 3.50
  });

  it('renders 3 mode tabs and allows switching to Decline Offer mode', () => {
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
      />
    );

    expect(screen.getByRole('button', { name: /accept offer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /re-negotiate/i })).toBeInTheDocument();
    const declineTabBtn = screen.getByRole('button', { name: /decline offer/i });
    expect(declineTabBtn).toBeInTheDocument();

    // Switch to decline tab
    fireEvent.click(declineTabBtn);

    expect(screen.getByText(/Mandatory Decline Reason/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decline Reason/i)).toBeInTheDocument();
  });

  it('enforces mandatory decline reason selection and invokes onDecline with reason and rationale', () => {
    const onDeclineMock = vi.fn();
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
        onDecline={onDeclineMock}
      />
    );

    // Switch to decline mode
    fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

    const confirmBtn = screen.getByRole('button', { name: /confirm decline/i });
    // Initially disabled when no reason is selected
    expect(confirmBtn).toBeDisabled();

    // Select a reason
    const selectEl = screen.getByLabelText(/Decline Reason/i);
    fireEvent.change(selectEl, {
      target: { value: 'Price below minimum recovery floor' }
    });

    // Enter optional rationale notes
    const notesInput = screen.getByPlaceholderText(/Add specific rationale or notes/i);
    fireEvent.change(notesInput, {
      target: { value: 'Minimum floor is $4.20/cs for this harvest.' }
    });

    // Button should now be enabled
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onDeclineMock).toHaveBeenCalledTimes(1);
    expect(onDeclineMock).toHaveBeenCalledWith({
      reason: 'Price below minimum recovery floor',
      rationale: 'Minimum floor is $4.20/cs for this harvest.'
    });
  });

  it('renders adaptive lifecycle override control when bid is rejected and triggers onReset', () => {
    const onResetMock = vi.fn();
    const rejectedBid = {
      ...sampleBid,
      status: 'rejected'
    };

    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={rejectedBid}
        lot={sampleLot}
        onReset={onResetMock}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /reset bid to pending/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  it('renders chronological Negotiation History Thread with buyer bids, supplier counter proposals, system notices, and timestamps', () => {
    const bidWithThread = {
      ...sampleBid,
      status: 'countered',
      messages: [
        {
          sender: 'buyer',
          content: 'Initial baseline offer submitted.',
          timestamp: '2026-09-08T10:00:00.000Z',
          proposedPrice: 3.50,
          proposedQuantity: 150
        },
        {
          sender: 'supplier',
          content: 'Supplier counter-offer: $4.10/cs for 120 cases due to tight margins.',
          timestamp: '2026-09-08T11:00:00.000Z',
          proposedPrice: 4.10,
          proposedQuantity: 120
        },
        {
          sender: 'system',
          content: 'Negotiation state transitioned to countered.',
          timestamp: '2026-09-08T11:00:01.000Z'
        }
      ]
    };

    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={bidWithThread}
        lot={sampleLot}
      />
    );

    // Thread header
    expect(screen.getByText(/Negotiation History Thread/i)).toBeInTheDocument();

    // Verify messages content
    expect(screen.getByText(/Initial baseline offer submitted\./i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier counter-offer: \$4\.10\/cs for 120 cases due to tight margins\./i)).toBeInTheDocument();
    expect(screen.getByText(/Negotiation state transitioned to countered\./i)).toBeInTheDocument();

    // Verify badges / roles
    expect(screen.getByText('Buyer Initial Bid')).toBeInTheDocument();
    expect(screen.getByText('Supplier Counter')).toBeInTheDocument();
    expect(screen.getByText('System Notice')).toBeInTheDocument();

    // Verify proposed terms rendered in supplier counter
    expect(screen.getAllByText(/\$4\.10/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/120/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows filling counter terms and dispatches onCounter callback with price, quantity, and message', () => {
    const onCounterMock = vi.fn();
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
        onCounter={onCounterMock}
      />
    );

    // Switch to counter mode
    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);
    const messageInput = screen.getByPlaceholderText(/explain your counter-offer parameters/i);

    fireEvent.change(priceInput, { target: { value: '4.25' } });
    fireEvent.change(quantityInput, { target: { value: '100' } });
    fireEvent.change(messageInput, { target: { value: 'Countering at $4.25 for 100 cases' } });

    const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
    expect(dispatchBtn).not.toBeDisabled();
    fireEvent.click(dispatchBtn);

    expect(onCounterMock).toHaveBeenCalledTimes(1);
    expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
      price: 4.25,
      quantity: 100,
      message: expect.stringContaining('Countering at $4.25 for 100 cases')
    }));
  });

  it('renders a Split 2-Column Work Surface layout in Re-negotiate / Counter mode', () => {
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
      />
    );

    // Switch to counter mode
    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const splitSurface = screen.getByTestId('counter-split-work-surface');
    expect(splitSurface).toBeInTheDocument();

    const leftPane = screen.getByTestId('counter-left-pane');
    expect(leftPane).toBeInTheDocument();
    // Left pane contains Counter Price, Counter Quantity, and the Negotiation History Thread
    expect(leftPane).toContainElement(screen.getByPlaceholderText(/enter counter price/i));
    expect(leftPane).toContainElement(screen.getByPlaceholderText(/enter counter quantity/i));
    expect(leftPane).toContainElement(screen.getByText(/Negotiation History Thread/i));

    const rightPane = screen.getByTestId('counter-right-pane');
    expect(rightPane).toBeInTheDocument();
    // Right pane contains outbound message staging and dispatch button
    expect(rightPane).toContainElement(screen.getByPlaceholderText(/explain your counter-offer parameters/i));
    expect(rightPane).toContainElement(screen.getByRole('button', { name: /dispatch counter-offer/i }));
  });

  it('displays live delta indicators comparing counter terms against buyer original offer', () => {
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid} // price: 3.50, quantity: 150, total: 525.00
        lot={sampleLot}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);

    // Enter counter price $4.20 (+0.70 / +20.0%) and quantity 150 (Total: 630.00 -> +$105.00 / +20.0%)
    fireEvent.change(priceInput, { target: { value: '4.20' } });
    fireEvent.change(quantityInput, { target: { value: '150' } });

    const deltaContainer = screen.getByTestId('counter-delta-indicators');
    expect(deltaContainer).toBeInTheDocument();

    // Verify price delta indicator
    expect(deltaContainer).toHaveTextContent(/\+\$0\.70/);
    expect(deltaContainer).toHaveTextContent(/\+20(\.0)?%/);

    // Verify total recovery delta indicator
    expect(deltaContainer).toHaveTextContent(/\+\$105\.00/);

    // Now test a reduction/lower offer
    fireEvent.change(priceInput, { target: { value: '3.00' } });
    fireEvent.change(quantityInput, { target: { value: '100' } }); // 300.00 vs 525.00 -> -$225.00, price -$0.50 (-14.3%)
    expect(deltaContainer).toHaveTextContent(/-\$0\.50/);
    expect(deltaContainer).toHaveTextContent(/-14\.3%/);
    expect(deltaContainer).toHaveTextContent(/-\$225\.00/);
  });

  it('enforces live validation requiring non-empty, positive numeric values for price and quantity', () => {
    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        bid={sampleBid}
        lot={sampleLot}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);
    const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });

    // Invalid when price is 0
    fireEvent.change(priceInput, { target: { value: '0' } });
    fireEvent.change(quantityInput, { target: { value: '100' } });
    expect(dispatchBtn).toBeDisabled();
    expect(screen.getByText(/counter price must be greater than zero/i)).toBeInTheDocument();

    // Invalid when price is negative
    fireEvent.change(priceInput, { target: { value: '-2' } });
    expect(dispatchBtn).toBeDisabled();

    // Invalid when quantity is 0 or negative
    fireEvent.change(priceInput, { target: { value: '4.00' } });
    fireEvent.change(quantityInput, { target: { value: '0' } });
    expect(dispatchBtn).toBeDisabled();
    expect(screen.getByText(/counter quantity must be greater than zero/i)).toBeInTheDocument();

    // Valid when both are positive
    fireEvent.change(quantityInput, { target: { value: '120' } });
    expect(dispatchBtn).not.toBeDisabled();
  });

  it('enforces In-Situ Negotiation Continuity: retains open modal, updates status badge to Countered, appends proposal to thread, and emits success toast on counter dispatch', async () => {
    const onCounterMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <BidActionInspectorModal
        isOpen={true}
        onClose={onCloseMock}
        bid={sampleBid}
        lot={sampleLot}
        onCounter={onCounterMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

    const priceInput = screen.getByPlaceholderText(/enter counter price/i);
    const quantityInput = screen.getByPlaceholderText(/enter counter quantity/i);
    const messageInput = screen.getByPlaceholderText(/explain your counter-offer parameters/i);

    fireEvent.change(priceInput, { target: { value: '4.50' } });
    fireEvent.change(quantityInput, { target: { value: '140' } });
    fireEvent.change(messageInput, { target: { value: 'Countering with standard margin requirement.' } });

    const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
    fireEvent.click(dispatchBtn);

    expect(onCounterMock).toHaveBeenCalledTimes(1);
    expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
      price: 4.50,
      quantity: 140,
      message: expect.stringContaining('Countering with standard margin requirement.')
    }));

    // In-Situ Continuity: onClose must NOT have been called
    expect(onCloseMock).not.toHaveBeenCalled();

    // Modal remains visible
    expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();

    // Status badge updates to Countered
    await waitFor(() => {
      expect(screen.getByTestId('modal-status-badge')).toHaveTextContent(/countered/i);
    });

    // The newly sent proposal is appended to the visible thread in the left pane
    const leftPane = screen.getByTestId('counter-left-pane');
    expect(within(leftPane).getByText(/Countering with standard margin requirement\./i)).toBeInTheDocument();
    expect(within(leftPane).getByText(/\$4\.50\/cs/i)).toBeInTheDocument();
    expect(within(leftPane).getByText(/140 cases/i)).toBeInTheDocument();

    // Success toast notification
    expect(await screen.findByText(/Counter-offer successfully dispatched/i)).toBeInTheDocument();
  });

  describe('Issue 03C — Seam 1: Embedded TipTap Canvas & Negotiation Tokens Wiring', () => {
    it('embeds WorkflowTipTapBodyEditor in counter mode right pane and renders negotiation tokens', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

      const rightPane = screen.getByTestId('counter-right-pane');
      // WorkflowTipTapBodyEditor should be rendered inside right pane replacing textarea
      expect(within(rightPane).getByTestId('workflow-tiptap-editor')).toBeInTheDocument();

      // Open Tokens dropdown
      const tokensBtn = within(rightPane).getByTestId('editor-tokens-button');
      fireEvent.click(tokensBtn);

      const tokensDropdown = screen.getByTestId('editor-tokens-dropdown');
      // Verify all negotiation tokens are present in dropdown
      expect(within(tokensDropdown).getByText('{{buyer_name}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{product_name}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{counter_price}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{counter_quantity}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{original_price}}')).toBeInTheDocument();

      // Insert counter_price token and verify editor contains the token badge
      fireEvent.click(within(tokensDropdown).getByText('{{counter_price}}'));
      const editorContent = rightPane.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
      expect(editorContent?.innerHTML).toContain('data-token="counter_price"');
    });
  });

  describe('Issue 03C — Seam 2: TipTap Custom Toolbar & Formatting Controls', () => {
    it('surfaces font picker, text size, and named format controls in embedded toolbar', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const rightPane = screen.getByTestId('counter-right-pane');

      // Font family selector
      const fontSelect = within(rightPane).getByTestId('font-family-select') as HTMLSelectElement;
      expect(fontSelect).toBeInTheDocument();
      expect(within(fontSelect).getByText('Verdana')).toBeInTheDocument();
      expect(within(fontSelect).getByText('Inter')).toBeInTheDocument();
      expect(within(fontSelect).getByText('Arial')).toBeInTheDocument();
      fireEvent.change(fontSelect, { target: { value: 'Inter' } });
      expect(fontSelect.value).toBe('Inter');

      // Font size selector
      const sizeSelect = within(rightPane).getByTestId('font-size-select') as HTMLSelectElement;
      expect(sizeSelect).toBeInTheDocument();
      expect(within(sizeSelect).getByText('9pt')).toBeInTheDocument();
      expect(within(sizeSelect).getByText('14pt')).toBeInTheDocument();
      expect(within(sizeSelect).getByText('36pt')).toBeInTheDocument();
      fireEvent.change(sizeSelect, { target: { value: '14pt' } });
      expect(sizeSelect.value).toBe('14pt');

      // Named formats selector
      const formatSelect = within(rightPane).getByTestId('formats-select') as HTMLSelectElement;
      expect(formatSelect).toBeInTheDocument();
      expect(within(formatSelect).getByText('Paragraph')).toBeInTheDocument();
      expect(within(formatSelect).getByText('Heading 1')).toBeInTheDocument();
      expect(within(formatSelect).getByText('Heading 2')).toBeInTheDocument();
      expect(within(formatSelect).getByText('Heading 3')).toBeInTheDocument();
      expect(within(formatSelect).getByText('Blockquote')).toBeInTheDocument();
      fireEvent.change(formatSelect, { target: { value: 'Heading 2' } });
      expect(formatSelect.value).toBe('Heading 2');
    });

    it('surfaces text alignments, color pickers, and opens hyperlink & image insertion modals', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const rightPane = screen.getByTestId('counter-right-pane');

      // Alignments
      expect(within(rightPane).getByTestId('btn-align-left')).toBeInTheDocument();
      expect(within(rightPane).getByTestId('btn-align-center')).toBeInTheDocument();
      expect(within(rightPane).getByTestId('btn-align-right')).toBeInTheDocument();
      expect(within(rightPane).getByTestId('btn-align-justify')).toBeInTheDocument();
      fireEvent.click(within(rightPane).getByTestId('btn-align-center'));

      // Color pickers
      const textColorPicker = within(rightPane).getByTestId('text-color-picker');
      const bgColorPicker = within(rightPane).getByTestId('bg-color-picker');
      expect(textColorPicker).toBeInTheDocument();
      expect(bgColorPicker).toBeInTheDocument();
      fireEvent.change(textColorPicker, { target: { value: '#2563eb' } });

      // Hyperlink Modal
      const linkBtn = within(rightPane).getByTestId('btn-link');
      fireEvent.click(linkBtn);
      expect(screen.getByText(/Insert Hyperlink/i)).toBeInTheDocument();
      const linkUrlInput = screen.getByTestId('link-url-input');
      expect(linkUrlInput).toBeInTheDocument();
      const applyLinkBtn = screen.getByTestId('apply-link-btn');
      expect(applyLinkBtn).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByText(/Insert Hyperlink/i)).not.toBeInTheDocument();

      // Image Modal
      const imgBtn = within(rightPane).getByTestId('btn-image');
      fireEvent.click(imgBtn);
      expect(screen.getByRole('heading', { name: /Insert Image/i })).toBeInTheDocument();
      expect(screen.getByTestId('image-url-input')).toBeInTheDocument();
      expect(screen.getByTestId('upload-local-file-btn')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByRole('heading', { name: /Insert Image/i })).not.toBeInTheDocument();
    });
  });

  describe('Issue 03C — Seam 3: Submission Guardrail & Dispatch Integration', () => {
    it('disables TipTap editor canvas and dispatch button when isSubmitting is true', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
          isSubmitting={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const rightPane = screen.getByTestId('counter-right-pane');

      // TipTap editor canvas must not be editable
      const editorCanvas = rightPane.querySelector('.ProseMirror');
      expect(editorCanvas).toBeInTheDocument();
      expect(editorCanvas?.getAttribute('contenteditable')).toBe('false');

      // Dispatch button must be disabled
      const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
      expect(dispatchBtn).toBeDisabled();
    });

    it('propagates rich HTML message with inserted tokens to onCounter callback and preserves in-situ continuity', async () => {
      const onCounterMock = vi.fn().mockResolvedValue(undefined);
      const onCloseMock = vi.fn();

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={onCloseMock}
          bid={sampleBid}
          lot={sampleLot}
          onCounter={onCounterMock}
          isSubmitting={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const rightPane = screen.getByTestId('counter-right-pane');

      // Insert dynamic tokens
      const tokensBtn = within(rightPane).getByTestId('editor-tokens-button');
      fireEvent.click(tokensBtn);
      const dropdown1 = screen.getByTestId('editor-tokens-dropdown');
      fireEvent.click(within(dropdown1).getByText('{{counter_price}}'));

      fireEvent.click(tokensBtn);
      const dropdown2 = screen.getByTestId('editor-tokens-dropdown');
      fireEvent.click(within(dropdown2).getByText('{{product_name}}'));

      // Dispatch counter offer
      const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
      expect(dispatchBtn).not.toBeDisabled();
      fireEvent.click(dispatchBtn);

      // Verify onCounter payload contains rich HTML with inserted token attributes
      expect(onCounterMock).toHaveBeenCalledTimes(1);
      expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
        price: 3.50,
        quantity: 150,
        message: expect.stringContaining('data-token="counter_price"')
      }));
      expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('data-token="product_name"')
      }));

      // In-situ continuity: modal stays open
      expect(onCloseMock).not.toHaveBeenCalled();
      expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();

      // Negotiation thread shows newly dispatched proposal with rendered token badge
      const leftPane = screen.getByTestId('counter-left-pane');
      await waitFor(() => {
        expect(within(leftPane).getByText(/Supplier Counter/i)).toBeInTheDocument();
      });
      const badges = leftPane.querySelectorAll('.token-badge-pill');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Issue 03D — Counter Negotiation Email Preset & Live-Evaluating Token Badge Sync', () => {
    describe('Seam 1: Initial Counter Preset Auto-Population', () => {
      it('auto-populates TipTap editor with standard counter negotiation preset containing token pills when switching to counter mode', async () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Counter mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

        const rightPane = screen.getByTestId('counter-right-pane');
        const editorCanvas = rightPane.querySelector('.ProseMirror');
        expect(editorCanvas).toBeInTheDocument();

        // Check that preset text is present in the editor canvas
        expect(editorCanvas?.textContent).toContain('Dear');
        expect(editorCanvas?.textContent).toContain('We propose a counter-offer');

        // Check that dynamic token pills exist in the editor canvas for all required tokens
        const tokenPills = editorCanvas?.querySelectorAll('.token-badge-pill');
        expect(tokenPills).toBeDefined();
        const dataTokens = Array.from(tokenPills || []).map((el) => el.getAttribute('data-token'));

        expect(dataTokens).toContain('buyer_name');
        expect(dataTokens).toContain('product_name');
        expect(dataTokens).toContain('counter_price');
        expect(dataTokens).toContain('counter_quantity');
        expect(dataTokens).toContain('original_price');
      });

      it('preserves existing draft when switching away to another tab and switching back', async () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Counter mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

        const rightPane = screen.getByTestId('counter-right-pane');
        const editorCanvas = rightPane.querySelector('.ProseMirror');
        expect(editorCanvas).toBeInTheDocument();

        // User edits custom text in editor
        fireEvent.change(screen.getByLabelText(/Direct Message \/ Terms to Buyer Raw Input/i), {
          target: { value: '<p>Custom negotiated terms for urgent pickup.</p>' }
        });

        // Switch to Accept mode
        fireEvent.click(screen.getByRole('button', { name: /accept offer/i }));
        expect(screen.queryByTestId('counter-right-pane')).not.toBeInTheDocument();

        // Switch back to Counter mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
        const updatedRightPane = screen.getByTestId('counter-right-pane');
        const updatedCanvas = updatedRightPane.querySelector('.ProseMirror');

        // Should NOT be overwritten with default template
        expect(updatedCanvas?.textContent).toContain('Custom negotiated terms for urgent pickup');
      });
    });

    describe('Seam 2: Live-Evaluating Token Badge Sync', () => {
      it('dynamically updates token badge display text in real-time when typing into counter price and quantity inputs', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Counter mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

        const rightPane = screen.getByTestId('counter-right-pane');
        const editorCanvas = rightPane.querySelector('.ProseMirror');
        expect(editorCanvas).toBeInTheDocument();

        // Initial token badges evaluation
        const priceBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="counter_price"]');
        const quantityBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="counter_quantity"]');
        const buyerBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="buyer_name"]');
        const productBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="product_name"]');
        const origPriceBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="original_price"]');

        expect(priceBadge).toBeInTheDocument();
        expect(quantityBadge).toBeInTheDocument();
        expect(buyerBadge).toBeInTheDocument();
        expect(productBadge).toBeInTheDocument();
        expect(origPriceBadge).toBeInTheDocument();

        // Check initial resolved values
        expect(priceBadge?.textContent).toBe('[$3.50/cs]');
        expect(quantityBadge?.textContent).toBe('[150 cases]');
        expect(buyerBadge?.textContent).toBe('[Apex Liquidators]');
        expect(productBadge?.textContent).toBe('[Organic Honeycrisp Apples]');
        expect(origPriceBadge?.textContent).toBe('[$3.50/cs]');

        // Now modify Counter Price input in left pane to 14.50
        const priceInput = screen.getByPlaceholderText(/Enter counter price/i);
        fireEvent.change(priceInput, { target: { value: '14.50' } });

        // Token badge for counter_price should immediately reflect [$14.50/cs]
        expect(priceBadge?.textContent).toBe('[$14.50/cs]');
        expect(priceBadge?.getAttribute('data-token')).toBe('counter_price');

        // Modify Counter Quantity input in left pane to 200
        const quantityInput = screen.getByPlaceholderText(/Enter counter quantity/i);
        fireEvent.change(quantityInput, { target: { value: '200' } });

        // Token badge for counter_quantity should immediately reflect [200 cases]
        expect(quantityBadge?.textContent).toBe('[200 cases]');
        expect(quantityBadge?.getAttribute('data-token')).toBe('counter_quantity');
      });
    });

    describe('Seam 3: Non-Destructive Custom Text & Data-Token Preservation', () => {
      it('preserves custom typed text and clauses when inputs are modified and retains data-token attributes in onCounter dispatch', async () => {
        const onCounterMock = vi.fn().mockResolvedValue(undefined);

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
            onCounter={onCounterMock}
          />
        );

        // Switch to Counter mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

        const rightPane = screen.getByTestId('counter-right-pane');
        const editorCanvas = rightPane.querySelector('.ProseMirror');
        expect(editorCanvas).toBeInTheDocument();

        // Custom text added by user in the draft
        const customMessageWithTokens =
          '<p>Special clause: Delivery must be finalized by Friday.</p><p>We propose a counter-offer for <span data-token="product_name">{{product_name}}</span> at <span data-token="counter_price">{{counter_price}}</span> for <span data-token="counter_quantity">{{counter_quantity}}</span> cases.</p><p>Supplier note: No pallet exchange required.</p>';

        fireEvent.change(screen.getByLabelText(/Direct Message \/ Terms to Buyer Raw Input/i), {
          target: { value: customMessageWithTokens }
        });

        // Verify canvas contains custom user text
        expect(editorCanvas?.textContent).toContain('Special clause: Delivery must be finalized by Friday.');
        expect(editorCanvas?.textContent).toContain('Supplier note: No pallet exchange required.');

        // Now change Counter Price and Counter Quantity in the left pane
        const priceInput = screen.getByPlaceholderText(/Enter counter price/i);
        fireEvent.change(priceInput, { target: { value: '16.50' } });

        const quantityInput = screen.getByPlaceholderText(/Enter counter quantity/i);
        fireEvent.change(quantityInput, { target: { value: '180' } });

        // Custom text and clauses MUST still be intact
        expect(editorCanvas?.textContent).toContain('Special clause: Delivery must be finalized by Friday.');
        expect(editorCanvas?.textContent).toContain('Supplier note: No pallet exchange required.');

        // Token badges display updated live values
        const priceBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="counter_price"]');
        const quantityBadge = editorCanvas?.querySelector('.token-badge-pill[data-token="counter_quantity"]');
        expect(priceBadge?.textContent).toBe('[$16.50/cs]');
        expect(quantityBadge?.textContent).toBe('[180 cases]');

        // Underlying data-token attributes are preserved
        expect(priceBadge?.getAttribute('data-token')).toBe('counter_price');
        expect(quantityBadge?.getAttribute('data-token')).toBe('counter_quantity');

        // Dispatch the counter offer
        const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
        fireEvent.click(dispatchBtn);

        // Verify onCounter payload preserves custom sentences and data-token attributes
        expect(onCounterMock).toHaveBeenCalledTimes(1);
        expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
          price: 16.50,
          quantity: 180,
          message: expect.stringContaining('Special clause: Delivery must be finalized by Friday.')
        }));
        expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('Supplier note: No pallet exchange required.')
        }));
        expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('data-token="counter_price"')
        }));
        expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('data-token="counter_quantity"')
        }));
      });
    });
  });

  describe('Issue 03E — Resilient Mailbox Dispatch & Telemetry Toasts', () => {
    it('displays success toast when email delivers successfully', async () => {
      const onCounterMock = vi.fn().mockResolvedValue({
        success: true,
        emailDispatch: { dispatched: true, messageId: 'msg-success-03e' }
      });

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
          onCounter={onCounterMock}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
      fireEvent.click(dispatchBtn);

      await waitFor(() => {
        expect(screen.getByText(/Counter-offer successfully dispatched/i)).toBeInTheDocument();
      });
      expect(screen.getByTestId('in-situ-success-icon')).toBeInTheDocument();
    });

    it('displays warning toast with delivery telemetry details if mail transport was disconnected', async () => {
      const onCounterMock = vi.fn().mockResolvedValue({
        success: true,
        emailDispatch: {
          dispatched: false,
          warning: 'Google OAuth token expired or SMTP unreachable'
        }
      });

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
          onCounter={onCounterMock}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
      const dispatchBtn = screen.getByRole('button', { name: /dispatch counter-offer/i });
      fireEvent.click(dispatchBtn);

      await waitFor(() => {
        expect(screen.getByText(/email dispatch warning: Google OAuth token expired or SMTP unreachable/i)).toBeInTheDocument();
      });
      expect(screen.getByTestId('in-situ-warning-icon')).toBeInTheDocument();
      // In-situ continuity: modal stays open and status is Countered
      expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();
      expect(screen.getByTestId('modal-status-badge')).toHaveTextContent(/countered/i);
    });
  });

  describe('Issue 04 — Bid Acceptance Action Flow & Settlement Email', () => {
    const lotWithDC = {
      _id: 'lot-101',
      lotNumber: 'LOT-99',
      standardSellPrice: 5.00,
      productId: {
        sku: 'SKU-APPLES',
        brand: 'SunHarvest',
        description: 'Organic Honeycrisp Apples'
      },
      distributionCenterId: {
        _id: 'dc-1',
        name: 'Denver Central Depot',
        address: '450 Logistics Blvd, Denver, CO 80202',
        operatingHours: '08:00 AM - 04:30 PM CST'
      }
    };

    it('pre-populates DC logistics (pickup address and dock operating hours) and allows supplier edits', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={lotWithDC}
        />
      );

      // In accept mode (default)
      const addressInput = screen.getByLabelText(/dc pickup address/i) as HTMLInputElement;
      const hoursInput = screen.getByLabelText(/dock operating hours/i) as HTMLInputElement;

      expect(addressInput.value).toBe('450 Logistics Blvd, Denver, CO 80202');
      expect(hoursInput.value).toBe('08:00 AM - 04:30 PM CST');

      // Edit address and hours
      fireEvent.change(addressInput, { target: { value: '500 Logistics Way, Aurora, CO' } });
      expect(addressInput.value).toBe('500 Logistics Way, Aurora, CO');
    });

    it('embeds TipTap editor in Accept mode with auto-populated Acceptance & Settlement template and settlement tokens', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={lotWithDC}
        />
      );

      const acceptSurface = screen.getByTestId('accept-work-surface');
      expect(within(acceptSurface).getByTestId('workflow-tiptap-editor')).toBeInTheDocument();

      // Open Tokens dropdown
      const tokensBtn = within(acceptSurface).getByTestId('editor-tokens-button');
      fireEvent.click(tokensBtn);

      const tokensDropdown = screen.getByTestId('editor-tokens-dropdown');
      expect(within(tokensDropdown).getByText('{{product_name}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{sku}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{awarded_quantity}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{price_per_case}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{total_amount}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{pickup_location}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{pickup_hours}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{payment_link}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{deal_document_link}}')).toBeInTheDocument();
    });

    it('supports full or partial allocation with live deal total and calls onAccept with logistics and template', async () => {
      const onAcceptMock = vi.fn().mockResolvedValue({
        success: true,
        status: 'fully_accepted',
        emailDispatch: { dispatched: true }
      });

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={lotWithDC}
          onAccept={onAcceptMock}
        />
      );

      const awardedQtyInput = screen.getByLabelText(/awarded quantity/i) as HTMLInputElement;
      expect(awardedQtyInput.value).toBe('150');

      // Check total settlement display
      expect(screen.getByTestId('total-settlement-value')).toHaveTextContent('$525.00'); // 150 * 3.50

      // Change to partial allocation
      fireEvent.change(awardedQtyInput, { target: { value: '100' } });
      expect(screen.getByTestId('total-settlement-value')).toHaveTextContent('$350.00'); // 100 * 3.50

      const confirmBtn = screen.getByRole('button', { name: /confirm & initiate settlement/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onAcceptMock).toHaveBeenCalledTimes(1);
        expect(onAcceptMock).toHaveBeenCalledWith(expect.objectContaining({
          awardedQuantity: 100,
          pickupAddress: '450 Logistics Blvd, Denver, CO 80202',
          pickupHours: '08:00 AM - 04:30 PM CST',
          templateHtml: expect.any(String)
        }));
      });
    });

    it('displays post-acceptance deal actions and allows resending settlement communications', async () => {
      const acceptedBid = {
        ...sampleBid,
        status: 'fully_accepted',
        awardedQty: 150
      };
      const onResendMock = vi.fn();

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={acceptedBid}
          lot={lotWithDC}
          onResendSettlement={onResendMock}
        />
      );

      // Verify status badge
      expect(screen.getByTestId('modal-status-badge')).toHaveTextContent(/fully_accepted/i);

      // Post-acceptance actions
      expect(screen.getByRole('button', { name: /resend settlement communications/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view deal settlement portal/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /resend settlement communications/i }));
      expect(onResendMock).toHaveBeenCalledWith('bid-101');
    });
  });
});




