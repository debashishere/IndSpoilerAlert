import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer, {
  fetchColdChainLogsThunk,
  createDockAppointmentThunk,
  selectColdChainMetrics,
} from '../store/slices/logisticsSlice';
import { LogisticsService } from '../services/logisticsService';
import { CrossPlatformOperationsPanel } from '../components/domain/insights/CrossPlatformOperationsPanel';
import { InventoryListView } from '../views/InventoryListView';

function createTestStore() {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
    },
  });
}

describe('Cold Chain & Dock Appointment Operations Persistence (Slice 2)', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/logistics/cold-chain')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            logs: [
              {
                _id: 'log-1',
                temperature: 34.2,
                complianceStatus: 'compliant',
                fsma204Audit: { verified: true, traceabilityCode: 'KDE-123' },
              },
            ],
            metrics: {
              tempComplianceSla: '100% SLA',
              fsma204VerifiedCount: 1,
              status: 'Verified',
              dockSla: '< 45 Min',
              logisticsLinkStatus: 'Active',
            },
          }),
        } as Response;
      }
      if (urlStr.includes('/api/logistics/dock-appointments')) {
        return {
          ok: true,
          status: 201,
          json: async () => [
            {
              _id: 'dock-1',
              carrierName: 'Fast Freight',
              status: 'confirmed',
            },
          ],
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('LogisticsService.fetchColdChainLogs calls /api/logistics/cold-chain API endpoint', async () => {
    const result = await LogisticsService.fetchColdChainLogs();
    expect(result.metrics.tempComplianceSla).toBe('100% SLA');
    expect(result.metrics.status).toBe('Verified');
  });

  it('LogisticsService.createDockAppointment calls /api/logistics/dock-appointments API endpoint', async () => {
    const payload = {
      pickupWindowStart: '2026-09-25T10:00:00Z',
      pickupWindowEnd: '2026-09-25T12:00:00Z',
      carrierName: 'Fast Freight',
    };
    const result = await LogisticsService.createDockAppointment(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/logistics/dock-appointments'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('CrossPlatformOperationsPanel binds cold chain metrics and navigates to logistics on click without Coming Soon badge', async () => {
    const store = createTestStore();
    await store.dispatch(fetchColdChainLogsThunk() as any);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Switch to Cross-Platform Operations tab
    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

    // Verify 'Coming Soon' is removed
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();

    // Verify title and metrics are present
    expect(screen.getByText('Cold Chain & Compliance')).toBeInTheDocument();
    expect(screen.getByText('100% SLA')).toBeInTheDocument();

    // Click Cold Chain & Compliance card to navigate to logistics
    fireEvent.click(screen.getByText('Cold Chain & Compliance'));
    expect(store.getState().core.activeTab).toBe('logistics');
  });
});
