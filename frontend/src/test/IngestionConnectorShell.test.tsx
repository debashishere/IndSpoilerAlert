import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngestionConnectorShell } from '../components/domain/ingestion/subcomponents/IngestionConnectorShell';

describe('IngestionConnectorShell Component Seam', () => {
  it('renders single-arrow return button without duplicate glyphs and calls onBack when clicked', () => {
    const handleBack = vi.fn();
    const handleSelectConnector = vi.fn();

    render(
      <IngestionConnectorShell
        activeConnector="google-sheets"
        onSelectConnector={handleSelectConnector}
        onBack={handleBack}
      >
        <div data-testid="test-content">Google Sheets Content</div>
      </IngestionConnectorShell>
    );

    const backButton = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton.textContent?.trim()).toBe('Back to Ingestion Pipeline');
    expect(backButton.textContent).not.toContain('←');

    const svgIcons = backButton.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(1);
    expect(svgIcons[0]).toHaveClass('w-4', 'h-4');

    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders institutional header and 3 cross-connector switcher tabs with active state', () => {
    const handleBack = vi.fn();
    const handleSelectConnector = vi.fn();

    render(
      <IngestionConnectorShell
        activeConnector="google-sheets"
        onSelectConnector={handleSelectConnector}
        onBack={handleBack}
      >
        <div data-testid="test-content">Sheets Workspace</div>
      </IngestionConnectorShell>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Integration Management Suite/i })).toBeDefined();

    const sheetsTab = screen.getByRole('tab', { name: /Google Sheets Sync/i });
    const zapierTab = screen.getByRole('tab', { name: /Zapier Webhooks/i });
    const scannerTab = screen.getByRole('tab', { name: /Image & Doc Scanner/i });

    expect(sheetsTab).toBeDefined();
    expect(zapierTab).toBeDefined();
    expect(scannerTab).toBeDefined();

    expect(sheetsTab.getAttribute('aria-selected')).toBe('true');
    expect(zapierTab.getAttribute('aria-selected')).toBe('false');

    // Click Zapier tab
    fireEvent.click(zapierTab);
    expect(handleSelectConnector).toHaveBeenCalledWith('zapier');

    // Click Scanner tab
    fireEvent.click(scannerTab);
    expect(handleSelectConnector).toHaveBeenCalledWith('doc-scanner');
  });

  it('renders children content within the full-page container', () => {
    render(
      <IngestionConnectorShell
        activeConnector="zapier"
        onSelectConnector={vi.fn()}
        onBack={vi.fn()}
      >
        <div data-testid="zapier-workspace">Zapier Content</div>
      </IngestionConnectorShell>
    );

    expect(screen.getByTestId('zapier-workspace')).toBeDefined();
    expect(screen.getByText('Zapier Content')).toBeDefined();
  });

  it('renders 4th tab for CSV / Excel Upload with icon upload_file and handles selection', () => {
    const handleBack = vi.fn();
    const handleSelectConnector = vi.fn();

    render(
      <IngestionConnectorShell
        activeConnector="csv-upload"
        onSelectConnector={handleSelectConnector}
        onBack={handleBack}
      >
        <div data-testid="csv-workspace">CSV Workspace</div>
      </IngestionConnectorShell>
    );

    const csvTab = screen.getByRole('tab', { name: /CSV \/ Excel Upload/i });
    expect(csvTab).toBeDefined();
    expect(csvTab.getAttribute('aria-selected')).toBe('true');
    expect(csvTab.textContent).toContain('upload_file');
    expect(csvTab.textContent).toContain('CSV / Excel Upload');

    fireEvent.click(csvTab);
    expect(handleSelectConnector).toHaveBeenCalledWith('csv-upload');
  });
});

