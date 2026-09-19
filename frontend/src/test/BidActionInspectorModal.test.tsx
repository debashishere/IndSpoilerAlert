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
    expect(onDeclineMock).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'Price below minimum recovery floor',
      rationale: 'Minimum floor is $4.20/cs for this harvest.'
    }));
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

  it('renders chronological negotiation events in Timeline Tab and removes Negotiation History Thread from action tabs', () => {
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

    // Switch to Negotiate tab and verify Negotiation History Thread is not in tabs
    fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));
    expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

    // Switch to Timeline tab where chronological negotiation events are rendered
    fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
    expect(screen.getByTestId('timeline-activity-feed')).toBeInTheDocument();

    // Verify messages content in Timeline
    expect(screen.getByText(/Initial offer submitted at \$3\.50\/cs for 150 cases/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier counter-offer: \$4\.10\/cs for 120 cases due to tight margins\./i)).toBeInTheDocument();
    expect(screen.getByText(/Status Transition: Active Counter Proposal/i)).toBeInTheDocument();

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
    // Left pane contains Counter Price and Counter Quantity (Negotiation History Thread is removed)
    expect(leftPane).toContainElement(screen.getByPlaceholderText(/enter counter price/i));
    expect(leftPane).toContainElement(screen.getByPlaceholderText(/enter counter quantity/i));
    expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

    const rightPane = screen.getByTestId('counter-right-pane');
    expect(rightPane).toBeInTheDocument();
    // Right pane contains outbound message staging
    expect(rightPane).toContainElement(screen.getByPlaceholderText(/explain your counter-offer parameters/i));
    expect(screen.getByRole('button', { name: /dispatch counter-offer/i })).toBeInTheDocument();
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

    // Verify Negotiation History Thread is not in the left pane
    const leftPane = screen.getByTestId('counter-left-pane');
    expect(within(leftPane).queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

    // The newly sent proposal is recorded in the Timeline tab
    fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
    expect(screen.getByText(/Countering with standard margin requirement\./i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier Counter-Offer Dispatched/i)).toBeInTheDocument();

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
      expect(within(tokensDropdown).getByText('{{accept_counter_link}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{renegotiate_link}}')).toBeInTheDocument();

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

      // Verify Negotiation History Thread is not in the left pane
      const leftPane = screen.getByTestId('counter-left-pane');
      expect(within(leftPane).queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

      // Dispatched proposal is recorded in the Timeline tab
      fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
      await waitFor(() => {
        expect(screen.getByText(/Supplier Counter-Offer Dispatched/i)).toBeInTheDocument();
      });
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
        expect(editorCanvas?.textContent).toContain('Accept Counter-Offer');
        expect(editorCanvas?.textContent).toContain('Propose New Terms / Re-bid');

        // Check that CTA buttons are present
        const acceptBtn = editorCanvas?.querySelector('a[href*="accept_counter_link"]');
        const rebidBtn = editorCanvas?.querySelector('a[href*="renegotiate_link"]');
        expect(acceptBtn).toBeInTheDocument();
        expect(rebidBtn).toBeInTheDocument();

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

  describe('Issue 18: Slice 1 — Decline Offer Full Composer & 2-Column Split Work Surface (Seam 1B)', () => {
    it('renders 2-column split work surface with Decline Notice TipTap composer in right pane', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      // Switch to decline tab
      fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

      // Left pane controls
      expect(screen.getByLabelText(/Decline Reason/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Add specific rationale or notes/i)).toBeInTheDocument();

      // Right pane composer
      const rightPane = screen.getByTestId('decline-right-pane');
      expect(rightPane).toBeInTheDocument();
      expect(within(rightPane).getByText(/Decline Notice Email Template/i)).toBeInTheDocument();
    });

    it('dynamically populates decline tokens and dispatches onDecline with templateHtml and emailSubject', async () => {
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

      fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

      // Select reason
      fireEvent.change(screen.getByLabelText(/Decline Reason/i), {
        target: { value: 'Price below minimum recovery floor' }
      });

      // Enter rationale
      fireEvent.change(screen.getByPlaceholderText(/Add specific rationale or notes/i), {
        target: { value: 'Minimum floor is $4.50/cs for Honeycrisp' }
      });

      const confirmBtn = screen.getByRole('button', { name: /confirm decline/i });
      expect(confirmBtn).not.toBeDisabled();

      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onDeclineMock).toHaveBeenCalledWith(expect.objectContaining({
          reason: 'Price below minimum recovery floor',
          rationale: 'Minimum floor is $4.50/cs for Honeycrisp',
          templateHtml: expect.any(String),
          emailSubject: expect.stringContaining('Organic Honeycrisp Apples')
        }));
      });
    });

    it('surfaces decline tokens in dropdown and preserves data-token badges for decline parameters', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

      const rightPane = screen.getByTestId('decline-right-pane');
      expect(within(rightPane).getByTestId('workflow-tiptap-editor')).toBeInTheDocument();

      const tokensBtn = within(rightPane).getByTestId('editor-tokens-button');
      fireEvent.click(tokensBtn);

      const tokensDropdown = screen.getByTestId('editor-tokens-dropdown');
      expect(within(tokensDropdown).getByText('{{buyer_name}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{product_name}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{lot_number}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{decline_reason}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{decline_rationale}}')).toBeInTheDocument();
      expect(within(tokensDropdown).getByText('{{catalog_link}}')).toBeInTheDocument();

      const editorContent = rightPane.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
      expect(editorContent?.innerHTML).toContain('data-token="decline_reason"');
    });
  });


  describe('Issue 18: Slice 2 — In-Situ Thread Bid Acceptance with Dynamic Token Re-Hydration (Seam 2A)', () => {
    const threadBid = {
      _id: 'bid-thread-1',
      lotId: 'lot-101',
      buyerId: {
        _id: 'buyer-1',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 3.50,
      quantity: 150,
      status: 'pending',
      messages: [
        {
          sender: 'buyer',
          content: 'Initial baseline offer.',
          timestamp: '2026-09-08T10:00:00.000Z',
          proposedPrice: 3.50,
          proposedQuantity: 150
        },
        {
          sender: 'supplier',
          content: 'Supplier counter: $4.50 for 130 cases.',
          timestamp: '2026-09-08T11:00:00.000Z',
          proposedPrice: 4.50,
          proposedQuantity: 130
        },
        {
          sender: 'buyer',
          content: 'Revised buyer proposal: $4.25/cs for 140 cases.',
          timestamp: '2026-09-08T12:00:00.000Z',
          proposedPrice: 4.25,
          proposedQuantity: 140
        }
      ]
    };

    const lotWithDC = {
      _id: 'lot-101',
      lotNumber: 'LOT-99',
      availableQty: 200,
      standardSellPrice: 5.00,
      distributionCenter: {
        address: '100 Main Logistics Way, Chicago, IL',
        operatingHours: '08:00 AM - 04:30 PM CST'
      },
      productId: {
        sku: 'SKU-APPLES',
        description: 'Organic Honeycrisp Apples'
      }
    };

    it('verifies Negotiation History Thread is removed from action tabs and consolidated in Timeline', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={threadBid}
          lot={lotWithDC}
        />
      );

      // Verify Negotiation History Thread is removed from Accept tab
      expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

      // Switch to Negotiate mode and verify Negotiation History Thread is removed
      fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));
      expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

      // Switch to Decline mode and verify Negotiation History Thread is removed
      fireEvent.click(screen.getByRole('button', { name: /decline/i }));
      expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

      // Switch to Timeline tab and verify negotiation history is present
      fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
      expect(screen.getByTestId('timeline-activity-feed')).toBeInTheDocument();
      expect(screen.getByText(/\$4\.25\/cs for 140 cases/i)).toBeInTheDocument();
    });

    it('safely renders buyer messages containing HTML or script tags as text without XSS vulnerability in Timeline', () => {
      const maliciousBid = {
        ...threadBid,
        messages: [
          {
            sender: 'buyer',
            content: '<script>window.__xssExecuted = true;</script><img src="x" onerror="window.__xssImg = true;" />Proposal with payload',
            timestamp: '2026-09-08T10:00:00.000Z',
            proposedPrice: 4.10,
            proposedQuantity: 100
          }
        ]
      };

      const { container } = render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={maliciousBid}
          lot={lotWithDC}
        />
      );

      // Switch to Timeline tab
      fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

      // Verify that no script tag or raw HTML element was executed or inserted
      expect(container.querySelector('script')).toBeNull();
      // The text content should be rendered safely as visible string text
      expect(screen.getByText(/<script>window\.__xssExecuted = true;<\/script>/i)).toBeInTheDocument();
    });
  });

  describe('Dual-Figure Pricing & Settlement Banner (Issue #02)', () => {
    const negotiatedBid = {
      _id: 'bid-accepted-negotiated',
      lotId: 'lot-101',
      buyerId: {
        _id: 'buyer-1',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 29.00,
      finalPrice: 30.00,
      quantity: 100,
      awardedQty: 100,
      status: 'fully_accepted',
      dealId: 'deal-101'
    };

    const sampleLot = {
      _id: 'lot-101',
      lotNumber: 'LOT-99',
      standardSellPrice: 35.00,
      productId: {
        sku: 'SKU-APPLES',
        description: 'Organic Honeycrisp Apples'
      }
    };

    it('renders prominent settled price, Settled badge, and initial bid subtitle in Unit Offer card and computes gross recovery from settled terms for negotiated accepted offer', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={negotiatedBid}
          lot={sampleLot}
        />
      );

      // Top summary: Unit Offer card
      const unitOfferCard = screen.getByTestId('summary-unit-offer');
      expect(unitOfferCard).toBeInTheDocument();
      expect(within(unitOfferCard).getByText(/\$30\.00/i)).toBeInTheDocument();
      expect(within(unitOfferCard).getByText(/Settled/i)).toBeInTheDocument();
      expect(within(unitOfferCard).getByText(/Initial Bid:\s*\$29\.00\s*\/case/i)).toBeInTheDocument();

      // Top summary: Gross Recovery card (100 * $30.00 = $3,000.00)
      const grossRecoveryCard = screen.getByTestId('summary-gross-recovery');
      expect(grossRecoveryCard).toBeInTheDocument();
      expect(within(grossRecoveryCard).getByText(/\$3,000\.00/i)).toBeInTheDocument();
    });

    it('renders dual-figure settlement copy in the active settlement banner for negotiated accepted offer', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={negotiatedBid}
          lot={sampleLot}
        />
      );

      const banner = screen.getByTestId('settlement-active-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(
        'This offer has been awarded for 100 cases to Apex Liquidators at $30.00/case (negotiated from initial bid of $29.00/case). Total settlement value: $3,000.00.'
      );
    });

    it('renders standard unit price without Settled badge or delta messaging when offer is accepted without negotiation', () => {
      const standardAcceptedBid = {
        ...negotiatedBid,
        _id: 'bid-accepted-standard',
        price: 25.00,
        finalPrice: 25.00,
        quantity: 80,
        awardedQty: 80,
        status: 'fully_accepted'
      };

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={standardAcceptedBid}
          lot={sampleLot}
        />
      );

      // Unit Offer card: Clean unit price without Settled badge or Initial Bid subtitle
      const unitOfferCard = screen.getByTestId('summary-unit-offer');
      expect(within(unitOfferCard).getByText(/\$25\.00/i)).toBeInTheDocument();
      expect(within(unitOfferCard).queryByText(/Settled/i)).toBeNull();
      expect(within(unitOfferCard).queryByText(/Initial Bid/i)).toBeNull();

      // Gross recovery: 80 * 25 = $2,000.00
      const grossRecoveryCard = screen.getByTestId('summary-gross-recovery');
      expect(within(grossRecoveryCard).getByText(/\$2,000\.00/i)).toBeInTheDocument();

      // Settlement banner: Clean copy without delta messaging
      const banner = screen.getByTestId('settlement-active-banner');
      expect(banner).toHaveTextContent(
        'This offer has been awarded for 80 cases to Apex Liquidators at $25.00/case. Total settlement value: $2,000.00.'
      );
      expect(banner).not.toHaveTextContent(/negotiated from initial bid/i);
    });

    it('renders clean standard unit price and banner when accepted offer has undefined finalPrice', () => {
      const standardAcceptedBidNoFinal = {
        ...negotiatedBid,
        _id: 'bid-accepted-no-final',
        price: 22.00,
        finalPrice: undefined,
        quantity: 50,
        awardedQty: 50,
        status: 'fully_accepted'
      };

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={standardAcceptedBidNoFinal}
          lot={sampleLot}
        />
      );

      const unitOfferCard = screen.getByTestId('summary-unit-offer');
      expect(within(unitOfferCard).getByText(/\$22\.00/i)).toBeInTheDocument();
      expect(within(unitOfferCard).queryByText(/Settled/i)).toBeNull();

      const grossRecoveryCard = screen.getByTestId('summary-gross-recovery');
      expect(within(grossRecoveryCard).getByText(/\$1,100\.00/i)).toBeInTheDocument();

      const banner = screen.getByTestId('settlement-active-banner');
      expect(banner).toHaveTextContent(
        'This offer has been awarded for 50 cases to Apex Liquidators at $22.00/case. Total settlement value: $1,100.00.'
      );
      expect(banner).not.toHaveTextContent(/negotiated from initial bid/i);
    });
  });

  describe('Issue 01 — Stitch Header & 4-Column Commercial Stat Cards', () => {
    const stitchBid = {
      _id: 'bid-stitch-101',
      lotId: 'lot-stitch-101',
      buyerId: {
        _id: 'buyer-apex',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 24.50,
      quantity: 200,
      status: 'pending',
      submittedAt: '2026-09-18T00:00:00.000Z',
      messages: []
    };

    const stitchLot = {
      _id: 'lot-stitch-101',
      lotNumber: 'LOT-550',
      availableQty: 250,
      quantity: 250,
      reservePrice: 20.00,
      productId: {
        sku: 'SKU-ORGANIC-APPLES',
        description: 'Premium Honeycrisp Apples'
      }
    };

    it('renders modal shell with Stitch styling and header exit control (header preview button removed)', () => {
      const { container } = render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={stitchBid}
          lot={stitchLot}
        />
      );

      // Workspace container has full-screen operational workspace classes
      const workspaceShell = container.querySelector('[data-testid="bid-action-inspector-workspace"]') || container.firstElementChild;
      expect(workspaceShell).toBeInTheDocument();
      expect(workspaceShell?.className).toContain('fixed');
      expect(workspaceShell?.className).toContain('inset-0');
      expect(workspaceShell?.className).toContain('w-screen');
      expect(workspaceShell?.className).toContain('h-screen');

      // Header tags and title
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(within(header!).getByText(/LOT-550/i)).toBeInTheDocument();
      expect(within(header!).getByText(/SKU-ORGANIC-APPLES/i)).toBeInTheDocument();
      expect(within(header!).getByTestId('modal-status-badge')).toHaveTextContent(/pending/i);
      expect(within(header!).getByText(/Premium Honeycrisp Apples/i)).toBeInTheDocument();

      // Header preview email button removed; close control preserved
      expect(within(header!).queryByTestId('header-preview-email-btn')).toBeNull();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /maximize inspector/i })).toBeNull();
    });

    it('renders all 4 commercial stat cards with dynamic metrics, verified badge, allocation % and net clearing', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={stitchBid}
          lot={stitchLot}
        />
      );

      // Card 1: Buyer Organization
      const buyerCard = screen.getByTestId('summary-buyer-org');
      expect(buyerCard).toBeInTheDocument();
      expect(within(buyerCard).getByText('Apex Liquidators')).toBeInTheDocument();
      expect(within(buyerCard).getByTestId('buyer-verified-badge')).toBeInTheDocument();
      const mailtoLink = within(buyerCard).getByRole('link', { name: /apex@liquidators\.com/i });
      expect(mailtoLink).toHaveAttribute('href', 'mailto:apex@liquidators.com');

      // Card 2: Unit Offer
      const unitOfferCard = screen.getByTestId('summary-unit-offer');
      expect(unitOfferCard).toBeInTheDocument();
      expect(within(unitOfferCard).getByText(/\$24\.50/i)).toBeInTheDocument();
      expect(within(unitOfferCard).getByText(/Floor:\s*\$20\.00/i)).toBeInTheDocument();

      // Card 3: Volume Requested (200 cases out of 250 = 80%)
      const volumeCard = screen.getByTestId('summary-volume-requested');
      expect(volumeCard).toBeInTheDocument();
      expect(within(volumeCard).getByText(/200/i)).toBeInTheDocument();
      expect(within(volumeCard).getByText(/80%/i)).toBeInTheDocument();
      expect(within(volumeCard).getByText(/Partial Clearing/i)).toBeInTheDocument();

      // Card 4: Gross Recovery ($4,900.00 with 3% fee -> $4,753.00 net)
      const recoveryCard = screen.getByTestId('summary-gross-recovery');
      expect(recoveryCard).toBeInTheDocument();
      expect(within(recoveryCard).getByText(/\$4,900\.00/i)).toBeInTheDocument();
      expect(within(recoveryCard).getByText(/Net Est:\s*\$4,753\.00/i)).toBeInTheDocument();
    });

    it('shows Full Clearing indicator when volume requested covers all available lot quantity', () => {
      const fullBid = {
        ...stitchBid,
        quantity: 250
      };

      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={fullBid}
          lot={stitchLot}
        />
      );

      const volumeCard = screen.getByTestId('summary-volume-requested');
      expect(within(volumeCard).getByText(/100%/i)).toBeInTheDocument();
      expect(within(volumeCard).getByText(/Full Clearing/i)).toBeInTheDocument();
    });
  });

  describe('Issue 02 — Accept Offer Work Surface with DC Logistics & Multi-Channel Communication Card', () => {
    const stitchBid = {
      _id: 'bid-stitch-101',
      lotId: 'lot-stitch-101',
      buyerId: {
        _id: 'buyer-apex',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 24.50,
      quantity: 200,
      status: 'pending',
      submittedAt: '2026-09-18T00:00:00.000Z',
      messages: []
    };

    const stitchLot = {
      _id: 'lot-stitch-101',
      lotNumber: 'LOT-550',
      availableQty: 250,
      quantity: 250,
      reservePrice: 20.00,
      distributionCenter: {
        address: 'Texas Central Facility, Dallas, TX, United States',
        operatingHours: '08:00 AM - 04:30 PM CST'
      },
      productId: {
        sku: 'SKU-ORGANIC-APPLES',
        description: 'Premium Honeycrisp Apples'
      }
    };

    describe('Seam 1: Logistics & Allocation Parameters Card', () => {
      it('renders logistics parameters card with FOB Origin tag, Appointment Req indicator, inventory-capped stepper, and locked settled price', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        // Logistics card shell and header
        const logisticsCard = screen.getByTestId('accept-logistics-card');
        expect(logisticsCard).toBeInTheDocument();
        expect(within(logisticsCard).getByText('Logistics & Allocation')).toBeInTheDocument();
        expect(within(logisticsCard).getByText('Ready for Settlement')).toBeInTheDocument();

        // 1. DC Pickup Address with FOB Origin tag
        expect(within(logisticsCard).getByText('FOB Origin')).toBeInTheDocument();
        const addressInput = screen.getByLabelText(/dc pickup address/i) as HTMLInputElement;
        expect(addressInput).toBeInTheDocument();
        expect(addressInput.value).toBe('Texas Central Facility, Dallas, TX, United States');

        // 2. Dock Operating Hours with Appointment Req. indicator
        expect(within(logisticsCard).getByText('Appointment Req.')).toBeInTheDocument();
        const hoursInput = screen.getByLabelText(/dock operating hours/i) as HTMLInputElement;
        expect(hoursInput).toBeInTheDocument();
        expect(hoursInput.value).toBe('08:00 AM - 04:30 PM CST');

        // 3. Awarded Quantity Stepper capped at lot availableQty
        expect(within(logisticsCard).getByText(/250 Max/i)).toBeInTheDocument();
        const qtyInput = screen.getByLabelText(/awarded quantity/i) as HTMLInputElement;
        expect(qtyInput).toBeInTheDocument();
        expect(qtyInput.value).toBe('200'); // bid quantity
        expect(qtyInput.max).toBe('250');
        expect(qtyInput.min).toBe('1');

        // 4. Agreed Price locked with Settled badge and USD currency label
        expect(within(logisticsCard).getByText('Settled')).toBeInTheDocument();
        const priceInput = screen.getByLabelText(/agreed price/i) as HTMLInputElement;
        expect(priceInput).toBeInTheDocument();
        expect(priceInput).toBeDisabled();
        expect(priceInput.value).toBe('$24.50');
        expect(within(logisticsCard).getByText('USD')).toBeInTheDocument();
      });

      it('allows updating logistics address, hours, and awarded quantity', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        const addressInput = screen.getByLabelText(/dc pickup address/i) as HTMLInputElement;
        fireEvent.change(addressInput, { target: { value: '450 Logistics Blvd, Denver, CO' } });
        expect(addressInput.value).toBe('450 Logistics Blvd, Denver, CO');

        const hoursInput = screen.getByLabelText(/dock operating hours/i) as HTMLInputElement;
        fireEvent.change(hoursInput, { target: { value: '07:00 AM - 03:00 PM MST' } });
        expect(hoursInput.value).toBe('07:00 AM - 03:00 PM MST');

        const qtyInput = screen.getByLabelText(/awarded quantity/i) as HTMLInputElement;
        fireEvent.change(qtyInput, { target: { value: '150' } });
        expect(qtyInput.value).toBe('150');
      });
    });

    describe('Seam 2: Multi-Channel Communication Card & Dynamic Metrics', () => {
      it('renders communication card with channel pills (Email active), recipient badge, dynamic token count, and word count', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        const commCard = screen.getByTestId('accept-communication-card');
        expect(commCard).toBeInTheDocument();
        expect(within(commCard).getByText('Communication')).toBeInTheDocument();

        // Channel selector pills
        const emailPill = screen.getByRole('button', { name: /^email$/i });
        const inAppPill = screen.getByRole('button', { name: /^in-app$/i });
        const smsPill = screen.getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        // Email active by default
        expect(emailPill.getAttribute('data-active')).toBe('true');
        expect(inAppPill.getAttribute('data-active')).toBe('false');
        expect(smsPill.getAttribute('data-active')).toBe('false');

        // Recipient badge
        expect(within(commCard).getByText(/Recipient:/i)).toBeInTheDocument();
        expect(within(commCard).getByText('apex@liquidators.com')).toBeInTheDocument();

        // Dynamic tokens count & word count pills
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();
      });

      it('switches channel selector pills between Email, In-App, and SMS', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        const emailPill = screen.getByRole('button', { name: /^email$/i });
        const inAppPill = screen.getByRole('button', { name: /^in-app$/i });
        const smsPill = screen.getByRole('button', { name: /^sms$/i });

        // Switch to In-App
        fireEvent.click(inAppPill);
        expect(inAppPill.getAttribute('data-active')).toBe('true');
        expect(emailPill.getAttribute('data-active')).toBe('false');

        // Switch to SMS
        fireEvent.click(smsPill);
        expect(smsPill.getAttribute('data-active')).toBe('true');
        expect(inAppPill.getAttribute('data-active')).toBe('false');

        // Switch back to Email
        fireEvent.click(emailPill);
        expect(emailPill.getAttribute('data-active')).toBe('true');
      });

      it('toggles accordion collapse and expand to hide/show TipTap body canvas', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        const accordionToggle = screen.getByRole('button', { name: /toggle communication accordion/i });
        const editorBody = screen.getByTestId('accept-communication-body');

        // Initially open / visible
        expect(editorBody).toBeVisible();

        // Click to collapse
        fireEvent.click(accordionToggle);
        expect(editorBody).not.toBeVisible();

        // Click to expand again
        fireEvent.click(accordionToggle);
        expect(editorBody).toBeVisible();
      });
    });

    describe('Seam 3: Settlement Summary Footer & Execution Dispatch', () => {
      it('calculates live settlement total with breakdown and full clearing indicator, dispatching onAccept on Confirm Offer click', async () => {
        const onAcceptMock = vi.fn();
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            onAccept={onAcceptMock}
          />
        );

        const footer = screen.getByTestId('accept-settlement-footer');
        expect(footer).toBeInTheDocument();

        // 200 cases @ $24.50 = $4,900.00
        expect(within(footer).getByTestId('total-settlement-value')).toHaveTextContent('$4,900.00');
        expect(within(footer).getByText(/\(200 cs × \$24\.50\)/i)).toBeInTheDocument();

        // Origin tag
        expect(within(footer).getByText(/FOB Origin Texas Central Facility/i)).toBeInTheDocument();

        // Click Confirm Offer
        const confirmBtn = within(footer).getByRole('button', { name: /confirm offer/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
          expect(onAcceptMock).toHaveBeenCalledTimes(1);
          expect(onAcceptMock).toHaveBeenCalledWith(expect.objectContaining({
            awardedQuantity: 200,
            pickupAddress: 'Texas Central Facility, Dallas, TX, United States',
            pickupHours: '08:00 AM - 04:30 PM CST',
            pricePerCase: 24.50,
            templateHtml: expect.any(String)
          }));
        });
      });

      it('updates live total and displays Partial Clearing when awarded quantity is reduced', async () => {
        const onAcceptMock = vi.fn();
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            onAccept={onAcceptMock}
          />
        );

        const footer = screen.getByTestId('accept-settlement-footer');
        const qtyInput = screen.getByLabelText(/awarded quantity/i);

        // Reduce allocation from 200 to 120 cases
        fireEvent.change(qtyInput, { target: { value: '120' } });

        // Total updates to 120 * $24.50 = $2,940.00
        expect(within(footer).getByTestId('total-settlement-value')).toHaveTextContent('$2,940.00');
        expect(within(footer).getByText(/\(120 cs × \$24\.50\)/i)).toBeInTheDocument();
        expect(within(footer).getByText(/Partial Clearing/i)).toBeInTheDocument();

        const confirmBtn = within(footer).getByRole('button', { name: /confirm offer/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
          expect(onAcceptMock).toHaveBeenCalledWith(expect.objectContaining({
            awardedQuantity: 120,
            pricePerCase: 24.50
          }));
        });
      });

      it('disables Confirm Offer button when pickup address is empty or when isSubmitting is true', () => {
        const { rerender } = render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            isSubmitting={false}
          />
        );

        const footer = screen.getByTestId('accept-settlement-footer');
        const confirmBtn = within(footer).getByRole('button', { name: /confirm offer/i });
        expect(confirmBtn).not.toBeDisabled();

        // Clear pickup address -> should disable
        const addressInput = screen.getByLabelText(/dc pickup address/i);
        fireEvent.change(addressInput, { target: { value: '' } });
        expect(confirmBtn).toBeDisabled();

        // Restore address
        fireEvent.change(addressInput, { target: { value: 'Warehouse DC 5' } });
        expect(confirmBtn).not.toBeDisabled();

        // Re-render with isSubmitting=true -> should disable
        rerender(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            isSubmitting={true}
          />
        );
        expect(confirmBtn).toBeDisabled();
      });

      it('opens Outbound Email Preview modal when clicking Preview Email in the settlement footer', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        const footer = screen.getByTestId('accept-settlement-footer');
        const previewBtn = within(footer).getByRole('button', { name: /preview outbound settlement email/i });

        fireEvent.click(previewBtn);

        // Outbound Email Preview modal opens
        expect(screen.getByText('Outbound Email Preview')).toBeInTheDocument();
        expect(screen.getByText(/To:/i)).toBeInTheDocument();
        expect(screen.getAllByText('apex@liquidators.com').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Issue 03 — Negotiate Work Surface with Live Counter Parameters, In-Situ Continuity & Delta Metrics', () => {
    const stitchBid = {
      _id: 'bid-stitch-101',
      lotId: 'lot-stitch-101',
      buyerId: {
        _id: 'buyer-apex',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 24.50,
      quantity: 200,
      status: 'pending',
      submittedAt: '2026-09-18T00:00:00.000Z',
      messages: []
    };

    const stitchLot = {
      _id: 'lot-stitch-101',
      lotNumber: 'LOT-550',
      availableQty: 250,
      quantity: 250,
      reservePrice: 20.00,
      distributionCenter: {
        address: 'Texas Central Facility, Dallas, TX, United States',
        operatingHours: '08:00 AM - 04:30 PM CST'
      },
      productId: {
        sku: 'SKU-ORGANIC-APPLES',
        description: 'Premium Honeycrisp Apples'
      }
    };

    describe('Seam 1: Counter-Offer Parameters Card & Live Margin Uplift', () => {
      it('renders counter parameters card with counter price, volume, holding window, reserve floor match, and live uplift badge', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        // Switch to Negotiate mode
        const negotiateTab = screen.getByRole('button', { name: /negotiate/i });
        fireEvent.click(negotiateTab);

        // Parameters card shell and title
        const paramsCard = screen.getByTestId('negotiate-parameters-card');
        expect(paramsCard).toBeInTheDocument();
        expect(within(paramsCard).getByText('Counter-Offer Parameters')).toBeInTheDocument();
        expect(within(paramsCard).getByText(/Adjust counter unit price or tranche volume/i)).toBeInTheDocument();

        // 1. Counter Unit Price with live uplift badge
        const priceInput = screen.getByPlaceholderText(/enter counter price/i) as HTMLInputElement;
        expect(priceInput).toBeInTheDocument();
        expect(priceInput.value).toBe('24.5');

        // Initial uplift with same price as bid is +0.0% Uplift
        const upliftBadge = within(paramsCard).getByTestId('negotiate-uplift-badge');
        expect(upliftBadge).toHaveTextContent('+0.0% Uplift');

        // Change price to 26.95 (+$2.45, +10.0% uplift)
        fireEvent.change(priceInput, { target: { value: '26.95' } });
        expect(upliftBadge).toHaveTextContent('+10.0% Uplift');

        // 2. Counter Volume with max indicator
        expect(within(paramsCard).getByText(/250 Max/i)).toBeInTheDocument();
        const volumeInput = screen.getByPlaceholderText(/enter counter quantity/i) as HTMLInputElement;
        expect(volumeInput).toBeInTheDocument();
        expect(volumeInput.value).toBe('200');

        // 3. Counter Holding Window
        expect(within(paramsCard).getByText('Counter Holding Window')).toBeInTheDocument();
        expect(within(paramsCard).getByText('Auto-expires')).toBeInTheDocument();
        const windowInput = screen.getByDisplayValue('48 Hours');
        expect(windowInput).toBeDisabled();

        // 4. Liquidation Reserve Floor validation
        expect(within(paramsCard).getByText('Liquidation Reserve Floor')).toBeInTheDocument();
        // Since 26.95 >= 20.00, floor status is "Met"
        expect(within(paramsCard).getByText('Met')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/\$20\.00 \/case \(\$4,000\.00 Floor\)/i)).toBeDisabled();

        // When counter price is lowered below reserve floor (e.g. 18.00)
        fireEvent.change(priceInput, { target: { value: '18.00' } });
        expect(within(paramsCard).getByText('Below Floor')).toBeInTheDocument();
        expect(upliftBadge).toHaveTextContent('-26.5% Uplift');
      });

      it('displays live delta indicators comparing counter terms against buyer original offer in the parameters card', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const priceInput = screen.getByPlaceholderText(/enter counter price/i);
        const volumeInput = screen.getByPlaceholderText(/enter counter quantity/i);

        fireEvent.change(priceInput, { target: { value: '26.95' } });
        fireEvent.change(volumeInput, { target: { value: '200' } });

        const deltaContainer = screen.getByTestId('counter-delta-indicators');
        expect(deltaContainer).toBeInTheDocument();
        expect(within(deltaContainer).getByText(/\+\$2\.45\/cs \(\+10\.0%\)/i)).toBeInTheDocument();
        expect(within(deltaContainer).getByText(/\+\$490\.00 \(\+10\.0%\)/i)).toBeInTheDocument();
      });
    });

    describe('Seam 2: In-Situ Negotiation Continuity & Direct Bid Acceptance', () => {
      const bidWithThread = {
        ...stitchBid,
        messages: [
          {
            sender: 'buyer',
            content: 'Initial offer submitted at $22.00/case for 150 cases.',
            proposedPrice: 22.00,
            proposedQuantity: 150,
            timestamp: '2026-09-17T10:00:00.000Z'
          },
          {
            sender: 'supplier',
            content: 'Counter proposal: $25.00/case.',
            proposedPrice: 25.00,
            proposedQuantity: 150,
            timestamp: '2026-09-17T14:00:00.000Z'
          },
          {
            sender: 'buyer',
            content: 'Revised buyer proposal: $23.50/case for 180 cases.',
            proposedPrice: 23.50,
            proposedQuantity: 180,
            timestamp: '2026-09-18T09:00:00.000Z'
          }
        ]
      };

      it('verifies proposal thread is removed from Negotiate pane and displayed in Timeline tab', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={bidWithThread}
            lot={stitchLot}
          />
        );

        // Switch to Negotiate mode
        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const leftPane = screen.getByTestId('counter-left-pane');
        expect(leftPane).toBeInTheDocument();

        // Negotiation thread is removed from Negotiate pane
        expect(within(leftPane).queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

        // Switch to Timeline tab to inspect proposal stream
        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
        const feed = screen.getByTestId('timeline-activity-feed');
        expect(within(feed).getByText(/Counter proposal: \$25\.00\/case/i)).toBeInTheDocument();
        expect(within(feed).getByText(/Revised buyer proposal: \$23\.50\/case/i)).toBeInTheDocument();
      });
    });

    describe('Seam 3: Multi-Channel Communication Card & Live Token Sync', () => {
      it('renders communication card with channel pills, recipient, word/token counts, and toggles accordion', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const commCard = screen.getByTestId('negotiate-communication-card');
        expect(commCard).toBeInTheDocument();
        expect(within(commCard).getByText('Communication')).toBeInTheDocument();

        // Channel pills
        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        expect(emailPill.getAttribute('data-active')).toBe('true');

        // Switch to In-App
        fireEvent.click(inAppPill);
        expect(inAppPill.getAttribute('data-active')).toBe('true');
        expect(screen.getByText(/In-App Channel Active/i)).toBeInTheDocument();

        // Switch to SMS
        fireEvent.click(smsPill);
        expect(smsPill.getAttribute('data-active')).toBe('true');
        expect(screen.getByText(/SMS Channel Active/i)).toBeInTheDocument();

        // Switch back to Email
        fireEvent.click(emailPill);
        expect(emailPill.getAttribute('data-active')).toBe('true');

        // Recipient badge
        expect(within(commCard).getByText(/Recipient:/i)).toBeInTheDocument();
        expect(within(commCard).getByText('apex@liquidators.com')).toBeInTheDocument();

        // Token & word counts
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();

        // Accordion toggle
        const accordionToggle = within(commCard).getByRole('button', { name: /toggle negotiate communication accordion/i });
        const commBody = screen.getByTestId('negotiate-communication-body');
        expect(commBody).toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).not.toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).toBeVisible();
      });

      it('hydrates TipTap counter preset with dynamic tokens and live syncs when modifying price and volume', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const commCard = screen.getByTestId('negotiate-communication-card');
        expect(within(commCard).getByText(/\[Apex Liquidators\]/i)).toBeInTheDocument();
        expect(within(commCard).getAllByText(/\[\$24\.50\/cs\]/i).length).toBeGreaterThanOrEqual(1);
        expect(within(commCard).getAllByText(/\[200 cases\]/i).length).toBeGreaterThanOrEqual(1);

        // Update price to 27.00 and volume to 175
        const priceInput = screen.getByPlaceholderText(/enter counter price/i);
        fireEvent.change(priceInput, { target: { value: '27.00' } });

        const volumeInput = screen.getByPlaceholderText(/enter counter quantity/i);
        fireEvent.change(volumeInput, { target: { value: '175' } });

        expect(within(commCard).getAllByText(/\[\$27\.00\/cs\]/i).length).toBeGreaterThanOrEqual(1);
        expect(within(commCard).getAllByText(/\[175 cases\]/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Seam 4: Dynamic Counter Summary & In-Situ Dispatch Continuity', () => {
      it('calculates real-time counter total value, delta variance against buyer bid, and opens email preview', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const priceInput = screen.getByPlaceholderText(/enter counter price/i);
        const volumeInput = screen.getByPlaceholderText(/enter counter quantity/i);

        fireEvent.change(priceInput, { target: { value: '26.95' } });
        fireEvent.change(volumeInput, { target: { value: '200' } });

        const summaryBar = screen.getByTestId('negotiate-summary-bar');
        expect(summaryBar).toBeInTheDocument();

        // 200 cs @ $26.95 = $5,390.00
        expect(within(summaryBar).getByTestId('counter-total-value')).toHaveTextContent('$5,390.00');
        expect(within(summaryBar).getByText(/\(200 cs × \$26\.95\)/i)).toBeInTheDocument();

        // Delta vs buyer bid: 200 * 24.50 = 4900 -> delta = +$490.00
        expect(within(summaryBar).getByText(/\+\$490\.00 vs Buyer Bid/i)).toBeInTheDocument();
        expect(within(summaryBar).getByText(/Gross Recovery Target/i)).toBeInTheDocument();

        // Click Preview Email in summary bar
        const previewBtn = within(summaryBar).getByRole('button', { name: /preview.*email/i });
        fireEvent.click(previewBtn);

        expect(screen.getByText('Outbound Email Preview')).toBeInTheDocument();
      });

      it('dispatches counter-offer, retains modal session in-situ, updates status badge to Countered, appends proposal to thread, and emits toast feedback', async () => {
        const onCounterMock = vi.fn().mockResolvedValue({ emailDispatch: { dispatched: true } });
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            onCounter={onCounterMock}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /negotiate/i }));

        const priceInput = screen.getByPlaceholderText(/enter counter price/i);
        const volumeInput = screen.getByPlaceholderText(/enter counter quantity/i);

        fireEvent.change(priceInput, { target: { value: '26.95' } });
        fireEvent.change(volumeInput, { target: { value: '200' } });

        const summaryBar = screen.getByTestId('negotiate-summary-bar');
        const dispatchBtn = within(summaryBar).getByRole('button', { name: /dispatch counter-offer/i });

        fireEvent.click(dispatchBtn);

        await waitFor(() => {
          expect(onCounterMock).toHaveBeenCalledTimes(1);
          expect(onCounterMock).toHaveBeenCalledWith(expect.objectContaining({
            price: 26.95,
            quantity: 200,
            message: expect.any(String)
          }));
        });

        // In-situ continuity: modal stays open
        expect(screen.getByTestId('negotiate-parameters-card')).toBeInTheDocument();

        // Status badge updates to countered
        expect(screen.getByTestId('modal-status-badge')).toHaveTextContent('countered');

        // Negotiation thread is not in leftPane; new proposal is logged in Timeline tab
        const leftPane = screen.getByTestId('counter-left-pane');
        expect(within(leftPane).queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
        expect(screen.getByText(/Supplier Counter-Offer Dispatched/i)).toBeInTheDocument();
        expect(screen.getAllByText(/\$26\.95\/cs/i).length).toBeGreaterThanOrEqual(1);

        // Toast feedback is emitted
        expect(screen.getByText(/Counter-offer successfully dispatched/i)).toBeInTheDocument();
      });
    });
  });

  describe('Issue 04 — Decline Offer Work Surface with Mandatory Codes, Audit Memo & Rejection Dispatch', () => {
    const stitchBid = {
      _id: 'bid-stitch-101',
      lotId: 'lot-stitch-101',
      buyerId: {
        _id: 'buyer-apex',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      },
      price: 24.50,
      quantity: 200,
      status: 'pending',
      submittedAt: '2026-09-18T00:00:00.000Z',
      messages: []
    };

    const stitchLot = {
      _id: 'lot-stitch-101',
      lotNumber: 'LOT-550',
      availableQty: 250,
      quantity: 250,
      reservePrice: 20.00,
      distributionCenter: {
        address: 'Texas Central Facility, Dallas, TX, United States',
        operatingHours: '08:00 AM - 04:30 PM CST'
      },
      productId: {
        sku: 'SKU-ORGANIC-APPLES',
        description: 'Premium Honeycrisp Apples'
      }
    };

    describe('Seam 1: Rejection Specification Card & Auto-Relist Control', () => {
      it('renders rejection specification card with mandatory reason dropdown, audit memo textarea, and auto-relist toggle', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        // Switch to Decline Offer mode
        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        // Split work surface containers
        expect(screen.getByTestId('decline-split-work-surface')).toBeInTheDocument();
        expect(screen.getByTestId('decline-left-pane')).toBeInTheDocument();

        // 1. Rejection Specification Card
        const specCard = screen.getByTestId('decline-specification-card');
        expect(specCard).toBeInTheDocument();
        expect(within(specCard).getByText(/Rejection Specification/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Mandatory Justification/i)).toBeInTheDocument();

        // 2. Mandatory Decline Reason dropdown
        const reasonSelect = screen.getByLabelText(/Decline Reason/i) as HTMLSelectElement;
        expect(reasonSelect).toBeInTheDocument();
        expect(reasonSelect.value).toBe('');
        expect(within(specCard).getByText(/Price below minimum recovery floor|Price below recovery floor/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Inventory committed elsewhere/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Logistics\/pickup constraint/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Custom rationale/i)).toBeInTheDocument();

        // 3. Internal Audit Memo / Rationale textarea
        const memoTextarea = screen.getByPlaceholderText(/Add specific rationale or notes/i);
        expect(memoTextarea).toBeInTheDocument();
        expect(memoTextarea).toHaveAttribute('id', 'decline-rationale-notes');

        // 4. Auto-relist inventory toggle / checkbox
        const autoRelistToggle = screen.getByTestId('auto-relist-toggle') as HTMLInputElement;
        expect(autoRelistToggle).toBeInTheDocument();
        expect(autoRelistToggle.type).toBe('checkbox');
        expect(autoRelistToggle.checked).toBe(true);
        expect(within(specCard).getByText(/Auto-Relist Inventory/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Return cases to open surplus pool/i)).toBeInTheDocument();
        expect(within(specCard).getByText(/Enabled/i)).toBeInTheDocument();

        // Toggle checkbox updates checked state and visual indicator
        fireEvent.click(autoRelistToggle);
        expect(autoRelistToggle.checked).toBe(false);
        expect(within(specCard).getByText(/Disabled/i)).toBeInTheDocument();
      });
    });

    describe('Seam 2: Multi-Channel Communication Card & Dynamic Decline Tokens', () => {
      it('renders decline communication card with channel pills (Email active by default), recipient badge, dynamic token count, and word count', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const commCard = screen.getByTestId('decline-communication-card');
        expect(commCard).toBeInTheDocument();
        expect(within(commCard).getByText('Communication')).toBeInTheDocument();

        // Channel selector pills
        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        // Email active by default
        expect(emailPill.getAttribute('data-active')).toBe('true');
        expect(inAppPill.getAttribute('data-active')).toBe('false');
        expect(smsPill.getAttribute('data-active')).toBe('false');

        // Recipient badge
        expect(within(commCard).getByText(/Recipient:/i)).toBeInTheDocument();
        expect(within(commCard).getByText('apex@liquidators.com')).toBeInTheDocument();

        // Dynamic tokens count & word count pills
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();
      });

      it('switches channel selector pills between Email, In-App, and SMS', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));
        const commCard = screen.getByTestId('decline-communication-card');

        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        // Switch to In-App
        fireEvent.click(inAppPill);
        expect(inAppPill.getAttribute('data-active')).toBe('true');
        expect(emailPill.getAttribute('data-active')).toBe('false');
        expect(screen.getByText(/In-App Channel Active/i)).toBeInTheDocument();

        // Switch to SMS
        fireEvent.click(smsPill);
        expect(smsPill.getAttribute('data-active')).toBe('true');
        expect(inAppPill.getAttribute('data-active')).toBe('false');
        expect(screen.getByText(/SMS Channel Active/i)).toBeInTheDocument();

        // Switch back to Email
        fireEvent.click(emailPill);
        expect(emailPill.getAttribute('data-active')).toBe('true');
      });

      it('toggles accordion collapse and expand to hide and show TipTap canvas', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const accordionToggle = screen.getByRole('button', { name: /toggle decline communication accordion/i });
        const editorBody = screen.getByTestId('decline-communication-body');

        expect(editorBody).toBeVisible();

        fireEvent.click(accordionToggle);
        expect(editorBody).not.toBeVisible();

        fireEvent.click(accordionToggle);
        expect(editorBody).toBeVisible();
      });

      it('pre-loads TipTap decline notice template with live dynamic token pills and syncs when reason and rationale are modified', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const commCard = screen.getByTestId('decline-communication-card');

        // Pre-loaded dynamic tokens
        expect(within(commCard).getByText(/\[Apex Liquidators\]/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\[Premium Honeycrisp Apples\]/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\[LOT-550\]/i)).toBeInTheDocument();

        // Select decline reason
        const reasonSelect = screen.getByLabelText(/Decline Reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });

        // Token badge for decline_reason updates live
        expect(within(commCard).getByText(/\[Price below minimum recovery floor\]/i)).toBeInTheDocument();

        // Add audit memo rationale notes
        const memoTextarea = screen.getByPlaceholderText(/Add specific rationale or notes/i);
        fireEvent.change(memoTextarea, { target: { value: 'Offer does not meet our minimum floor' } });

        // Token badge for decline_rationale updates live
        expect(within(commCard).getByText(/\[Offer does not meet our minimum floor\]/i)).toBeInTheDocument();

        // Verify ProseMirror editor retains surrounding text and resolved token values
        const editor = commCard.querySelector('.ProseMirror');
        expect(editor?.textContent).toContain('After review, we are unable to accept your offer');
        expect(editor?.textContent).toContain('[Price below minimum recovery floor]');
        expect(editor?.textContent).toContain('[Offer does not meet our minimum floor]');
      });
    });

    describe('Seam 3: Decline Action Footer, Preview Modal & In-Situ Rejection Continuity', () => {
      it('renders decline action footer with escrow deposit release notice, inventory return state indicator, and preview email button opening the preview modal', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const footer = screen.getByTestId('decline-action-footer');
        expect(footer).toBeInTheDocument();

        // Escrow deposit release notice
        expect(within(footer).getByText(/escrow deposit/i)).toBeInTheDocument();
        expect(within(footer).getByText(/released|voided/i)).toBeInTheDocument();

        // Inventory return state indicator (auto-relist is true by default)
        expect(within(footer).getByText(/surplus pool|returning to open pool|auto-relist/i)).toBeInTheDocument();

        // Toggle auto-relist off and observe return state indicator update
        const autoRelistToggle = screen.getByTestId('auto-relist-toggle');
        fireEvent.click(autoRelistToggle);
        expect(within(footer).getByText(/retained|unallocated|not auto-relisted/i)).toBeInTheDocument();

        // Preview Email button in footer
        const previewBtn = within(footer).getByRole('button', { name: /preview.*email/i });
        expect(previewBtn).toBeInTheDocument();

        fireEvent.click(previewBtn);
        const previewDialog = screen.getByRole('dialog', { name: /email preview dialog/i });
        expect(previewDialog).toBeInTheDocument();
        expect(within(previewDialog).getByText('Outbound Email Preview')).toBeInTheDocument();
        expect(within(previewDialog).getByText(/apex@liquidators\.com/i)).toBeInTheDocument();
      });

      it('disables Confirm Decline & Send Notice button when no reason code is selected or when isSubmitting is true', () => {
        const { rerender } = render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            isSubmitting={false}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const footer = screen.getByTestId('decline-action-footer');
        const confirmBtn = within(footer).getByRole('button', { name: /confirm decline/i });
        expect(confirmBtn).toBeDisabled();

        // Select a reason -> button should be enabled
        const reasonSelect = screen.getByLabelText(/Decline Reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });
        expect(confirmBtn).not.toBeDisabled();

        // When isSubmitting is true -> button should be disabled
        rerender(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={stitchBid}
            lot={stitchLot}
            isSubmitting={true}
          />
        );
        expect(confirmBtn).toBeDisabled();
      });

      it('dispatches onDecline with reason, rationale, templateHtml and autoRelist, updates lifecycle badge to rejected, logs rejection notice, and emits toast feedback without abrupt modal dismissal', async () => {
        const onDeclineMock = vi.fn().mockResolvedValue(undefined);
        const onCloseMock = vi.fn();

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={onCloseMock}
            bid={stitchBid}
            lot={stitchLot}
            onDecline={onDeclineMock}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        // Fill in reason & rationale
        const reasonSelect = screen.getByLabelText(/Decline Reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });

        const memoTextarea = screen.getByPlaceholderText(/Add specific rationale or notes/i);
        fireEvent.change(memoTextarea, { target: { value: 'Counter-offer was not feasible at $24.50.' } });

        const footer = screen.getByTestId('decline-action-footer');
        const confirmBtn = within(footer).getByRole('button', { name: /confirm decline/i });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
          expect(onDeclineMock).toHaveBeenCalledTimes(1);
          expect(onDeclineMock).toHaveBeenCalledWith(expect.objectContaining({
            reason: 'Price below minimum recovery floor',
            rationale: 'Counter-offer was not feasible at $24.50.',
            templateHtml: expect.any(String),
            emailSubject: expect.stringContaining('LOT-550'),
            autoRelist: true
          }));
        });

        // In-situ continuity: onClose is NOT called, modal stays open
        expect(onCloseMock).not.toHaveBeenCalled();
        expect(screen.getByTestId('decline-specification-card')).toBeInTheDocument();

        // Lifecycle badge updates to rejected
        expect(screen.getByTestId('modal-status-badge')).toHaveTextContent(/rejected|declined/i);

        // Toast feedback is emitted
        expect(screen.getByText(/Offer successfully declined|declined.*notice dispatched/i)).toBeInTheDocument();

        // Rejection banner displayed
        expect(screen.getByTestId('declined-active-banner')).toBeInTheDocument();

        // Verify Negotiation History Thread is not in Decline pane
        expect(screen.queryByText(/Negotiation History Thread/i)).not.toBeInTheDocument();

        // Rejection notice is logged into Timeline Tab
        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
        expect(screen.getAllByText(/Offer declined\. Reason: Price below minimum recovery floor/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Issue #05: Dedicated Timeline Audit Tab', () => {
    describe('Seam 1: Navigation & Tab Activation', () => {
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
        createdAt: '2026-09-07T08:00:00.000Z',
        productId: {
          sku: 'SKU-APPLES',
          description: 'Organic Honeycrisp Apples'
        }
      };

      it('renders dedicated Timeline tab with history icon and counter badge, and activates timeline surface on click', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        const timelineTabBtn = screen.getByRole('button', { name: /timeline/i });
        expect(timelineTabBtn).toBeInTheDocument();

        // Check for counter badge inside timeline tab
        const badge = screen.getByTestId('timeline-tab-badge');
        expect(badge).toBeInTheDocument();
        expect(Number(badge.textContent)).toBeGreaterThan(0);

        // Click to switch to Timeline mode
        fireEvent.click(timelineTabBtn);

        // Verify timeline audit surface container is active
        expect(screen.getByTestId('timeline-audit-surface')).toBeInTheDocument();
      });
    });

    describe('Seam 2: Multi-Source Event Stream Aggregation & Feed Rendering', () => {
      const sampleBidWithHistory = {
        _id: 'bid-202',
        lotId: 'lot-202',
        buyerId: {
          _id: 'buyer-2',
          companyName: 'Peak Produce Co',
          email: 'buyer@peakproduce.com'
        },
        price: 4.00,
        quantity: 200,
        status: 'pending',
        submittedAt: '2026-09-08T10:00:00.000Z',
        messages: [
          {
            sender: 'buyer',
            content: 'Initial offer submitted at $4.00/cs for 200 cases.',
            timestamp: '2026-09-08T10:00:00.000Z'
          },
          {
            sender: 'supplier',
            proposedPrice: 4.60,
            proposedQuantity: 200,
            content: 'Counter-offer: We can release at $4.60/cs.',
            timestamp: '2026-09-08T11:30:00.000Z'
          }
        ]
      };

      const sampleLot = {
        _id: 'lot-202',
        lotNumber: 'LOT-202',
        standardSellPrice: 5.50,
        createdAt: '2026-09-07T08:00:00.000Z',
        productId: {
          sku: 'SKU-ORANGES',
          description: 'Valencia Oranges Grade A'
        }
      };

      it('aggregates multi-source lifecycle events across lot listing, escrow verification, buyer bid, and supplier counter into chronological feed', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBidWithHistory}
            lot={sampleLot}
          />
        );

        // Switch to Timeline tab
        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        const feed = screen.getByTestId('timeline-activity-feed');
        expect(feed).toBeInTheDocument();

        // 1. Lot Publication event (System / Blue)
        const lotCard = screen.getByTestId(`timeline-event-card-lot-pub-${sampleLot._id}`);
        expect(lotCard).toBeInTheDocument();
        expect(within(lotCard).getByText(/Lot Published & Inventory Allocated/i)).toBeInTheDocument();
        expect(within(lotCard).getByTestId('timeline-event-actor')).toHaveTextContent('Supplier Operations');
        expect(within(lotCard).getByTestId('timeline-event-description')).toHaveTextContent(/LOT-202/);
        expect(within(lotCard).getByTestId('timeline-event-description')).toHaveTextContent(/\$5\.50\/cs/);
        expect(within(lotCard).getByTestId('timeline-event-category-badge')).toHaveTextContent(/system/i);
        const lotDot = within(lotCard).getByTestId('timeline-node-dot');
        expect(lotDot).toHaveStyle({ backgroundColor: '#3b82f6' });

        // 2. Escrow Pre-Authorization event (System / Blue)
        const escrowCard = screen.getByTestId(`timeline-event-card-escrow-${sampleBidWithHistory._id}`);
        expect(escrowCard).toBeInTheDocument();
        expect(within(escrowCard).getByText(/Automated Escrow Pre-Authorization/i)).toBeInTheDocument();
        expect(within(escrowCard).getByTestId('timeline-event-actor')).toHaveTextContent('Escrow Engine / Compliance');
        expect(within(escrowCard).getByTestId('timeline-event-description')).toHaveTextContent('Peak Produce Co');
        expect(within(escrowCard).getByTestId('timeline-event-ref-id')).toHaveTextContent(/ESCROW-PREAUTH/);
        const escrowDot = within(escrowCard).getByTestId('timeline-node-dot');
        expect(escrowDot).toHaveStyle({ backgroundColor: '#3b82f6' });

        // 3. Buyer Initial Bid event (Negotiations / Amber)
        const bidCard = screen.getByTestId(`timeline-event-card-bid-init-${sampleBidWithHistory._id}`);
        expect(bidCard).toBeInTheDocument();
        expect(within(bidCard).getByText(/Buyer Initial Offer Submitted/i)).toBeInTheDocument();
        expect(within(bidCard).getByTestId('timeline-event-actor')).toHaveTextContent('Peak Produce Co');
        expect(within(bidCard).getByTestId('timeline-event-description')).toHaveTextContent(/\$4\.00\/cs/);
        expect(within(bidCard).getByTestId('timeline-event-description')).toHaveTextContent(/200 cases/);
        expect(within(bidCard).getByTestId('timeline-event-description')).toHaveTextContent(/\$800\.00/);
        const bidDot = within(bidCard).getByTestId('timeline-node-dot');
        expect(bidDot).toHaveStyle({ backgroundColor: '#f59e0b' });

        // 4. Supplier Counter-Offer event (Negotiations / Amber)
        const counterCard = screen.getByTestId(/timeline-event-card-msg-1-/);
        expect(counterCard).toBeInTheDocument();
        expect(within(counterCard).getByText(/Supplier Counter-Offer Dispatched/i)).toBeInTheDocument();
        expect(within(counterCard).getByTestId('timeline-event-actor')).toHaveTextContent('Supplier Operations');
        expect(within(counterCard).getByTestId('timeline-event-description')).toHaveTextContent(/Counter-offer: We can release at \$4\.60\/cs\./);
        const counterDot = within(counterCard).getByTestId('timeline-node-dot');
        expect(counterDot).toHaveStyle({ backgroundColor: '#f59e0b' });

        // Verify chronological sequence order in DOM: lot pub -> escrow -> initial bid -> counter
        const eventCards = within(feed).getAllByTestId(/^timeline-event-card-/);
        expect(eventCards.length).toBe(4);
        expect(eventCards[0]).toHaveAttribute('data-testid', `timeline-event-card-lot-pub-${sampleLot._id}`);
        expect(eventCards[1]).toHaveAttribute('data-testid', `timeline-event-card-escrow-${sampleBidWithHistory._id}`);
        expect(eventCards[2]).toHaveAttribute('data-testid', `timeline-event-card-bid-init-${sampleBidWithHistory._id}`);
        expect(eventCards[3]).toHaveAttribute('data-testid', expect.stringContaining('timeline-event-card-msg-1-'));
      });

      it('renders status transitions with adaptive color coding: Emerald for Accepted deal award and Red for Declined offer', () => {
        // Test Accepted Status Transition (Emerald)
        const acceptedBid = {
          ...sampleBidWithHistory,
          status: 'accepted'
        };

        const { unmount } = render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={acceptedBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        const acceptCard = screen.getByTestId(`timeline-event-card-status-accept-${acceptedBid._id}`);
        expect(acceptCard).toBeInTheDocument();
        expect(within(acceptCard).getByText(/Offer Accepted & Deal Settlement Active/i)).toBeInTheDocument();
        expect(within(acceptCard).getByTestId('timeline-event-category-badge')).toHaveTextContent(/status/i);
        const acceptDot = within(acceptCard).getByTestId('timeline-node-dot');
        expect(acceptDot).toHaveStyle({ backgroundColor: '#10b981' });

        unmount();

        // Test Declined/Rejected Status Transition (Red)
        const rejectedBid = {
          ...sampleBidWithHistory,
          status: 'rejected'
        };

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={rejectedBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        const rejectCard = screen.getByTestId(`timeline-event-card-status-reject-${rejectedBid._id}`);
        expect(rejectCard).toBeInTheDocument();
        expect(within(rejectCard).getByText(/Offer Declined & Rejection Notice Dispatched/i)).toBeInTheDocument();
        expect(within(rejectCard).getByTestId('timeline-event-category-badge')).toHaveTextContent(/status/i);
        const rejectDot = within(rejectCard).getByTestId('timeline-node-dot');
        expect(rejectDot).toHaveStyle({ backgroundColor: '#ef4444' });
      });

      it('renders email messages cleanly without HTML tags, markup, or inline styling in Timeline event description', () => {
        const rawEmailHtmlMessage =
          '<p>Dear <span data-token="buyer_name">Apex Liquidators</span>,</p>' +
          '<p>We propose a counter-offer for <span data-token="product_name">Valencia Oranges Grade A</span> at <span data-token="counter_price">$31.00/cs</span> for <span data-token="counter_quantity">100</span> cases (original offer: <span data-token="original_price">$25.00/cs</span>).</p>' +
          '<p><a href="http://example.com/accept" class="btn-counter-accept" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 22px;">Accept Counter-Offer ($31.00/cs • 100)</a>' +
          '<a href="http://example.com/renegotiate" class="btn-counter-renegotiate" style="display: inline-block; background-color: #3b82f6; color: #ffffff;">Propose New Terms / Re-bid</a></p>';

        const bidWithHtmlEmail = {
          ...sampleBidWithHistory,
          messages: [
            {
              sender: 'buyer',
              content: 'Initial offer submitted at $4.00/cs for 200 cases.',
              timestamp: '2026-09-08T10:00:00.000Z'
            },
            {
              sender: 'supplier',
              proposedPrice: 31.00,
              proposedQuantity: 100,
              content: rawEmailHtmlMessage,
              timestamp: '2026-09-08T11:30:00.000Z'
            }
          ]
        };

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={bidWithHtmlEmail}
            lot={sampleLot}
          />
        );

        // Switch to Timeline tab
        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        const counterCard = screen.getByTestId(/timeline-event-card-msg-1-/);
        expect(counterCard).toBeInTheDocument();

        const descElem = within(counterCard).getByTestId('timeline-event-description');
        // Must NOT contain any raw HTML tags
        expect(descElem.innerHTML).not.toContain('<p>');
        expect(descElem.innerHTML).not.toContain('</p>');
        expect(descElem.innerHTML).not.toContain('<span');
        expect(descElem.innerHTML).not.toContain('<a href');
        expect(descElem.innerHTML).not.toContain('btn-counter-accept');
        expect(descElem.innerHTML).not.toContain('style=');

        // Must render email plain content
        expect(descElem.textContent).toContain('Dear Apex Liquidators,');
        expect(descElem.textContent).toContain('We propose a counter-offer for Valencia Oranges Grade A at $31.00/cs for 100 cases (original offer: $25.00/cs).');
        expect(descElem.textContent).toContain('Accept Counter-Offer ($31.00/cs • 100)');
        expect(descElem.textContent).toContain('Propose New Terms / Re-bid');
      });
    });

    describe('Seam 3: Category Filter Dropdown', () => {
      const sampleBidWithHistory = {
        _id: 'bid-303',
        lotId: 'lot-303',
        buyerId: {
          _id: 'buyer-3',
          companyName: 'Valley Fresh Foods',
          email: 'buyer@valleyfresh.com'
        },
        price: 4.25,
        quantity: 300,
        status: 'accepted',
        submittedAt: '2026-09-08T10:00:00.000Z',
        messages: [
          {
            sender: 'buyer',
            content: 'Initial offer submitted at $4.25/cs for 300 cases.',
            timestamp: '2026-09-08T10:00:00.000Z'
          },
          {
            sender: 'supplier',
            proposedPrice: 4.50,
            proposedQuantity: 300,
            content: 'Supplier counter at $4.50/cs.',
            timestamp: '2026-09-08T11:00:00.000Z'
          }
        ]
      };

      const sampleLot = {
        _id: 'lot-303',
        lotNumber: 'LOT-303',
        standardSellPrice: 5.00,
        createdAt: '2026-09-07T08:00:00.000Z',
        productId: {
          sku: 'SKU-BERRIES',
          description: 'Organic Strawberries 1lb'
        }
      };

      it('filters timeline feed by category (negotiations, system, status) and updates visible event count', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBidWithHistory}
            lot={sampleLot}
          />
        );

        // Switch to Timeline tab
        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        // Verify initial state: All Events selected, all 5 events visible
        const filterDropdown = screen.getByTestId('timeline-category-filter');
        expect(filterDropdown).toBeInTheDocument();
        expect(filterDropdown).toHaveValue('all');

        const eventCountBadge = screen.getByTestId('timeline-event-count');
        expect(eventCountBadge).toHaveTextContent('(5 of 5 events)');

        let cards = screen.getAllByTestId(/^timeline-event-card-/);
        expect(cards.length).toBe(5);

        // 1. Filter by 'negotiations'
        fireEvent.change(filterDropdown, { target: { value: 'negotiations' } });
        expect(eventCountBadge).toHaveTextContent('(2 of 5 events)');
        cards = screen.getAllByTestId(/^timeline-event-card-/);
        expect(cards.length).toBe(2);
        cards.forEach((card) => {
          expect(within(card).getByTestId('timeline-event-category-badge')).toHaveTextContent(/negotiations/i);
        });
        expect(screen.queryByTestId(`timeline-event-card-lot-pub-${sampleLot._id}`)).not.toBeInTheDocument();
        expect(screen.queryByTestId(`timeline-event-card-status-accept-${sampleBidWithHistory._id}`)).not.toBeInTheDocument();

        // 2. Filter by 'system'
        fireEvent.change(filterDropdown, { target: { value: 'system' } });
        expect(eventCountBadge).toHaveTextContent('(2 of 5 events)');
        cards = screen.getAllByTestId(/^timeline-event-card-/);
        expect(cards.length).toBe(2);
        cards.forEach((card) => {
          expect(within(card).getByTestId('timeline-event-category-badge')).toHaveTextContent(/system/i);
        });
        expect(screen.getByTestId(`timeline-event-card-lot-pub-${sampleLot._id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`timeline-event-card-escrow-${sampleBidWithHistory._id}`)).toBeInTheDocument();

        // 3. Filter by 'status'
        fireEvent.change(filterDropdown, { target: { value: 'status' } });
        expect(eventCountBadge).toHaveTextContent('(1 of 5 events)');
        cards = screen.getAllByTestId(/^timeline-event-card-/);
        expect(cards.length).toBe(1);
        expect(within(cards[0]).getByTestId('timeline-event-category-badge')).toHaveTextContent(/status/i);
        expect(screen.getByTestId(`timeline-event-card-status-accept-${sampleBidWithHistory._id}`)).toBeInTheDocument();

        // 4. Reset back to 'all'
        fireEvent.change(filterDropdown, { target: { value: 'all' } });
        expect(eventCountBadge).toHaveTextContent('(5 of 5 events)');
        expect(screen.getAllByTestId(/^timeline-event-card-/).length).toBe(5);
      });
    });
  });

  describe('Issue 06 — Interactive Outbound Email Preview Modal Dialog', () => {
    const sampleBid = {
      _id: 'bid-preview-1',
      lotId: 'lot-preview-1',
      buyerId: {
        _id: 'buyer-preview-1',
        companyName: 'Atlanta Community Food Bank',
        email: 'procurement@acfb.org'
      },
      price: 15.00,
      quantity: 250,
      status: 'pending',
      submittedAt: '2026-09-18T10:00:00.000Z',
      messages: []
    };

    const sampleLot = {
      _id: 'lot-preview-1',
      lotNumber: 'LOT-PREV-88',
      standardSellPrice: 18.00,
      productId: {
        sku: 'SKU-PREV-FOOD',
        description: 'Nutritious Pantry Mix 24pk'
      },
      warehouse: 'Atlanta Central Depot #4'
    };

    describe('Seam 1: Modal Triggering & Responsive Dismissal Across All Surfaces', () => {
      it('triggers preview modal from header and footer across modes, and closes via top-right X and footer Done buttons without dismissing inspector', async () => {
        const onCloseMock = vi.fn();
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={onCloseMock}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // 1. Header preview button is eliminated in favor of dedicated tab preview buttons
        expect(screen.queryByTestId('header-preview-email-btn')).toBeNull();

        // 2. Accept mode footer trigger button
        const acceptFooterBtn = screen.getByTestId('footer-preview-accept-btn');
        expect(acceptFooterBtn).toBeInTheDocument();
        fireEvent.click(acceptFooterBtn);

        // Verify overlay dialog opens
        const previewDialog = screen.getByTestId('email-preview-dialog');
        expect(previewDialog).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: /email preview dialog/i })).toBeInTheDocument();

        // Close via top-right close button (X)
        const closeBtn = screen.getByTestId('close-email-preview-btn');
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn);

        // Preview dialog should be closed, inspector remains open, onClose mock was not called
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();
        expect(screen.getByText(/Bid Action Inspector/i)).toBeInTheDocument();

        // Re-open via Accept mode footer trigger button
        fireEvent.click(acceptFooterBtn);
        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();

        // Close via footer Done button
        const doneBtn = screen.getByTestId('done-email-preview-btn');
        expect(doneBtn).toBeInTheDocument();
        fireEvent.click(doneBtn);

        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();

        // 3. Counter mode footer trigger button
        const counterTab = screen.getByRole('button', { name: /re-negotiate/i });
        fireEvent.click(counterTab);

        const counterFooterBtn = screen.getByTestId('footer-preview-counter-btn');
        expect(counterFooterBtn).toBeInTheDocument();
        fireEvent.click(counterFooterBtn);

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();

        // Dismiss via Done button
        fireEvent.click(screen.getByTestId('done-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();

        // 4. Decline mode footer trigger button
        const declineTab = screen.getByRole('button', { name: /decline offer/i });
        fireEvent.click(declineTab);

        const declineFooterBtn = screen.getByTestId('footer-preview-decline-btn');
        expect(declineFooterBtn).toBeInTheDocument();
        fireEvent.click(declineFooterBtn);

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();

        // Dismiss via top-right X button
        fireEvent.click(screen.getByTestId('close-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();
      });
    });

    describe('Seam 2: Mode-Aware Recipient & Subject Line Rendering', () => {
      it('renders buyer recipient email and mode-specific contextual subject lines for Accept, Counter, and Decline modes', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // 1. Accept Mode
        fireEvent.click(screen.getByTestId('footer-preview-accept-btn'));
        const previewDialog = screen.getByTestId('email-preview-dialog');
        expect(previewDialog).toBeInTheDocument();

        const recipientDiv = screen.getByTestId('email-preview-recipient');
        expect(recipientDiv).toHaveTextContent(`To: ${sampleBid.buyerId.email}`);

        const subjectDiv = screen.getByTestId('email-preview-subject');
        expect(subjectDiv).toHaveTextContent(`Subject: Offer Awarded & Deal Settlement: ${sampleLot.productId.description}`);

        fireEvent.click(screen.getByTestId('close-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();

        // 2. Counter Mode
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
        fireEvent.click(screen.getByTestId('footer-preview-counter-btn'));

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('email-preview-recipient')).toHaveTextContent(`To: ${sampleBid.buyerId.email}`);
        expect(screen.getByTestId('email-preview-subject')).toHaveTextContent(`Subject: Counter-Offer Proposal: ${sampleLot.productId.description}`);

        fireEvent.click(screen.getByTestId('done-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();

        // 3. Decline Mode
        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));
        fireEvent.click(screen.getByTestId('footer-preview-decline-btn'));

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('email-preview-recipient')).toHaveTextContent(`To: ${sampleBid.buyerId.email}`);
        expect(screen.getByTestId('email-preview-subject')).toHaveTextContent(`Subject: Offer Declined: ${sampleLot.productId.description}`);

        fireEvent.click(screen.getByTestId('close-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
      });

      it('falls back to bid.buyerEmail when buyerId.email is absent', () => {
        const bidWithDirectEmail = {
          ...sampleBid,
          buyerId: undefined,
          buyerEmail: 'partner@directwholesale.com'
        };

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={bidWithDirectEmail as any}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByTestId('footer-preview-accept-btn'));
        expect(screen.getByTestId('email-preview-recipient')).toHaveTextContent('To: partner@directwholesale.com');
      });
    });

    describe('Seam 3: Authentic Dynamic Token Hydration & HTML Body Rendering', () => {
      it('hydrates all Acceptance Settlement tokens into authentic commercial values reflecting live parameter changes and eliminates bracketed chips or raw tags', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Modify logistics & allocation parameters live
        const qtyInput = screen.getByLabelText(/Awarded Quantity/i);
        fireEvent.change(qtyInput, { target: { value: '200' } });

        const addressInput = screen.getByLabelText(/DC Pickup Address/i);
        fireEvent.change(addressInput, { target: { value: '450 Logistics Blvd, Gate 4, Atlanta, GA 30301' } });

        const hoursInput = screen.getByLabelText(/Dock Operating Hours/i);
        fireEvent.change(hoursInput, { target: { value: 'Mon-Fri 06:00 AM - 02:00 PM EST' } });

        // Trigger preview modal
        fireEvent.click(screen.getByTestId('footer-preview-accept-btn'));

        const previewBody = screen.getByTestId('email-preview-body');
        expect(previewBody).toBeInTheDocument();

        // Authentic values resolved:
        // buyer_name
        expect(previewBody).toHaveTextContent('Atlanta Community Food Bank');
        // product_name
        expect(previewBody).toHaveTextContent('Nutritious Pantry Mix 24pk');
        // sku
        expect(previewBody).toHaveTextContent('SKU-PREV-FOOD');
        // awarded_quantity (live updated)
        expect(previewBody).toHaveTextContent('200 cases');
        // price_per_case
        expect(previewBody).toHaveTextContent('$15.00/case');
        // total_amount (200 * $15.00 = $3,000.00)
        expect(previewBody).toHaveTextContent('$3,000.00');
        // pickup_location (live updated)
        expect(previewBody).toHaveTextContent('450 Logistics Blvd, Gate 4, Atlanta, GA 30301');
        // pickup_hours (live updated)
        expect(previewBody).toHaveTextContent('Mon-Fri 06:00 AM - 02:00 PM EST');
        // deal_document_link & payment_link
        const links = previewBody.querySelectorAll('a');
        const dealDocLink = Array.from(links).find((a) => a.getAttribute('href') === `/deal/${sampleBid._id}`);
        expect(dealDocLink).toBeDefined();
        expect(dealDocLink).toHaveTextContent(`/deal/${sampleBid._id}`);

        const paymentLink = Array.from(links).find((a) => a.getAttribute('href') === `/deal/${sampleBid._id}#payment`);
        expect(paymentLink).toBeDefined();
        expect(paymentLink).toHaveTextContent(`/deal/${sampleBid._id}#payment`);

        // Verify zero raw merge tags, zero bracketed chips, and no remaining data-token spans
        const html = previewBody.innerHTML;
        expect(html).not.toMatch(/\{\{[a-z_]+\}\}/i);
        expect(html).not.toMatch(/\[(Atlanta Community Food Bank|Nutritious Pantry Mix|SKU-PREV-FOOD|200 cases|\$15\.00\/case|\$3,000\.00)\]/);
        expect(previewBody.querySelectorAll('span[data-token]').length).toBe(0);
      });

      it('hydrates all Counter Proposal tokens into authentic commercial values reflecting live counter parameter adjustments without bracketed chips or raw tags', () => {
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

        // Modify counter price & volume
        const priceInput = screen.getByPlaceholderText(/Enter counter price/i);
        fireEvent.change(priceInput, { target: { value: '16.50' } });

        const qtyInput = screen.getByPlaceholderText(/Enter counter quantity/i);
        fireEvent.change(qtyInput, { target: { value: '180' } });

        // Open preview dialog from Counter footer
        fireEvent.click(screen.getByTestId('footer-preview-counter-btn'));

        const previewBody = screen.getByTestId('email-preview-body');
        expect(previewBody).toBeInTheDocument();

        // Authentic values resolved:
        expect(previewBody).toHaveTextContent('Atlanta Community Food Bank');
        expect(previewBody).toHaveTextContent('Nutritious Pantry Mix 24pk');
        expect(previewBody).toHaveTextContent('$16.50/cs');
        expect(previewBody).toHaveTextContent('180 cases');
        expect(previewBody).toHaveTextContent('$15.00/cs');

        // Check CTA action links
        const links = previewBody.querySelectorAll('a');
        const acceptCta = Array.from(links).find((a) =>
          a.getAttribute('href')?.includes(`/portal/negotiation/${sampleBid._id}?action=accept`)
        );
        expect(acceptCta).toBeDefined();
        expect(acceptCta).toHaveTextContent('Accept Counter-Offer ($16.50/cs • 180 cases)');

        const renegotiateCta = Array.from(links).find((a) =>
          a.getAttribute('href')?.includes(`/portal/negotiation/${sampleBid._id}?action=rebid`)
        );
        expect(renegotiateCta).toBeDefined();
        expect(renegotiateCta).toHaveTextContent('Propose New Terms / Re-bid');

        // Verify zero raw merge tags and zero bracketed chips
        const html = previewBody.innerHTML;
        expect(html).not.toMatch(/\{\{[a-z_]+\}\}/i);
        expect(html).not.toMatch(/\[(\$16\.50\/cs|180 cases|\$15\.00\/cs|Atlanta Community Food Bank|Nutritious Pantry Mix)\]/);
        expect(previewBody.querySelectorAll('span[data-token]').length).toBe(0);
      });

      it('hydrates all Decline Notice tokens into authentic commercial values reflecting selected reason and audit memo notes without bracketed chips or raw tags', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Decline mode
        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        // Select decline reason & enter audit memo rationale
        const reasonSelect = screen.getByLabelText(/Decline Reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });

        const rationaleTextarea = screen.getByPlaceholderText(/Add specific rationale or notes/i);
        fireEvent.change(rationaleTextarea, {
          target: { value: 'Offer unit price is below floor recovery requirements.' }
        });

        // Open preview dialog from Decline footer
        fireEvent.click(screen.getByTestId('footer-preview-decline-btn'));

        const previewBody = screen.getByTestId('email-preview-body');
        expect(previewBody).toBeInTheDocument();

        // Authentic values resolved:
        expect(previewBody).toHaveTextContent('Atlanta Community Food Bank');
        expect(previewBody).toHaveTextContent('Nutritious Pantry Mix 24pk');
        expect(previewBody).toHaveTextContent('LOT-PREV-88');
        expect(previewBody).toHaveTextContent('Price below minimum recovery floor');
        expect(previewBody).toHaveTextContent('Offer unit price is below floor recovery requirements.');

        // Verify catalog redirect link
        const links = previewBody.querySelectorAll('a');
        const catalogLink = Array.from(links).find((a) =>
          a.getAttribute('href')?.includes('/marketplace')
        );
        expect(catalogLink).toBeDefined();
        expect(catalogLink).toHaveTextContent('Explore Available Surplus Inventory');

        // Verify zero raw merge tags, zero bracketed chips, and no remaining data-token spans
        const html = previewBody.innerHTML;
        expect(html).not.toMatch(/\{\{[a-z_]+\}\}/i);
        expect(html).not.toMatch(/\[(Atlanta Community Food Bank|Nutritious Pantry Mix|LOT-PREV-88|Price below minimum recovery floor|Offer unit price is below floor)\]/);
        expect(previewBody.querySelectorAll('span[data-token]').length).toBe(0);
      });
    });
  });

  describe('Issue 07: Full-Screen Workspace Shell, Centralized Tabs & Maximize Removal', () => {
    describe('Seam 1: Full-Screen Operational Workspace Shell & Maximize Removal', () => {
      it('renders a viewport-filling full-screen workspace shell and permanently eliminates maximize button', () => {
        const { container } = render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Root workspace container fills viewport with exact required Tailwind classes
        const workspaceShell = container.querySelector('[data-testid="bid-action-inspector-workspace"]') || container.firstElementChild;
        expect(workspaceShell).toBeInTheDocument();
        expect(workspaceShell?.className).toContain('fixed');
        expect(workspaceShell?.className).toContain('inset-0');
        expect(workspaceShell?.className).toContain('w-screen');
        expect(workspaceShell?.className).toContain('h-screen');
        expect(workspaceShell?.className).toContain('z-[1050]');
        expect(workspaceShell?.className).toContain('bg-slate-50');
        expect(workspaceShell?.className).toContain('dark:bg-slate-950');
        expect(workspaceShell?.className).toContain('flex');
        expect(workspaceShell?.className).toContain('flex-col');
        expect(workspaceShell?.className).toContain('overflow-hidden');

        // Modal overlay backdrop and floating card are eliminated
        expect(container.querySelector('.modal-overlay')).toBeNull();

        // Maximize/minimize toggle button is permanently removed
        expect(screen.queryByTestId('toggle-maximize-inspector-btn')).toBeNull();
        expect(screen.queryByRole('button', { name: /maximize/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /restore/i })).toBeNull();
      });
    });

    describe('Seam 2: Dual Header Exit Anchors & Preserved Metadata', () => {
      it('implements dual exit anchors (Back to Bids & Close Workspace) and preserves header metadata', () => {
        const handleClose = vi.fn();
        const handleReset = vi.fn();
        const nonPendingBid = { ...sampleBid, status: 'countered' };

        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={handleClose}
            onReset={handleReset}
            bid={nonPendingBid}
            lot={sampleLot}
          />
        );

        // 1. Dedicated Left Exit Anchor: Back to Bids & Offers
        const backBtn = screen.getByRole('button', { name: /back to bids/i });
        expect(backBtn).toBeInTheDocument();
        expect(backBtn).toHaveTextContent(/Back to Bids & Offers/i);
        fireEvent.click(backBtn);
        expect(handleClose).toHaveBeenCalledTimes(1);

        // 2. Explicit Right Exit Anchor: Close Workspace
        const closeBtn = screen.getByRole('button', { name: /close workspace/i });
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalledTimes(2);

        // 3. Preserved header metadata & controls
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
        expect(within(header).getByText(/LOT-99/i)).toBeInTheDocument();
        expect(within(header).getByText(/SKU-APPLES/i)).toBeInTheDocument();
        expect(within(header).getByTestId('modal-status-badge')).toBeInTheDocument();
        expect(within(header).getByText(/Organic Honeycrisp Apples/i)).toBeInTheDocument();
        expect(within(header).queryByTestId('header-preview-email-btn')).toBeNull();
        expect(within(header).getByRole('button', { name: /reset bid to pending/i })).toBeInTheDocument();
      });
    });

    describe('Seam 3: Centralized Commercial Stat Cards Container', () => {
      it('centralizes the 4 commercial stat cards within a max-w-[1100px] mx-auto w-full container', () => {
        const { container } = render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        const statCardsContainer = screen.getByTestId('centralized-commercial-stat-cards');
        expect(statCardsContainer).toBeInTheDocument();
        expect(statCardsContainer.className).toContain('max-w-[1100px]');
        expect(statCardsContainer.className).toContain('mx-auto');
        expect(statCardsContainer.className).toContain('w-full');

        // All 4 commercial stat cards are children within the centralized container
        expect(within(statCardsContainer).getByTestId('summary-buyer-org')).toBeInTheDocument();
        expect(within(statCardsContainer).getByTestId('summary-unit-offer')).toBeInTheDocument();
        expect(within(statCardsContainer).getByTestId('summary-volume-requested')).toBeInTheDocument();
        expect(within(statCardsContainer).getByTestId('summary-gross-recovery')).toBeInTheDocument();
      });
    });

    describe('Seam 4: Centralized Mode Navigation Tabs & Content Body', () => {
      it('centers the Mode Navigation Tabs bar horizontally within a max-w-[1100px] container and constrains body content', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Navigation Tabs bar is centered within max-w-[1100px] mx-auto and has justify-content: center
        const tabsBar = screen.getByTestId('centralized-navigation-tabs-bar');
        expect(tabsBar).toBeInTheDocument();
        expect(tabsBar.className).toContain('max-w-[1100px]');
        expect(tabsBar.className).toContain('mx-auto');
        expect(tabsBar.style.justifyContent).toBe('center');

        // All 4 tabs are present inside the centered tabs bar
        expect(within(tabsBar).getByRole('button', { name: /accept offer/i })).toBeInTheDocument();
        expect(within(tabsBar).getByRole('button', { name: /negotiate/i })).toBeInTheDocument();
        expect(within(tabsBar).getByRole('button', { name: /decline/i })).toBeInTheDocument();
        expect(within(tabsBar).getByRole('button', { name: /timeline/i })).toBeInTheDocument();

        // Body content container is constrained within max-w-[1100px] mx-auto
        const bodyContainer = screen.getByTestId('centralized-workspace-body');
        expect(bodyContainer).toBeInTheDocument();
        expect(bodyContainer.className).toContain('max-w-[1100px]');
        expect(bodyContainer.className).toContain('mx-auto');
        expect(bodyContainer.className).toContain('w-full');
      });
    });
  });

  describe('Issue 08 — Sequential Stacking & Clean Single-Column View for Accept Offer Tab', () => {
    describe('Seam 1: Sequential Single-Column Work Surface & Top-Down Section Stacking', () => {
      it('refactors accept-work-surface into a single-column vertical flex layout with top-down sequential section stacking', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        const workSurface = screen.getByTestId('accept-work-surface');
        expect(workSurface).toBeInTheDocument();

        // 1. Single-column vertical flex layout classes/styling
        expect(workSurface.className).toContain('flex');
        expect(workSurface.className).toContain('flex-col');
        expect(workSurface.className).toContain('max-w-[1100px]');
        expect(workSurface.className).toContain('mx-auto');
        expect(workSurface.className).toContain('w-full');

        // 2. Sequential stacking order in DOM
        const leftPane = screen.getByTestId('accept-left-pane');
        const rightPane = screen.getByTestId('accept-right-pane');
        const executionBar = screen.getByTestId('accept-execution-bar');

        expect(leftPane).toBeInTheDocument();
        expect(rightPane).toBeInTheDocument();
        expect(executionBar).toBeInTheDocument();

        // Check relative document order
        expect(leftPane.compareDocumentPosition(rightPane) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rightPane.compareDocumentPosition(executionBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // executionBar is outside rightPane
        expect(rightPane.contains(executionBar)).toBe(false);

        // Also preserves existing accept-settlement-footer test ID
        expect(screen.getByTestId('accept-settlement-footer')).toBeInTheDocument();
      });
    });

    describe('Seam 2: Full-Width Sequential Rows in Logistics & Allocation Card', () => {
      it('renders all 4 logistics form fields on individual full-width rows with step badges and sequential order', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        const logisticsCard = screen.getByTestId('accept-logistics-card');
        expect(logisticsCard).toBeInTheDocument();

        // 4 individual rows with dedicated test IDs
        const rowAddress = within(logisticsCard).getByTestId('logistics-row-address');
        const rowHours = within(logisticsCard).getByTestId('logistics-row-hours');
        const rowQuantity = within(logisticsCard).getByTestId('logistics-row-quantity');
        const rowPrice = within(logisticsCard).getByTestId('logistics-row-price');

        expect(rowAddress).toBeInTheDocument();
        expect(rowHours).toBeInTheDocument();
        expect(rowQuantity).toBeInTheDocument();
        expect(rowPrice).toBeInTheDocument();

        // Ensure full width classes
        expect(rowAddress.className).toContain('w-full');
        expect(rowHours.className).toContain('w-full');
        expect(rowQuantity.className).toContain('w-full');
        expect(rowPrice.className).toContain('w-full');

        // Document order of rows is sequential
        expect(rowAddress.compareDocumentPosition(rowHours) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rowHours.compareDocumentPosition(rowQuantity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rowQuantity.compareDocumentPosition(rowPrice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Step badges exist in rows
        expect(within(rowAddress).getByText('Step 1.1')).toBeInTheDocument();
        expect(within(rowHours).getByText('Step 1.2')).toBeInTheDocument();
        expect(within(rowQuantity).getByText('Step 1.3')).toBeInTheDocument();
        expect(within(rowPrice).getByText('Step 1.4')).toBeInTheDocument();

        // Helper labels & badges
        expect(within(rowAddress).getByText('FOB Origin')).toBeInTheDocument();
        expect(within(rowHours).getByText('Appointment Req.')).toBeInTheDocument();
        expect(within(rowQuantity).getByText(/Max/i)).toBeInTheDocument();
        expect(within(rowPrice).getByText('Settled')).toBeInTheDocument();
      });
    });

    describe('Seam 3: Full-Width Email Builder Canvas & Channel Controls', () => {
      it('expands TipTap Email Builder to full container width with clean toolbar controls, token badges, and channel selector pills', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        const rightPane = screen.getByTestId('accept-right-pane');
        const commCard = screen.getByTestId('accept-communication-card');

        expect(rightPane.className).toContain('w-full');
        expect(commCard.className).toContain('w-full');

        // Step 2 indicator
        expect(within(commCard).getByText('Step 2')).toBeInTheDocument();

        // TipTap editor canvas is rendered inside full width container
        const editor = within(commCard).getByTestId('workflow-tiptap-editor');
        expect(editor).toBeInTheDocument();

        // Channel selector pills exist and are functional
        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        // Token badge count & word count are rendered
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();
      });
    });

    describe('Seam 4: Sticky Bottom Settlement Summary Bar & Execution Actions', () => {
      it('docks the settlement execution bar stickily at the bottom aligned with 1100px container, renders Step 3 badge, and executes accept dispatch', async () => {
        const onAcceptMock = vi.fn();
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
            onAccept={onAcceptMock}
          />
        );

        const executionBar = screen.getByTestId('accept-execution-bar');
        expect(executionBar).toBeInTheDocument();

        // 1. Sticky bottom positioning and backdrop blur
        expect(executionBar.className).toContain('sticky');
        expect(executionBar.className).toContain('bottom-0');
        expect(executionBar.className).toContain('z-20');
        expect(executionBar.className).toContain('backdrop-blur');

        // 2. Step 3 indicator
        expect(within(executionBar).getByText('Step 3')).toBeInTheDocument();

        // 3. Live calculations and breakdown
        expect(within(executionBar).getByTestId('total-settlement-value')).toBeInTheDocument();
        expect(within(executionBar).getByText(/Total Settlement Value:/i)).toBeInTheDocument();

        // 4. Preserves Preview Email button
        const previewBtn = within(executionBar).getByTestId('footer-preview-accept-btn');
        expect(previewBtn).toBeInTheDocument();

        // 5. Confirm Offer action dispatches onAccept
        const confirmBtn = within(executionBar).getByRole('button', { name: /confirm offer/i });
        expect(confirmBtn).toBeInTheDocument();
        expect(confirmBtn).not.toBeDisabled();

        fireEvent.click(confirmBtn);
        await waitFor(() => {
          expect(onAcceptMock).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('Issue 09 — Sequential Stacking & Clean Single-Column View for Negotiate / Counter Tab', () => {
    describe('Seam 1: Sequential Single-Column Work Surface & Top-Down Section Stacking', () => {
      it('refactors counter-split-work-surface into a single-column vertical flex layout with top-down sequential section stacking', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Negotiate / Counter tab
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));

        const workSurface = screen.getByTestId('counter-split-work-surface');
        expect(workSurface).toBeInTheDocument();

        // 1. Single-column vertical flex layout classes/styling
        expect(workSurface.className).toContain('flex');
        expect(workSurface.className).toContain('flex-col');
        expect(workSurface.className).toContain('gap-6');
        expect(workSurface.className).toContain('max-w-[1100px]');
        expect(workSurface.className).toContain('mx-auto');
        expect(workSurface.className).toContain('w-full');

        // 2. Sequential stacking order in DOM
        const leftPane = screen.getByTestId('counter-left-pane');
        const rightPane = screen.getByTestId('counter-right-pane');
        const summaryBar = screen.getByTestId('counter-summary-bar');

        expect(leftPane).toBeInTheDocument();
        expect(rightPane).toBeInTheDocument();
        expect(summaryBar).toBeInTheDocument();

        // Check relative document order: leftPane -> rightPane -> summaryBar
        expect(leftPane.compareDocumentPosition(rightPane) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rightPane.compareDocumentPosition(summaryBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // summaryBar is outside rightPane
        expect(rightPane.contains(summaryBar)).toBe(false);

        // Step badges exist
        expect(within(leftPane).getByText('Step 1')).toBeInTheDocument();
        expect(within(rightPane).getByText('Step 2')).toBeInTheDocument();
        expect(within(summaryBar).getByText('Step 3')).toBeInTheDocument();

        // Preserves contract test IDs
        expect(screen.getByTestId('negotiate-parameters-card')).toBeInTheDocument();
        expect(screen.getByTestId('counter-communication-card')).toBeInTheDocument();
        expect(screen.getByTestId('negotiate-summary-bar')).toBeInTheDocument();
      });
    });

    describe('Seam 2: Full-Width Sequential Rows in Counter-Offer Parameters Card', () => {
      it('renders all 4 parameter fields on individual full-width rows with step badges and sequential order', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));

        const paramsCard = screen.getByTestId('negotiate-parameters-card');
        expect(paramsCard).toBeInTheDocument();

        // 4 individual rows with dedicated test IDs
        const rowPrice = within(paramsCard).getByTestId('counter-row-price');
        const rowQuantity = within(paramsCard).getByTestId('counter-row-quantity');
        const rowWindow = within(paramsCard).getByTestId('counter-row-window');
        const rowFloor = within(paramsCard).getByTestId('counter-row-floor');

        expect(rowPrice).toBeInTheDocument();
        expect(rowQuantity).toBeInTheDocument();
        expect(rowWindow).toBeInTheDocument();
        expect(rowFloor).toBeInTheDocument();

        // Ensure full width classes
        expect(rowPrice.className).toContain('w-full');
        expect(rowQuantity.className).toContain('w-full');
        expect(rowWindow.className).toContain('w-full');
        expect(rowFloor.className).toContain('w-full');

        // Document order of rows is sequential
        expect(rowPrice.compareDocumentPosition(rowQuantity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rowQuantity.compareDocumentPosition(rowWindow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rowWindow.compareDocumentPosition(rowFloor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Step badges exist in rows
        expect(within(rowPrice).getByText('Step 1.1')).toBeInTheDocument();
        expect(within(rowQuantity).getByText('Step 1.2')).toBeInTheDocument();
        expect(within(rowWindow).getByText('Step 1.3')).toBeInTheDocument();
        expect(within(rowFloor).getByText('Step 1.4')).toBeInTheDocument();

        // Helper labels & badges
        expect(within(rowPrice).getByTestId('negotiate-uplift-badge')).toBeInTheDocument();
        expect(within(rowQuantity).getByText(/Max/i)).toBeInTheDocument();
        expect(within(rowWindow).getByText('Auto-expires')).toBeInTheDocument();
        expect(within(rowFloor).getByText(/Met|Below Floor/i)).toBeInTheDocument();
      });
    });

    describe('Seam 3: Full-Width Multi-Channel Communication Card & Live Token Sync', () => {
      it('expands communication card to full width, renders Step 2 badge, channel pills, dynamic tokens, accordion collapse, and live token rehydration', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));

        const rightPane = screen.getByTestId('counter-right-pane');
        const commCard = screen.getByTestId('counter-communication-card');

        expect(rightPane.className).toContain('w-full');
        expect(commCard.className).toContain('w-full');

        // Step 2 indicator
        expect(within(commCard).getByText('Step 2')).toBeInTheDocument();

        // Recipient email indicator
        expect(within(commCard).getByText(/Recipient:/i)).toBeInTheDocument();
        expect(within(commCard).getByText('apex@liquidators.com')).toBeInTheDocument();

        // Channel selector pills
        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        // Dynamic tokens & word counts
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();

        // TipTap editor canvas
        const editor = within(commCard).getByTestId('workflow-tiptap-editor');
        expect(editor).toBeInTheDocument();

        // Accordion collapse and expand
        const accordionToggle = within(commCard).getByRole('button', { name: /toggle negotiate communication accordion/i });
        const commBody = screen.getByTestId('negotiate-communication-body');
        expect(commBody).toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).not.toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).toBeVisible();

        // Live token re-hydration: change counter price to 4.25
        const priceInput = screen.getByPlaceholderText(/enter counter price/i);
        fireEvent.change(priceInput, { target: { value: '4.25' } });

        const priceBadge = editor.querySelector('.token-badge-pill[data-token="counter_price"]');
        expect(priceBadge?.textContent).toBe('[$4.25/cs]');
      });
    });

    describe('Seam 4: Sticky Bottom Counter Summary Dispatch Bar & In-Situ Execution', () => {
      it('docks the counter summary dispatch bar stickily at the bottom aligned with 1100px container, renders Step 3 badge, delta indicators, and executes counter dispatch', async () => {
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

        fireEvent.click(screen.getByRole('button', { name: /re-negotiate|negotiate/i }));

        const summaryBar = screen.getByTestId('counter-summary-bar');
        expect(summaryBar).toBeInTheDocument();

        // 1. Sticky bottom positioning and backdrop blur
        expect(summaryBar.className).toContain('sticky');
        expect(summaryBar.className).toContain('bottom-0');
        expect(summaryBar.className).toContain('z-20');
        expect(summaryBar.className).toContain('backdrop-blur');

        // 2. Step 3 indicator
        expect(within(summaryBar).getByText('Step 3')).toBeInTheDocument();

        // 3. Real-time total counter value and delta indicators
        expect(within(summaryBar).getByTestId('counter-total-value')).toBeInTheDocument();
        expect(within(summaryBar).getByText(/Counter Total Value:/i)).toBeInTheDocument();
        expect(within(summaryBar).getByTestId('counter-delta-indicators')).toBeInTheDocument();

        // 4. Outbound Email Preview trigger
        const previewBtn = within(summaryBar).getByTestId('footer-preview-counter-btn');
        expect(previewBtn).toBeInTheDocument();

        // 5. Dispatch Counter-Offer action triggers onCounter callback and preserves in-situ continuity
        const dispatchBtn = within(summaryBar).getByRole('button', { name: /dispatch counter-offer/i });
        expect(dispatchBtn).toBeInTheDocument();
        expect(dispatchBtn).not.toBeDisabled();

        fireEvent.click(dispatchBtn);
        await waitFor(() => {
          expect(onCounterMock).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('Issue 10 — Sequential Stacking & Clean Single-Column View for Decline Offer Tab', () => {
    describe('Seam 1: Sequential Single-Column Work Surface & Top-Down Section Stacking', () => {
      it('refactors decline-split-work-surface into a single-column vertical flex layout with top-down sequential section stacking', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Switch to Decline Offer tab
        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const workSurface = screen.getByTestId('decline-split-work-surface');
        expect(workSurface).toBeInTheDocument();

        // 1. Single-column vertical flex layout classes/styling
        expect(workSurface.className).toContain('flex');
        expect(workSurface.className).toContain('flex-col');
        expect(workSurface.className).toContain('gap-6');
        expect(workSurface.className).toContain('max-w-[1100px]');
        expect(workSurface.className).toContain('mx-auto');
        expect(workSurface.className).toContain('w-full');

        // 2. Sequential stacking order in DOM
        const leftPane = screen.getByTestId('decline-left-pane');
        const rightPane = screen.getByTestId('decline-right-pane');
        const actionFooter = screen.getByTestId('decline-action-footer');

        expect(leftPane).toBeInTheDocument();
        expect(rightPane).toBeInTheDocument();
        expect(actionFooter).toBeInTheDocument();

        // Check relative document order: leftPane -> rightPane -> actionFooter
        expect(leftPane.compareDocumentPosition(rightPane) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rightPane.compareDocumentPosition(actionFooter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Step badges exist
        expect(within(leftPane).getByText('Step 1')).toBeInTheDocument();
        expect(within(rightPane).getByText('Step 2')).toBeInTheDocument();
        expect(within(actionFooter).getByText('Step 3')).toBeInTheDocument();

        // Preserves contract test IDs
        expect(screen.getByTestId('decline-specification-card')).toBeInTheDocument();
        expect(screen.getByTestId('decline-communication-card')).toBeInTheDocument();
      });
    });

    describe('Seam 2: Full-Width Sequential Rows in Decline Specification Card', () => {
      it('renders all 3 specification fields on individual full-width rows with step badges and sequential order', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const specCard = screen.getByTestId('decline-specification-card');
        expect(specCard).toBeInTheDocument();

        // 3 individual rows with dedicated test IDs
        const rowReason = within(specCard).getByTestId('decline-row-reason');
        const rowMemo = within(specCard).getByTestId('decline-row-memo');
        const rowRelist = within(specCard).getByTestId('decline-row-relist');

        expect(rowReason).toBeInTheDocument();
        expect(rowMemo).toBeInTheDocument();
        expect(rowRelist).toBeInTheDocument();

        // Ensure full width classes
        expect(rowReason.className).toContain('w-full');
        expect(rowMemo.className).toContain('w-full');
        expect(rowRelist.className).toContain('w-full');

        // Document order of rows is sequential
        expect(rowReason.compareDocumentPosition(rowMemo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(rowMemo.compareDocumentPosition(rowRelist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Step badges exist in rows
        expect(within(rowReason).getByText('Step 1.1')).toBeInTheDocument();
        expect(within(rowMemo).getByText('Step 1.2')).toBeInTheDocument();
        expect(within(rowRelist).getByText('Step 1.3')).toBeInTheDocument();

        // Specific form control verification within rows
        expect(within(rowReason).getByRole('combobox', { name: /decline reason/i })).toBeInTheDocument();
        expect(within(rowMemo).getByPlaceholderText(/add specific rationale or notes/i)).toBeInTheDocument();
      });
    });

    describe('Seam 3: Full-Width Multi-Channel Communication Card & Live Token Sync', () => {
      it('expands decline communication card to full width, renders Step 2 badge, channel pills, dynamic tokens, accordion collapse, and live token rehydration', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const rightPane = screen.getByTestId('decline-right-pane');
        const commCard = screen.getByTestId('decline-communication-card');

        expect(rightPane.className).toContain('w-full');
        expect(commCard.className).toContain('w-full');

        // Step 2 indicator
        expect(within(commCard).getByText('Step 2')).toBeInTheDocument();

        // Recipient email indicator
        expect(within(commCard).getByText(/Recipient:/i)).toBeInTheDocument();
        expect(within(commCard).getByText('apex@liquidators.com')).toBeInTheDocument();

        // Channel selector pills
        const emailPill = within(commCard).getByRole('button', { name: /^email$/i });
        const inAppPill = within(commCard).getByRole('button', { name: /^in-app$/i });
        const smsPill = within(commCard).getByRole('button', { name: /^sms$/i });

        expect(emailPill).toBeInTheDocument();
        expect(inAppPill).toBeInTheDocument();
        expect(smsPill).toBeInTheDocument();

        // Dynamic tokens & word counts
        expect(within(commCard).getByText(/\d+ Dynamic Tokens/i)).toBeInTheDocument();
        expect(within(commCard).getByText(/\d+ Words/i)).toBeInTheDocument();

        // TipTap editor canvas
        const editor = within(commCard).getByTestId('workflow-tiptap-editor');
        expect(editor).toBeInTheDocument();

        // Accordion collapse and expand
        const accordionToggle = within(commCard).getByRole('button', { name: /toggle decline communication accordion/i });
        const commBody = screen.getByTestId('decline-communication-body');
        expect(commBody).toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).not.toBeVisible();

        fireEvent.click(accordionToggle);
        expect(commBody).toBeVisible();

        // Live token re-hydration: select decline reason and verify dynamic token pill in editor
        const reasonSelect = screen.getByLabelText(/decline reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });

        const reasonBadge = editor.querySelector('.token-badge-pill[data-token="decline_reason"]');
      });
    });

    describe('Seam 4: Sticky Bottom Decline Action Footer & In-Situ Execution', () => {
      it('docks the decline action footer stickily at the bottom aligned with 1100px container, renders Step 3 badge, escrow release indicator, and executes decline dispatch', async () => {
        const onDeclineMock = vi.fn().mockResolvedValue(undefined);
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
            onDecline={onDeclineMock}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

        const footer = screen.getByTestId('decline-action-footer');
        expect(footer).toBeInTheDocument();

        // 1. Sticky bottom positioning and backdrop blur
        expect(footer.className).toContain('sticky');
        expect(footer.className).toContain('bottom-0');
        expect(footer.className).toContain('z-20');
        expect(footer.className).toContain('backdrop-blur');

        // 2. Step 3 indicator
        expect(within(footer).getByText('Step 3')).toBeInTheDocument();

        // 3. Escrow deposit release notice and inventory return state indicator
        expect(within(footer).getByText(/Escrow Deposit Release Notice:/i)).toBeInTheDocument();
        expect(within(footer).getByText(/Buyer deposit hold released immediately upon rejection/i)).toBeInTheDocument();
        expect(within(footer).getByText(/Auto-Relist Active: 150 cases returning to open surplus pool/i)).toBeInTheDocument();

        // 4. Outbound Email Preview trigger
        const previewBtn = within(footer).getByTestId('footer-preview-decline-btn');
        expect(previewBtn).toBeInTheDocument();

        // 5. Confirm Decline & Send Notice action triggers onDecline callback
        const declineBtn = within(footer).getByRole('button', { name: /confirm decline & send notice/i });
        expect(declineBtn).toBeInTheDocument();

        // Select a mandatory reason first to enable button
        const reasonSelect = screen.getByLabelText(/decline reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });
        expect(declineBtn).not.toBeDisabled();

        fireEvent.click(declineBtn);
        await waitFor(() => {
          expect(onDeclineMock).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('Issue 11 — Timeline Centralization, Verification & ADR 0037 Amendment', () => {
    describe('Seam 1: Centralized Timeline Audit Trail Container & Styling', () => {
      it('aligns the Timeline Audit Trail within the centralized max-w-[1100px] mx-auto container with consistent card styling, filters, and search bar', () => {
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /timeline/i }));

        const timelineSurface = screen.getByTestId('timeline-audit-surface');
        expect(timelineSurface).toBeInTheDocument();

        // 1. Centralized container layout classes matching other tabs
        expect(timelineSurface.className).toContain('flex');
        expect(timelineSurface.className).toContain('flex-col');
        expect(timelineSurface.className).toContain('max-w-[1100px]');
        expect(timelineSurface.className).toContain('mx-auto');
        expect(timelineSurface.className).toContain('w-full');

        // 2. Controls bar with filters and search input
        const controlsBar = screen.getByTestId('timeline-controls-bar');
        expect(controlsBar).toBeInTheDocument();
        expect(within(controlsBar).getByTestId('timeline-category-filter')).toBeInTheDocument();
        expect(within(controlsBar).getByTestId('timeline-event-count')).toBeInTheDocument();
        expect(within(controlsBar).getByTestId('timeline-search-input')).toBeInTheDocument();

        // 3. Activity feed within centralized container
        const activityFeed = screen.getByTestId('timeline-activity-feed');
        expect(activityFeed).toBeInTheDocument();
      });
    });

    describe('Seam 2: Outbound Email Preview Dialog in Full-Screen Workspace Across Modes', () => {
      it('verifies outbound email preview dialog opens, renders resolved token values, and dismisses cleanly across all tabs in full-screen mode', () => {
        const onCloseMock = vi.fn();
        render(
          <BidActionInspectorModal
            isOpen={true}
            onClose={onCloseMock}
            bid={sampleBid}
            lot={sampleLot}
          />
        );

        // Verify full-screen shell is rendered
        const shell = screen.getByTestId('bid-action-inspector-workspace');
        expect(shell).toBeInTheDocument();
        expect(shell.className).toContain('w-screen');
        expect(shell.className).toContain('h-screen');

        // --- Tab 1: Accept Offer ---
        const acceptPreviewBtn = screen.getByTestId('footer-preview-accept-btn');
        fireEvent.click(acceptPreviewBtn);

        const previewDialog = screen.getByTestId('email-preview-dialog');
        expect(previewDialog).toBeInTheDocument();

        // Verify resolved token preview content
        const previewBody = screen.getByTestId('email-preview-body');
        expect(previewBody.textContent).toContain('Apex Liquidators');
        expect(previewBody.textContent).toContain('$3.50');
        expect(previewBody.textContent).not.toContain('{{buyer_company}}');
        expect(previewBody.textContent).not.toContain('{{settled_price}}');

        // Dismiss via Done button
        fireEvent.click(screen.getByTestId('done-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();

        // --- Tab 2: Negotiate / Counter ---
        fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));
        const counterPreviewBtn = screen.getByTestId('footer-preview-counter-btn');
        fireEvent.click(counterPreviewBtn);

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();
        const counterBody = screen.getByTestId('email-preview-body');
        expect(counterBody.textContent).not.toContain('{{counter_price}}');
        expect(counterBody.textContent).not.toContain('{{counter_quantity}}');

        // Dismiss via close (X) button
        fireEvent.click(screen.getByTestId('close-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();

        // --- Tab 3: Decline Offer ---
        fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));
        const reasonSelect = screen.getByLabelText(/decline reason/i);
        fireEvent.change(reasonSelect, { target: { value: 'Price below minimum recovery floor' } });

        const declinePreviewBtn = screen.getByTestId('footer-preview-decline-btn');
        fireEvent.click(declinePreviewBtn);

        expect(screen.getByTestId('email-preview-dialog')).toBeInTheDocument();
        const declineBody = screen.getByTestId('email-preview-body');
        expect(declineBody.textContent).toContain('Price below minimum recovery floor');
        expect(declineBody.textContent).not.toContain('{{decline_reason}}');

        // Dismiss via Done button
        fireEvent.click(screen.getByTestId('done-email-preview-btn'));
        expect(screen.queryByTestId('email-preview-dialog')).not.toBeInTheDocument();
        expect(onCloseMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('Issue 12: High-End UI/UX Refinement (ux-v1) — Whole-Page Scrolling, Relative Positioning & Correlated Input Ergonomics', () => {
    it('provides whole-page scrollability via a unified scroll container and relative positioning', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      // 1. Whole-page scroll container wraps header, cards, tabs, and workspace body
      const scrollContainer = screen.getByTestId('bid-action-inspector-scroll-container');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer.className).toContain('overflow-y-auto');
      expect(scrollContainer.className).toContain('relative');

      // 2. Relative positioning on key layout anchors
      const header = screen.getByRole('banner');
      expect(header.className).toContain('relative');

      const statCardsContainer = screen.getByTestId('centralized-commercial-stat-cards');
      expect(statCardsContainer.className).toContain('relative');

      const tabsBar = screen.getByTestId('centralized-navigation-tabs-bar');
      expect(tabsBar.className).toContain('relative');

      const workspaceBody = screen.getByTestId('centralized-workspace-body');
      expect(workspaceBody.className).toContain('relative');
    });

    it('implements correlated input box widths, increased height (44px), border radius, and low-contrast borders', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      // Address input vs quantity & price inputs:
      const addressInput = screen.getByLabelText(/DC Pickup Address/i);
      const addressWrapper = addressInput.parentElement;
      expect(addressWrapper).toHaveStyle({ maxWidth: '680px' });
      expect(addressInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      const hoursInput = screen.getByLabelText(/Dock Operating Hours/i);
      const hoursWrapper = hoursInput.parentElement;
      expect(hoursWrapper).toHaveStyle({ maxWidth: '380px' });
      expect(hoursInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      const quantityInput = screen.getByLabelText(/Awarded Quantity/i);
      const quantityWrapper = quantityInput.parentElement;
      expect(quantityWrapper).toHaveStyle({ maxWidth: '220px' });
      expect(quantityInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      const priceInput = screen.getByLabelText(/Agreed Price/i);
      const priceWrapper = priceInput.parentElement;
      expect(priceWrapper).toHaveStyle({ maxWidth: '220px' });
      expect(priceInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px'
      });
    });

    it('applies correlated input sizing and border radius to negotiate and decline modes', () => {
      render(
        <BidActionInspectorModal
          isOpen={true}
          onClose={vi.fn()}
          bid={sampleBid}
          lot={sampleLot}
        />
      );

      // Switch to Negotiate tab
      fireEvent.click(screen.getByRole('button', { name: /re-negotiate/i }));

      const counterPriceInput = screen.getByPlaceholderText(/Enter counter price/i);
      const counterPriceWrapper = counterPriceInput.parentElement;
      expect(counterPriceWrapper).toHaveStyle({ maxWidth: '220px' });
      expect(counterPriceInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      const counterQtyInput = screen.getByPlaceholderText(/Enter counter quantity/i);
      const counterQtyWrapper = counterQtyInput.parentElement;
      expect(counterQtyWrapper).toHaveStyle({ maxWidth: '220px' });
      expect(counterQtyInput).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      // Switch to Decline tab
      fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

      const declineReasonSelect = screen.getByLabelText(/decline reason/i);
      const declineReasonWrapper = declineReasonSelect.parentElement;
      expect(declineReasonWrapper).toHaveStyle({ maxWidth: '460px' });
      expect(declineReasonSelect).toHaveStyle({
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });

      const declineMemo = screen.getByPlaceholderText(/Add specific rationale/i);
      const declineMemoWrapper = declineMemo.parentElement;
      expect(declineMemoWrapper).toHaveStyle({ maxWidth: '680px' });
      expect(declineMemo).toHaveStyle({
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      });
    });
  });
});











