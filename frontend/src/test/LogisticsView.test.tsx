import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import logisticsReducer, {
  fetchShipmentsThunk,
  setSelectedShipmentId,
  openAppointmentModal,
  setAppointmentForm,
  setNewTemperatureInput
} from '../store/slices/logisticsSlice';
import LogisticsView from '../views/LogisticsView';

describe('LogisticsView Vertical Slice Integration', () => {
  let store: ReturnType<typeof configureStore<{ logistics: ReturnType<typeof logisticsReducer> }>>;

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    store = configureStore({
      reducer: {
        logistics: logisticsReducer,
      },
      preloadedState: {
        logistics: {
          shipments: [
            {
              _id: 'ship-201',
              status: 'scheduled',
              pickupLocation: 'DC West Warehouse',
              deliveryLocation: 'Store 12 Boston',
              temperature: '34-38°F',
              bolNumber: 'BOL-9900',
              temperatureLogs: [],
              awardId: {
                awardedQty: 120,
                buyerId: { companyName: 'Mega Retailer' },
                listingId: { opportunityId: { lotId: { productId: { sku: 'SKU-DAIRY-10', description: 'Organic Milk Case' } } } }
              }
            }
          ],
          loading: false,
          hasFetched: true,
          error: null,
          selectedShipmentId: null,
          showAppointmentModal: false,
          appointmentForm: {
            pickupWindowStart: '',
            pickupWindowEnd: '',
            carrierName: '',
            carrierDotNumber: ''
          },
          newTemperatureInput: ''
        }
      }
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render LogisticsView, display ShipmentTable, select a shipment, confirm dock appointment, and log temperature', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, init?: any) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/shipments') && (!init || init.method === 'GET' || !init.method)) {
        return {
          ok: true,
          status: 200,
          json: async () => store.getState().logistics.shipments
        } as Response;
      }
      if (urlStr.endsWith('/shipments/ship-201/confirm-appointment') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...store.getState().logistics.shipments[0],
            status: 'confirmed',
            pickupWindowStart: body.pickupWindowStart,
            pickupWindowEnd: body.pickupWindowEnd,
            carrierName: body.carrierName,
            carrierDotNumber: body.carrierDotNumber
          })
        } as Response;
      }
      if (urlStr.endsWith('/shipments/ship-201/temperature') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...store.getState().logistics.shipments[0],
            temperatureLogs: [{ timestamp: '2026-07-22T14:10:00Z', temperature: body.temperature }]
          })
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(
      <Provider store={store}>
        <LogisticsView />
      </Provider>
    );

    // Header & Table check
    expect(screen.getByText('Freight Logistics & Dock Coordination')).toBeInTheDocument();
    expect(screen.getByText('Active Dispatches (1)')).toBeInTheDocument();
    expect(screen.getByText('Mega Retailer')).toBeInTheDocument();
    expect(screen.getByText('BOL ID: BOL-9900')).toBeInTheDocument();

    // Select the shipment
    fireEvent.click(screen.getByText('Mega Retailer'));
    expect(store.getState().logistics.selectedShipmentId).toBe('ship-201');

    // Details panel check
    expect(screen.getByText('Shipment Details')).toBeInTheDocument();
    expect(screen.getByText('Shipment Mongo ID: ship-201')).toBeInTheDocument();
    expect(screen.getByText('Logistics Timeline')).toBeInTheDocument();
    expect(screen.getByText('Confirm Dock Pickup Appointment')).toBeInTheDocument();

    // Fill date inputs & carrier info
    const startInput = screen.getByPlaceholderText('Pickup Window Start');
    const endInput = screen.getByPlaceholderText('Pickup Window End');
    const carrierInput = screen.getByPlaceholderText('e.g. Fast Freight Inc.');
    const dotInput = screen.getByPlaceholderText('e.g. DOT-999888');

    fireEvent.change(startInput, { target: { value: '2026-07-25T08:00' } });
    fireEvent.change(endInput, { target: { value: '2026-07-25T10:00' } });
    fireEvent.change(carrierInput, { target: { value: 'ColdExpress Express' } });
    fireEvent.change(dotInput, { target: { value: 'DOT-888777' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Dock Appointment/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/shipments/ship-201/confirm-appointment'),
        expect.any(Object)
      );
    });

    // Test ColdChainLogger
    const tempInput = screen.getByPlaceholderText('Log Temperature (°F)');
    const logBtn = screen.getByRole('button', { name: /Log Temp/i });

    fireEvent.change(tempInput, { target: { value: '36.2' } });
    fireEvent.click(logBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/shipments/ship-201/temperature'),
        expect.any(Object)
      );
    });
  });
});
