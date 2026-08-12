import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Removal of Redundant Section 4 Email Template in Workflow Studio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [] }), { status: 200 })));
  });

  it('does not render Section 4 "Email Template" in Workflow Studio', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify Centralized Email Attachment section 4 does not exist in Workflow Studio
    expect(screen.queryByText(/4\. (Email Template|Attach Centralized Email Template)/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('attach-email-template-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('workflow-email-builder-container')).not.toBeInTheDocument();
  });
});
