import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Centralized Email Template Attachment & Live Device Preview in Workflow Studio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [] }), { status: 200 })));
  });

  it('renders Centralized Email Template Attachment section in Workflow Studio', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify Centralized Email Attachment section exists
    expect(screen.getByText(/4\. (Email Template|Attach Centralized Email Template)/i)).toBeInTheDocument();
    expect(screen.getByTestId('attach-email-template-select')).toBeInTheDocument();
  });

  it('allows selecting different centralized email templates from the dropdown', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    const templateSelect = screen.getByTestId('attach-email-template-select') as HTMLSelectElement;
    expect(templateSelect).toBeInTheDocument();

    // Change template selection to short-dated-auction
    fireEvent.change(templateSelect, { target: { value: 'short-dated-auction' } });
    expect(templateSelect.value).toBe('short-dated-auction');

    // Change template selection to direct-donation-notice
    fireEvent.change(templateSelect, { target: { value: 'direct-donation-notice' } });
    expect(templateSelect.value).toBe('direct-donation-notice');
  });

  it('renders Live Device Preview viewport with Mobile and Desktop view toggles', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Live Device Preview container exists
    expect(screen.getByTestId('live-device-preview')).toBeInTheDocument();

    const mobileBtn = screen.getByRole('button', { name: /Mobile View/i });
    const desktopBtn = screen.getByRole('button', { name: /Desktop View/i });

    expect(mobileBtn).toBeInTheDocument();
    expect(desktopBtn).toBeInTheDocument();

    // Toggle viewport modes
    fireEvent.click(mobileBtn);
    expect(screen.getByTestId('live-device-preview').className).toContain('max-w-[375px]');

    fireEvent.click(desktopBtn);
    expect(screen.getByTestId('live-device-preview').className).toContain('max-w-full');
  });
});
