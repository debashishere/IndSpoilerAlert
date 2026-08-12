import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Removal of Redundant Section 4 Email Template from LiquidationAutomationStudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [] }), { status: 200 })));
  });

  it('verifies Section 4 Email Template is no longer rendered in LiquidationAutomationStudio', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify Centralized Email Attachment section header does NOT exist
    expect(screen.queryByText(/4\. (Email Template|Attach Centralized Email Template)/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('attach-email-template-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('workflow-email-builder-container')).not.toBeInTheDocument();
  });
});

