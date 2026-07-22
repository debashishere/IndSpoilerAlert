import type { Supplier, Buyer } from '../store/slices/coreSlice';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const SIDECAR_BASE_URL = import.meta.env.VITE_SIDECAR_URL || '/sidecar';

export interface HealthStatusResponse {
  backendHealthy: boolean;
  sidecarHealthy: boolean;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store',
  'Pragma': 'no-cache',
};

export async function checkHealth(): Promise<HealthStatusResponse> {
  let backendHealthy = false;
  let sidecarHealthy = false;

  try {
    const backendRes = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: defaultHeaders,
    });
    backendHealthy = backendRes.ok;
  } catch {
    backendHealthy = false;
  }

  try {
    const sidecarRes = await fetch(`${SIDECAR_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: defaultHeaders,
    });
    if (sidecarRes.ok) {
      const data = await sidecarRes.json();
      sidecarHealthy = Boolean(
        data &&
          (data.status === 200 ||
            data.status === 'OK' ||
            data.status === 'SideCar is healthy' ||
            data.status)
      );
    } else {
      sidecarHealthy = false;
    }
  } catch {
    sidecarHealthy = false;
  }

  return { backendHealthy, sidecarHealthy };
}

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { _id: '60c72b2f9b1d8b0015f8e001', name: 'Unilever', companyCode: 'ULVR', preferredDisposition: 'sell', active: true },
  { _id: '60c72b2f9b1d8b0015f8e002', name: 'Danone North America', companyCode: 'DANONE', preferredDisposition: 'sell', active: true },
  { _id: '60c72b2f9b1d8b0015f8e003', name: 'Kraft Heinz', companyCode: 'KRAFT', preferredDisposition: 'sell', active: true },
  { _id: '60c72b2f9b1d8b0015f8e004', name: 'General Mills', companyCode: 'GIS', preferredDisposition: 'sell', active: true },
  { _id: '60c72b2f9b1d8b0015f8e005', name: 'Nestlé USA', companyCode: 'NESTLE', preferredDisposition: 'sell', active: true },
];

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const url = `${API_BASE_URL}/suppliers`;
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: defaultHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
    return DEFAULT_SUPPLIERS;
  } catch (err) {
    console.warn('Failed to fetch suppliers, using default suppliers:', err);
    return DEFAULT_SUPPLIERS;
  }
}

export async function getBuyers(params?: { all?: boolean } | boolean): Promise<Buyer[]> {
  const isAll = typeof params === 'boolean' ? params : params?.all;
  const url = `${API_BASE_URL}/buyers${isAll ? '?all=true' : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: defaultHeaders,
  });

  if (!response.ok && response.status !== 304) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return [];
  }

  return await response.json();
}

export async function fetchAnalyticsSummary(): Promise<any> {
  const url = `${API_BASE_URL}/analytics/summary`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: defaultHeaders,
  });

  if (!response.ok && response.status !== 304) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

export const coreService = {
  API_BASE_URL,
  SIDECAR_BASE_URL,
  checkHealth,
  getSuppliers,
  getBuyers,
  fetchAnalyticsSummary,
};

export default coreService;
