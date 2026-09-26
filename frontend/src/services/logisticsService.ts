import { API_BASE_URL } from './coreService';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ConfirmAppointmentPayload {
  shipmentId?: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  carrierName?: string;
  carrierDotNumber?: string;
  dockDoor?: string;
  notes?: string;
}

export interface ColdChainLogPayload {
  shipmentId?: string;
  lotId?: string;
  temperature: number;
  unit?: string;
  recordedBy?: string;
  complianceStatus?: string;
  fsma204Audit?: {
    verified?: boolean;
    auditTimestamp?: string;
    traceabilityCode?: string;
    inspectorName?: string;
  };
}

export class LogisticsService {
  static async fetchShipments(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/shipments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch shipments: ${res.statusText}`);
    }
    return res.json();
  }

  static async confirmAppointment(shipmentId: string, payload: ConfirmAppointmentPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/confirm-appointment`, {
      method: 'POST',
      headers: getHeaders(),
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
      headers: getHeaders(),
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
      headers: getHeaders(),
      body: JSON.stringify({ temperature }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to add temperature log: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchDockAppointments(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/logistics/dock-appointments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch dock appointments: ${res.statusText}`);
    }
    return res.json();
  }

  static async createDockAppointment(payload: ConfirmAppointmentPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/logistics/dock-appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to schedule dock appointment: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchColdChainLogs(): Promise<{ logs: any[]; metrics: any }> {
    const res = await fetch(`${API_BASE_URL}/logistics/cold-chain`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch cold chain logs: ${res.statusText}`);
    }
    return res.json();
  }

  static async createColdChainLog(payload: ColdChainLogPayload): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/logistics/cold-chain`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to record cold chain log: ${res.statusText}`);
    }
    return res.json();
  }
}

export default LogisticsService;
