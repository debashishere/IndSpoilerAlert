import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { WorkflowEmailBuilder } from '../components/WorkflowEmailBuilder';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('WorkflowEmailBuilder & TipTap Body Editor Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [], lots: [] }), { status: 200 })));
    Element.prototype.scrollIntoView = vi.fn();
  });

  test('renders top breadcrumb navigation path and shell', () => {
    render(<WorkflowEmailBuilder />);
    
    expect(screen.getByText(/Campaigns/i)).toBeInTheDocument();
    expect(screen.getByText(/Liquidation Workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Template Body/i)).toBeInTheDocument();
  });

  test('renders action buttons and triggers callbacks with metadata & body HTML', () => {
    const handleBack = vi.fn();
    const handleSaveDraft = vi.fn();
    const handleNext = vi.fn();

    render(
      <WorkflowEmailBuilder
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        onNext={handleNext}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    const saveButton = screen.getByTestId('save-draft-btn');
    const nextButton = screen.getByTestId('next-step-btn');

    expect(backButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);

    fireEvent.click(saveButton);
    expect(handleSaveDraft).toHaveBeenCalledWith(expect.objectContaining({
      template: expect.any(String),
      subject: expect.any(String),
      bodyHtml: expect.any(String)
    }));

    fireEvent.click(nextButton);
    expect(handleNext).toHaveBeenCalledWith(expect.objectContaining({
      template: expect.any(String),
      subject: expect.any(String),
      bodyHtml: expect.any(String)
    }));
  });

  test('renders TipTap Body Editor with custom toolbar controls', () => {
    const { container } = render(<WorkflowEmailBuilder />);

    const editorContainer = container.querySelector('[data-testid="workflow-tiptap-editor"]');
    expect(editorContainer).toBeInTheDocument();

    // Verify Toolbar Elements
    expect(screen.getByTestId('font-family-select')).toBeInTheDocument();
    expect(screen.getByTestId('font-size-select')).toBeInTheDocument();
    expect(screen.getByTestId('formats-select')).toBeInTheDocument();
    expect(screen.getByTestId('btn-bold')).toBeInTheDocument();
    expect(screen.getByTestId('btn-italic')).toBeInTheDocument();
    expect(screen.getByTestId('btn-link')).toBeInTheDocument();
    expect(screen.getByTestId('btn-image')).toBeInTheDocument();
    expect(screen.getByTestId('text-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('bg-color-picker')).toBeInTheDocument();
  });

  test('opens Link modal and Image insert modal', () => {
    render(<WorkflowEmailBuilder />);

    // Test Link Modal
    const linkBtn = screen.getByTestId('btn-link');
    fireEvent.click(linkBtn);
    expect(screen.getByText(/Insert Hyperlink/i)).toBeInTheDocument();
    expect(screen.getByTestId('link-url-input')).toBeInTheDocument();

    // Close Link Modal
    fireEvent.click(screen.getByText(/Cancel/i));

    // Test Image Modal
    const imgBtn = screen.getByTestId('btn-image');
    fireEvent.click(imgBtn);
    expect(screen.getAllByText(/Insert Image/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('upload-local-file-btn')).toBeInTheDocument();
  });

  test('inserts dynamic tokens from toolbar dropdown', () => {
    render(<WorkflowEmailBuilder />);

    const tokensBtn = screen.getByTestId('editor-tokens-button');
    fireEvent.click(tokensBtn);

    expect(screen.getByText(/Insert Token/i)).toBeInTheDocument();
    expect(screen.getAllByText(/buyer_name/i).length).toBeGreaterThan(0);
  });

  test('verifies Section 4 Email Template container is not rendered in LiquidationAutomationStudio', () => {
    const { container } = render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="/api"
      />
    );

    const builderShell = container.querySelector('[data-testid="workflow-email-builder-container"]');
    expect(builderShell).not.toBeInTheDocument();
  });
});
