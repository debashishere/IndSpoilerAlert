import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

const mockInventoryLots = [
  {
    _id: 'lot-101',
    lotNumber: 'LOT-101',
    availableQty: 250,
    quantityCases: 250,
    remainingShelfLife: 0.1,
    productId: { sku: 'PROD-101', description: 'Fresh Produce', category: 'Produce' }
  }
];

describe('Pre-Flight Automation Launch Audit Modal Closing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  it('closes the modal and triggers onSuccess callback when launching a workflow succeeds', async () => {
    const onSuccess = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/trigger')) {
        return new Response(JSON.stringify({ _id: 'run-1', status: 'evaluating' }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: 'camp-555', status: 'active' }), { status: 200 });
    }));

    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={[{ id: 'b1', name: 'Buyer One', tier: 'tier1' }]}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    const launchBtns = await screen.findAllByRole('button', { name: /Launch Active Campaign/i });
    await waitFor(() => expect(launchBtns[0]).not.toBeDisabled());

    fireEvent.click(launchBtns[0]);

    // Modal opens
    expect(screen.getByText('Pre-Flight Automation Launch Audit')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Launch/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('launched');
    });

    // Modal is closed
    expect(screen.queryByText('Pre-Flight Automation Launch Audit')).not.toBeInTheDocument();
  });

  it('closes the modal and resets submitting state if launch fails with an error', async () => {
    const onSuccess = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations')) {
        return new Response(JSON.stringify({ error: 'A saved workflow with this name already exists' }), { status: 400 });
      }
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    }));

    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={[{ id: 'b1', name: 'Buyer One', tier: 'tier1' }]}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    const launchBtns = await screen.findAllByRole('button', { name: /Launch Active Campaign/i });
    await waitFor(() => expect(launchBtns[0]).not.toBeDisabled());

    fireEvent.click(launchBtns[0]);

    expect(screen.getByText('Pre-Flight Automation Launch Audit')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Launch/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('A saved workflow with this name already exists'));
    });

    // Modal must close after error handling instead of being stuck
    expect(screen.queryByText('Pre-Flight Automation Launch Audit')).not.toBeInTheDocument();
  });
});
