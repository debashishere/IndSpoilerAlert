import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import zapierSyncReducer from '../store/slices/zapierSyncSlice';
import { ZapierIntegrationView } from '../components/domain/ingestion/subcomponents/ZapierIntegrationView';
import zapierSyncService from '../services/zapierSyncService';

vi.mock('../services/zapierSyncService', () => {
  const mockService = {
    fetchRoster: vi.fn().mockResolvedValue({
      success: true,
      supplierId: 'supplier-999',
      ingressKey: 'zap_sec_live_key_999',
      connectedZaps: [
        {
          zapId: 'zap-pos-01',
          zapName: 'Clover POS Inbound Sync',
          triggerEvent: 'order_completed',
          status: 'active',
          lotCount: 320,
          lastSyncedAt: '2026-10-02T16:00:00.000Z',
        },
        {
          zapId: 'zap-csv-02',
          zapName: 'Warehouse FTP Webhook',
          triggerEvent: 'catch_hook',
          status: 'paused',
          lotCount: 150,
          lastSyncedAt: '2026-10-01T10:00:00.000Z',
        },
      ],
      deliveryLogs: [],
      totalZaps: 2,
    }),
    testPing: vi.fn().mockResolvedValue({
      success: true,
      status: 'connected',
      supplierName: 'Veritas Organic Hub',
      latencyMs: 38,
      message: 'Connection verified. Ready for Zapier sync.',
    }),
    disconnectFeed: vi.fn().mockResolvedValue({
      success: true,
      message: 'Zap disconnected successfully.',
      remainingZaps: 1,
    }),
    saveMapping: vi.fn().mockResolvedValue({
      success: true,
      supplierTemplateId: 'tmpl-zap-101',
      message: 'Mapping saved.',
    }),
  };

  return {
    default: mockService,
    zapierSyncService: mockService,
  };
});

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
      zapierSync: zapierSyncReducer,
    },
    preloadedState,
  });
};

