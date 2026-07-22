import { API_BASE_URL } from './coreService';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store',
  'Pragma': 'no-cache',
};

export interface ConfirmAppointmentPayload {
  pickupWindowStart: string;
  pickupWindowEnd: string;
  carrierName?: string;
  carrierDotNumber?: string;
}

export class LogisticsService {
  static async fetchShipments(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/shipments`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch shipments: ${res.statusText}`);
    }
    return res.json();
  }

  static async confirmAppointment(shipmentId: string, payload: ConfirmAppointmentPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/confirm-appointment`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to confirm appointment: ${res.statusText}`);
    }
    return res.json();
  }

  static async updateShipmentStatus(shipmentId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/status`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update shipment status: ${res.statusText}`);
    }
    return res.json();
  }

  static async addTemperatureLog(shipmentId: string, temperature: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/temperature`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ temperature }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to add temperature log: ${res.statusText}`);
    }
    return res.json();
  }
}

export default LogisticsService;
