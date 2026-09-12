import { API_BASE_URL } from './networkService';
import { firebaseAuthService } from './firebaseAuthService';

export interface DealProduct {
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
}

export interface DealLot {
  _id: string;
  lotNumber: string;
  quantityCases?: number;
  availableQty?: number;
}

export interface DealBuyer {
  _id: string;
  companyName: string;
  email: string;
}

export interface ExecutionAuditData {
  signerName: string;
  signerTitle: string;
  signatureType: 'draw' | 'type';
  signatureData: string;
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  verificationHash?: string;
}

export interface SignDealPayload {
  signerName: string;
  signerTitle: string;
  authorized: boolean;
  signatureType: 'draw' | 'type';
  signatureData: string;
}

export interface DealData {
  _id: string;
  awardedQty: number;
  price: number;
  totalAmount: number;
  pickupLocation: string;
  pickupHours: string;
  paymentStatus: 'pending' | 'confirmed';
  signatureStatus: 'pending' | 'executed';
  executionAudit?: ExecutionAuditData;
  approvedDate?: string;
  product?: DealProduct;
  lot?: DealLot;
  buyer?: DealBuyer;
}

export const dealService = {
  async getDeal(dealId: string, token?: string | null): Promise<DealData> {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `${API_BASE_URL}/deals/${dealId}${query}`;

    const authToken = await firebaseAuthService.getCurrentIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.deal;
  },

  async confirmPayment(dealId: string, token?: string | null): Promise<DealData> {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `${API_BASE_URL}/deals/${dealId}/confirm-payment${query}`;

    const authToken = await firebaseAuthService.getCurrentIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.deal;
  },

  async signDeal(dealId: string, payload: SignDealPayload, token?: string | null): Promise<DealData> {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `${API_BASE_URL}/deals/${dealId}/sign${query}`;

    const authToken = await firebaseAuthService.getCurrentIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.deal;
  }
};