describe('ZapierIntegrationView Component Seam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quadrant 1: Header & Health Telemetry', () => {
    it('renders header, idle status pill, and aggregates metric counts', async () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          webhookUrl: 'http://localhost:5000/api/v1/ingestion/zapier/webhook',
          connectedZaps: [
            {
              zapId: 'zap-1',
              zapName: 'Shopify Webhook',
              triggerEvent: 'catch_hook',
              status: 'active',
              lotCount: 200,
              lastSyncedAt: '2026-10-02T14:00:00.000Z',
            },
            {
              zapId: 'zap-2',
              zapName: 'ERP Ingress',
              triggerEvent: 'new_lot',
              status: 'active',
              lotCount: 150,
              lastSyncedAt: '2026-10-02T15:30:00.000Z',
            },
          ],
          deliveryLogs: [],
          totalZaps: 2,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" supplierName="Veritas Organic Hub" />
        </Provider>
      );

      // Verify Quadrant 1 exists
      const quadrant1 = screen.getByTestId('zapier-quadrant-1-telemetry');
      expect(quadrant1).toBeInTheDocument();
      expect(within(quadrant1).getByText('Zapier Ingestion Suite')).toBeInTheDocument();
      expect(within(quadrant1).getByText(/Veritas Organic Hub/i)).toBeInTheDocument();

      // Idle status pill
      expect(within(quadrant1).getByText('Idle')).toBeInTheDocument();

      // Aggregated lot count: 200 + 150 = 350
      expect(within(quadrant1).getByText('350')).toBeInTheDocument();
      // Active zaps count: 2
      expect(within(quadrant1).getByText('2')).toBeInTheDocument();
    });

    it('triggers test ping and updates latency display and active status', async () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          webhookUrl: 'http://localhost:5000/api/v1/ingestion/zapier/webhook',
          connectedZaps: [],
          deliveryLogs: [],
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'idle',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" supplierName="Veritas Organic Hub" />
        </Provider>
      );

      const pingButton = screen.getByRole('button', { name: /test ping/i });
      fireEvent.click(pingButton);

      expect(zapierSyncService.testPing).toHaveBeenCalledWith(
        expect.objectContaining({
          ingressKey: 'zap_sec_live_key_999',
        })
      );

      // Wait for ping to resolve
      expect(await screen.findByText('38 ms')).toBeInTheDocument();
      expect(screen.getByText('Active Trigger')).toBeInTheDocument();
    });
  });

  describe('Quadrant 2: Credentials & Catch Hook Setup Guide', () => {
    it('renders Webhook URL, Master Ingress Key, and copies to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          webhookUrl: 'http://localhost:5000/api/v1/ingestion/zapier/webhook',
          connectedZaps: [],
          deliveryLogs: [],
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const quadrant2 = screen.getByTestId('zapier-quadrant-2-credentials');
      expect(quadrant2).toBeInTheDocument();

      // Displays ingress key & webhook URL
      expect(within(quadrant2).getByText('zap_sec_live_key_999')).toBeInTheDocument();
      expect(
        within(quadrant2).getByText('http://localhost:5000/api/v1/ingestion/zapier/webhook')
      ).toBeInTheDocument();

      // Copy key action
      const copyKeyBtn = within(quadrant2).getByRole('button', { name: /copy key/i });
      fireEvent.click(copyKeyBtn);

      expect(writeTextMock).toHaveBeenCalledWith('zap_sec_live_key_999');
      expect(await within(quadrant2).findByText('Copied')).toBeInTheDocument();
    });

    it('expands Zapier Catch Hook setup guide and copies sample JSON payload', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const store = createTestStore();

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const quadrant2 = screen.getByTestId('zapier-quadrant-2-credentials');
      const expandBtn = within(quadrant2).getByRole('button', {
        name: /view zapier catch hook setup guide/i,
      });

      // Guide is initially collapsed
      expect(screen.queryByText(/choose app: webhooks by zapier/i)).not.toBeInTheDocument();

      // Expand guide
      fireEvent.click(expandBtn);

      expect(screen.getByText('Webhooks by Zapier')).toBeInTheDocument();
      expect(screen.getAllByText(/x-ingress-key/i).length).toBeGreaterThanOrEqual(2);

      // Copy sample payload button
      const copyPayloadBtn = within(quadrant2).getByRole('button', {
        name: /copy sample payload/i,
      });
      fireEvent.click(copyPayloadBtn);

      expect(writeTextMock).toHaveBeenCalled();
      expect(await within(quadrant2).findByText('Copied!')).toBeInTheDocument();
    });
  });

  describe('Quadrant 3: Connected Zaps Roster', () => {
    it('renders empty state when no zaps are connected', () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          webhookUrl: null,
          connectedZaps: [],
          deliveryLogs: [],
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const quadrant3 = screen.getByTestId('zapier-quadrant-3-roster');
      expect(quadrant3).toBeInTheDocument();
      expect(within(quadrant3).getByText('No Connected Zaps Yet')).toBeInTheDocument();
      expect(
        within(quadrant3).getByText(/configure a zapier catch hook webhook pointing to the url above/i)
      ).toBeInTheDocument();
    });

    it('renders registered zaps and handles disconnect confirmation modal', async () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          webhookUrl: null,
          connectedZaps: [
            {
              zapId: 'zap-pos-01',
              zapName: 'Clover POS Inbound Sync',
              triggerEvent: 'order_completed',
              status: 'active',
              lotCount: 320,
              lastSyncedAt: '2026-10-02T16:00:00.000Z',
            },
          ],
          deliveryLogs: [],
          totalZaps: 1,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const quadrant3 = screen.getByTestId('zapier-quadrant-3-roster');
      expect(within(quadrant3).getByText('Clover POS Inbound Sync')).toBeInTheDocument();
      expect(within(quadrant3).getByText('zap-pos-01')).toBeInTheDocument();
      expect(within(quadrant3).getByText('order_completed')).toBeInTheDocument();
      expect(within(quadrant3).getByText('320')).toBeInTheDocument();

      // Click Disconnect button
      const disconnectBtn = within(quadrant3).getByRole('button', { name: /disconnect zap/i });
      fireEvent.click(disconnectBtn);

      // Confirmation Modal should appear
      const modal = screen.getByRole('dialog', { name: /disconnect zap feed/i });
      expect(modal).toBeInTheDocument();
      expect(
        within(modal).getByText(/are you sure you want to disconnect/i)
      ).toBeInTheDocument();
      expect(
        within(modal).getByText('Clover POS Inbound Sync')
      ).toBeInTheDocument();

      // Confirm Disconnect
      const confirmBtn = within(modal).getByRole('button', { name: /confirm disconnect/i });
      fireEvent.click(confirmBtn);

      expect(zapierSyncService.disconnectFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          zapId: 'zap-pos-01',
          supplierId: 'supplier-999',
        })
      );
    });
  });

  describe('Recent Payload Ingress Log Seam', () => {
    it('renders empty state when no delivery logs exist', async () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: [],
          deliveryLogs: [],
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const logSection = screen.getByTestId('zapier-recent-payload-log');
      expect(logSection).toBeInTheDocument();
      expect(within(logSection).getByText(/Recent Payload Ingress Log/i)).toBeInTheDocument();
      expect(
        within(logSection).getByText(/No Webhook Deliveries Recorded Yet/i)
      ).toBeInTheDocument();
    });

    it('renders delivery logs table and toggles expandable raw payload inspector', async () => {
      const mockDeliveryLogs = [
        {
          timestamp: '2026-10-02T19:30:00.000Z',
          httpStatus: 200,
          latencyMs: 45,
          message: 'Zapier batch processed successfully',
          status: 'success',
          samplePayload: {
            zapId: 'zap-pos-01',
            lots: [{ sku: 'APP-101', quantity: 50 }],
          },
        },
        {
          timestamp: '2026-10-02T18:15:00.000Z',
          httpStatus: 422,
          latencyMs: 12,
          message: 'Missing required field: sku',
          status: 'error',
          samplePayload: {
            zapId: 'zap-pos-01',
            lots: [{ quantity: 10 }],
          },
        },
      ];

      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: [],
          deliveryLogs: mockDeliveryLogs,
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const logSection = screen.getByTestId('zapier-recent-payload-log');
      expect(within(logSection).getByText('200 OK')).toBeInTheDocument();
      expect(within(logSection).getByText('422 ERR')).toBeInTheDocument();
      expect(within(logSection).getByText('45 ms')).toBeInTheDocument();
      expect(within(logSection).getByText('Zapier batch processed successfully')).toBeInTheDocument();
      expect(within(logSection).getByText('Missing required field: sku')).toBeInTheDocument();

      // Raw payload shouldn't be visible before expanding
      expect(screen.queryByText(/"APP-101"/i)).not.toBeInTheDocument();

      // Find expand button for the first delivery log and click it
      const expandButtons = within(logSection).getAllByRole('button', { name: /view payload/i });
      fireEvent.click(expandButtons[0]);

      // Raw payload preview is now visible
      expect(screen.getByText(/"APP-101"/i)).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(expandButtons[0]);
      expect(screen.queryByText(/"APP-101"/i)).not.toBeInTheDocument();
    });
  });

  describe('Quadrant 4: In-Situ Schema Field Mapper Seam', () => {
    it('renders initial empty state prompt when no zap feed is selected for mapping', async () => {
      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: [],
          deliveryLogs: [],
          totalZaps: 0,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const mapperSection = screen.getByTestId('zapier-quadrant-4-mapper');
      expect(mapperSection).toBeInTheDocument();
      expect(
        within(mapperSection).getByText(/In-Situ Schema Field Mapper/i)
      ).toBeInTheDocument();
      expect(
        within(mapperSection).getByText(/Select a Connected Zap to Configure Mapping/i)
      ).toBeInTheDocument();
    });

    it('opens GridMapperTable when Edit Mapping is clicked on a connected zap and closes on Close Mapper', async () => {
      const mockZaps = [
        {
          zapId: 'zap-pos-01',
          zapName: 'Clover POS Inbound Sync',
          triggerEvent: 'order_completed',
          status: 'active',
          lotCount: 320,
          lastSyncedAt: '2026-10-02T16:00:00.000Z',
        },
      ];

      const mockDeliveryLogs = [
        {
          timestamp: '2026-10-02T16:00:00.000Z',
          httpStatus: 200,
          latencyMs: 45,
          message: 'Success',
          status: 'success',
          samplePayload: {
            zapId: 'zap-pos-01',
            lots: [
              {
                sku: 'HONEY-APP-01',
                description: 'Honeycrisp Apples',
                quantity: 40,
                price: 25.0,
              },
            ],
          },
        },
      ];

      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: mockZaps,
          deliveryLogs: mockDeliveryLogs,
          totalZaps: 1,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      const rosterSection = screen.getByTestId('zapier-quadrant-3-roster');
      const editMappingBtn = within(rosterSection).getByRole('button', {
        name: /edit mapping/i,
      });
      expect(editMappingBtn).toBeInTheDocument();

      // Click Edit Mapping
      fireEvent.click(editMappingBtn);

      const mapperSection = screen.getByTestId('zapier-quadrant-4-mapper');
      // Active zap badge and title should be visible
      expect(
        within(mapperSection).getAllByText('Clover POS Inbound Sync').length
      ).toBeGreaterThanOrEqual(1);
      expect(
        within(mapperSection).getAllByRole('button', { name: /close mapper/i }).length
      ).toBeGreaterThanOrEqual(1);

      // GridMapperTable save button should be rendered
      expect(
        within(mapperSection).getByRole('button', { name: /save zapier mapping/i })
      ).toBeInTheDocument();

      // Click Close Mapper
      const closeBtn = within(mapperSection).getAllByRole('button', { name: /close mapper/i })[0];
      fireEvent.click(closeBtn);

      // Returns to empty prompt
      expect(
        within(mapperSection).getByText(/Select a Connected Zap to Configure Mapping/i)
      ).toBeInTheDocument();
    });

    it('saves zapier column mapping and refreshes roster upon clicking Save Zapier Mapping', async () => {
      const mockZaps = [
        {
          zapId: 'zap-pos-01',
          zapName: 'Clover POS Inbound Sync',
          triggerEvent: 'order_completed',
          status: 'active',
          lotCount: 320,
          lastSyncedAt: '2026-10-02T16:00:00.000Z',
        },
      ];

      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: mockZaps,
          deliveryLogs: [],
          totalZaps: 1,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      // Open mapping for zap-pos-01
      const rosterSection = screen.getByTestId('zapier-quadrant-3-roster');
      const editMappingBtn = within(rosterSection).getByRole('button', {
        name: /edit mapping/i,
      });
      fireEvent.click(editMappingBtn);

      const mapperSection = screen.getByTestId('zapier-quadrant-4-mapper');
      const saveBtn = within(mapperSection).getByRole('button', {
        name: /save zapier mapping/i,
      });

      // Click Save Zapier Mapping
      fireEvent.click(saveBtn);

      expect(zapierSyncService.saveMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'supplier-999',
          zapId: 'zap-pos-01',
          zapName: 'Clover POS Inbound Sync',
        })
      );
    });

    it('surfaces error feedback banner when save mapping fails', async () => {
      vi.mocked(zapierSyncService.saveMapping).mockRejectedValueOnce(
        new Error('Network error during mapping persistence')
      );

      const mockZaps = [
        {
          zapId: 'zap-err-01',
          zapName: 'Failing Zap Stream',
          triggerEvent: 'order_completed',
          status: 'active',
          lotCount: 10,
        },
      ];

      const store = createTestStore({
        zapierSync: {
          supplierId: 'supplier-999',
          ingressKey: 'zap_sec_live_key_999',
          connectedZaps: mockZaps,
          deliveryLogs: [],
          totalZaps: 1,
          pingStatus: 'idle',
          pingLatencyMs: null,
          status: 'succeeded',
          error: null,
          disconnectStatus: 'idle',
        },
      });

      render(
        <Provider store={store}>
          <ZapierIntegrationView supplierId="supplier-999" />
        </Provider>
      );

      // Open mapping for failing zap
      const rosterSection = screen.getByTestId('zapier-quadrant-3-roster');
      const editMappingBtn = within(rosterSection).getByRole('button', {
        name: /edit mapping/i,
      });
      fireEvent.click(editMappingBtn);

      const mapperSection = screen.getByTestId('zapier-quadrant-4-mapper');
      const saveBtn = within(mapperSection).getByRole('button', {
        name: /save zapier mapping/i,
      });

      // Click Save Zapier Mapping
      fireEvent.click(saveBtn);

      await vi.waitFor(() => {
        expect(
          within(mapperSection).getByText('Network error during mapping persistence')
        ).toBeInTheDocument();
      });
    });
  });
});

