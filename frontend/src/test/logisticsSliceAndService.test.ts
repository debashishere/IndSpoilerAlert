import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import logisticsReducer, {
  fetchShipmentsThunk,
  confirmAppointmentThunk,
  addTemperatureLogThunk,
  updateShipmentStatusThunk,
  setSelectedShipmentId,
  openAppointmentModal,
  closeAppointmentModal,
  setAppointmentForm,
  setNewTemperatureInput
} from '../store/slices/logisticsSlice';
import { LogisticsService } from '../services/logisticsService';

describe('LogisticsService & LogisticsSlice Tracer Bullet', () => {
  let store: ReturnType<typeof configureStore<{ logistics: ReturnType<typeof logisticsReducer> }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        logistics: logisticsReducer,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch shipments with exact headers, confirm dock appointment, update status, and add cold chain temperature log', async () => {
    const mockShipments = [
      {
        _id: 'ship-101',
        status: 'scheduled',
        pickupLocation: 'DC North',
        deliveryLocation: 'Store 44',
        temperature: '34-38°F',
        temperatureLogs: [],
        awardId: {
          awardedQty: 50,
          buyerId: { companyName: 'Fresh Mart' },
          listingId: { opportunityId: { lotId: { productId: { sku: 'SKU-001', description: 'Greek Yogurt' } } } }
        }
      }
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, init?: any) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/shipments') && (!init || init.method === 'GET' || !init.method)) {
        expect(init?.headers).toEqual({
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        });
        return {
          ok: true,
          status: 200,
          json: async () => mockShipments
        } as Response;
      }
      if (urlStr.endsWith('/shipments/ship-101/confirm-appointment') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({
          pickupWindowStart: '2026-07-25T08:00',
          pickupWindowEnd: '2026-07-25T10:00',
          carrierName: 'FastFreight',
          carrierDotNumber: 'DOT-123456'
        });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...mockShipments[0],
            status: 'confirmed',
            pickupWindowStart: body.pickupWindowStart,
            pickupWindowEnd: body.pickupWindowEnd,
            carrierName: body.carrierName,
            carrierDotNumber: body.carrierDotNumber
          })
        } as Response;
      }
      if (urlStr.endsWith('/shipments/ship-101/status') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({ status: 'in_transit' });
        return {
          ok: true,
          status: 200,
          json: async () => ({ ...mockShipments[0], status: 'in_transit' })
        } as Response;
      }
      if (urlStr.endsWith('/shipments/ship-101/temperature') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({ temperature: 35.5 });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...mockShipments[0],
            temperatureLogs: [{ timestamp: new Date().toISOString(), temperature: 35.5 }]
          })
        } as Response;
      }
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found' })
      } as Response;
    });

    // 1. Fetch Shipments
    await store.dispatch(fetchShipmentsThunk() as any);
    let state = store.getState().logistics;
    expect(state.shipments).toHaveLength(1);
    expect(state.shipments[0]._id).toBe('ship-101');
    expect(state.shipments[0].status).toBe('scheduled');

    // Select shipment
    store.dispatch(setSelectedShipmentId('ship-101'));
    state = store.getState().logistics;
    expect(state.selectedShipmentId).toBe('ship-101');

    // Set appointment form and modal
    store.dispatch(openAppointmentModal());
    store.dispatch(setAppointmentForm({
      pickupWindowStart: '2026-07-25T08:00',
      pickupWindowEnd: '2026-07-25T10:00',
      carrierName: 'FastFreight',
      carrierDotNumber: 'DOT-123456'
    }));
    state = store.getState().logistics;
    expect(state.showAppointmentModal).toBe(true);
    expect(state.appointmentForm.carrierName).toBe('FastFreight');

    // 2. Confirm Appointment
    await store.dispatch(confirmAppointmentThunk({
      shipmentId: 'ship-101',
      payload: state.appointmentForm
    }) as any);
    state = store.getState().logistics;
    expect(state.shipments[0].status).toBe('confirmed');
    expect(state.shipments[0].carrierName).toBe('FastFreight');

    // 3. Update Shipment Status to in_transit
    await store.dispatch(updateShipmentStatusThunk({
      shipmentId: 'ship-101',
      status: 'in_transit'
    }) as any);
    state = store.getState().logistics;
    expect(state.shipments[0].status).toBe('in_transit');

    // 4. Add Temperature Log
    store.dispatch(setNewTemperatureInput('35.5'));
    await store.dispatch(addTemperatureLogThunk({
      shipmentId: 'ship-101',
      temperature: parseFloat(store.getState().logistics.newTemperatureInput)
    }) as any);
    state = store.getState().logistics;
    expect(state.shipments[0].temperatureLogs).toHaveLength(1);
    expect(state.shipments[0].temperatureLogs[0].temperature).toBe(35.5);
    expect(fetchSpy).toHaveBeenCalled();
  });
});
