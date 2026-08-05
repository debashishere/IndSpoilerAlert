import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveDevicePreview, compileClientPreview } from '../components/LiveDevicePreview';

describe('Slice 2: Handlebars Token Compiler & Live Device Preview Pane', () => {
  const sampleSubject = 'Flash clearance offer for {{buyer_name}}';
  const sampleBodyHtml = `
    <div style="color: #333;">
      <h2>Offer from {{supplier_name}}</h2>
      <p>Dear {{buyer_name}},</p>
      <p>We have surplus inventory available: {{lot_title}}</p>
      {{inventory_table}}
      <p><a href="{{quick_bid_link}}">Submit 1-Click Bid</a></p>
    </div>
  `;

  it('compiles tokens cleanly for preview rendering', () => {
    const { compiledSubject, compiledBody } = compileClientPreview(sampleSubject, sampleBodyHtml, {
      buyer_name: 'Metro Hypermarket',
      supplier_name: 'Unilever Logistics',
      lot_title: 'Surplus Dairy Lot #99'
    });

    expect(compiledSubject).toBe('Flash clearance offer for Metro Hypermarket');
    expect(compiledBody).toContain('Offer from Unilever Logistics');
    expect(compiledBody).toContain('Dear Metro Hypermarket');
    expect(compiledBody).toContain('Surplus Dairy Lot #99');
    expect(compiledBody).toContain('<table');
    expect(compiledBody).toContain('SKU-9901');
    expect(compiledBody).toContain('https://indspoileralert.com/bid?token=demo-token-123');
  });

  it('renders LiveDevicePreview component with Desktop and Mobile toggle', () => {
    render(
      <LiveDevicePreview
        subject={sampleSubject}
        bodyHtml={sampleBodyHtml}
        context={{ buyer_name: 'Apex Retail', supplier_name: 'Kraft Heinz' }}
        initialDeviceView="desktop"
      />
    );

    // Verify main components are present
    expect(screen.getByText(/Live Device Viewport Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Juice Inlined/i)).toBeInTheDocument();

    const frameContainer = screen.getByTestId('live-device-preview');
    expect(frameContainer).toHaveClass('max-w-full');

    // Click Mobile toggle button
    const mobileBtn = screen.getByTestId('device-toggle-mobile');
    fireEvent.click(mobileBtn);

    expect(frameContainer).toHaveClass('max-w-[375px]');

    // Click Desktop toggle button
    const desktopBtn = screen.getByTestId('device-toggle-desktop');
    fireEvent.click(desktopBtn);

    expect(frameContainer).toHaveClass('max-w-full');
  });

  it('renders resolved recipient headers in fake email client header', () => {
    render(
      <LiveDevicePreview
        subject="Liquidation Alert for {{buyer_name}}"
        bodyHtml="<p>Check {{inventory_table}}</p>"
        context={{ buyer_name: 'Costco Wholesale', supplier_name: 'Nestle US' }}
      />
    );

    expect(screen.getByText(/Nestle US/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Costco Wholesale/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Liquidation Alert for Costco Wholesale/i)).toBeInTheDocument();
  });
});
