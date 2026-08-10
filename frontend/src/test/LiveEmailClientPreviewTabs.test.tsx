import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';
import { LiveDevicePreview } from '../components/LiveDevicePreview';

describe('Live Email Client Preview Tab & Device Viewport Toggles', () => {
  const defaultProps = {
    supplierId: 'supplier-123'
  };

  it('renders tab bar switching between authoring mode and email client preview mode', () => {
    render(<TipTapTemplateEditor {...defaultProps} />);

    const authoringTab = screen.getByTestId('tab-authoring-mode');
    const previewTab = screen.getByTestId('tab-preview-mode');

    expect(authoringTab).toBeInTheDocument();
    expect(previewTab).toBeInTheDocument();
  });

  it('switches to live email preview mode when preview tab is clicked', () => {
    render(<TipTapTemplateEditor {...defaultProps} />);

    const previewTab = screen.getByTestId('tab-preview-mode');
    fireEvent.click(previewTab);

    expect(screen.getByTestId('full-width-live-preview')).toBeInTheDocument();
  });

  it('compiles editor HTML through transformEmailHtml and hydrates tokens in LiveDevicePreview', () => {
    const customHtml = '<h2>Flash Sale for {{buyer_name}}</h2>{{inventory_table}}';
    render(
      <LiveDevicePreview
        subject="Special Deal: {{lot_title}}"
        bodyHtml={customHtml}
        context={{
          buyer_name: 'Acme Supermarkets',
          lot_title: 'Surplus Organic Apples'
        }}
      />
    );

    const compiledContent = screen.getByTestId('compiled-email-content');
    expect(compiledContent.innerHTML).toContain('Acme Supermarkets');
    expect(compiledContent.innerHTML).toContain('<table');
  });

  it('toggles viewport container width between Desktop (600px) and Mobile (375px)', () => {
    render(
      <LiveDevicePreview
        subject="Viewport Test"
        bodyHtml="<p>Responsive email content</p>"
      />
    );

    const desktopBtn = screen.getByTestId('device-toggle-desktop');
    const mobileBtn = screen.getByTestId('device-toggle-mobile');
    const previewFrame = screen.getByTestId('live-device-preview');

    fireEvent.click(mobileBtn);
    expect(previewFrame.className).toContain('max-w-[375px]');

    fireEvent.click(desktopBtn);
    expect(previewFrame.className).toContain('max-w-[600px]');
  });
});
