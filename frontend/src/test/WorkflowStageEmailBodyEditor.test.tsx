import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Workflow Stage Email Template & Body Data Editor Functionality', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [], lots: [] }), { status: 200 })));
    Element.prototype.scrollIntoView = vi.fn();
  });

  test('Section 4 renders 4-step progressive stepper including Step 3: Edit Email Body', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="/api"
      />
    );

    expect(screen.getByText(/1\. Template/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Subject/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Edit Email Body/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Preview & Overrides/i)).toBeInTheDocument();
  });

  test('clicking Step 3 pill in Section 4 displays TipTap Body Editor for global workflow template', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="/api"
      />
    );

    const step3Button = screen.getByRole('button', { name: /3\. Edit Email Body/i });
    fireEvent.click(step3Button);

    expect(screen.getByText(/Step 3: Edit Workflow Email Body HTML/i)).toBeInTheDocument();
    expect(screen.getByTestId('workflow-tiptap-editor')).toBeInTheDocument();
  });

  test('expanded Stage card in Section 3 renders "Configure Stage Email" button and email-configured badge', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="/api"
      />
    );

    // Stage email section container still exists
    expect(screen.getByTestId('stage-1-email-editor-section')).toBeInTheDocument();

    // Old inline controls are gone — new button exists
    expect(screen.getByTestId('configure-stage-email-btn-1')).toBeInTheDocument();
    expect(screen.queryByTestId('stage-1-subject-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stage-1-template-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-stage-1-body-btn')).not.toBeInTheDocument();

    // Default stages ship with email data — badge is shown
    expect(screen.getByTestId('email-configured-badge-1')).toBeInTheDocument();
  });
});
