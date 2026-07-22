import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from './coreService';

export class WorkflowService {
  static async fetchLiquidationCycles(supplierId?: string): Promise<any[]> {
    const url = supplierId
      ? `${API_BASE_URL}/liquidation-cycles?supplierId=${supplierId}`
      : `${API_BASE_URL}/liquidation-cycles`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch liquidation cycles: ${res.statusText}`);
    }
    return res.json();
  }

  static async getLiquidationCycleById(cycleId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-cycles/${cycleId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to get liquidation cycle: ${res.statusText}`);
    }
    return res.json();
  }

  static async createLiquidationCycle(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-cycles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create liquidation cycle: ${res.statusText}`);
    }
    return res.json();
  }

  static async updateLiquidationCycle(cycleId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-cycles/${cycleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update liquidation cycle: ${res.statusText}`);
    }
    return res.json();
  }

  static async deleteLiquidationCycle(cycleId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-cycles/${cycleId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete liquidation cycle: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchLiquidationAutomations(supplierId?: string): Promise<any[]> {
    const url = supplierId
      ? `${API_BASE_URL}/liquidation-automations?supplierId=${supplierId}`
      : `${API_BASE_URL}/liquidation-automations`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch liquidation automations: ${res.statusText}`);
    }
    return res.json();
  }

  static async getLiquidationAutomationById(automationId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations/${automationId}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to get liquidation automation: ${res.statusText}`);
    }
    return res.json();
  }

  static async createLiquidationAutomation(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create liquidation automation: ${res.statusText}`);
    }
    return res.json();
  }

  static async updateLiquidationAutomation(automationId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations/${automationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update liquidation automation: ${res.statusText}`);
    }
    return res.json();
  }

  static async deleteLiquidationAutomation(automationId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations/${automationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete liquidation automation: ${res.statusText}`);
    }
    return res.json();
  }

  static async patchLiquidationAutomationStatus(automationId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations/${automationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update campaign status: ${res.statusText}`);
    }
    return res.json();
  }

  static async previewEmailToken(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/liquidation-automations/preview-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to preview email: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchAutomationRuns(supplierId?: string): Promise<any[]> {
    const url = supplierId
      ? `${API_BASE_URL}/automation-runs?supplierId=${supplierId}`
      : `${API_BASE_URL}/automation-runs`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch automation runs: ${res.statusText}`);
    }
    return res.json();
  }

  static async createAutomationRun(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/automation-runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create automation run: ${res.statusText}`);
    }
    return res.json();
  }

  static async forceExpireRun(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/automation-runs/${runId}/force-expire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to force expire run: ${res.statusText}`);
    }
    return res.json();
  }
}

// Thunks
export const fetchLiquidationCyclesThunk = createAsyncThunk(
  'workflow/fetchLiquidationCycles',
  async (supplierId: string | undefined, { rejectWithValue }) => {
    try {
      return await WorkflowService.fetchLiquidationCycles(supplierId);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createLiquidationCycleThunk = createAsyncThunk(
  'workflow/createLiquidationCycle',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await WorkflowService.createLiquidationCycle(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateLiquidationCycleThunk = createAsyncThunk(
  'workflow/updateLiquidationCycle',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await WorkflowService.updateLiquidationCycle(id, payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteLiquidationCycleThunk = createAsyncThunk(
  'workflow/deleteLiquidationCycle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await WorkflowService.deleteLiquidationCycle(id);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchLiquidationAutomationsThunk = createAsyncThunk(
  'workflow/fetchLiquidationAutomations',
  async (supplierId: string | undefined, { rejectWithValue }) => {
    try {
      return await WorkflowService.fetchLiquidationAutomations(supplierId);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createLiquidationAutomationThunk = createAsyncThunk(
  'workflow/createLiquidationAutomation',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await WorkflowService.createLiquidationAutomation(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateLiquidationAutomationThunk = createAsyncThunk(
  'workflow/updateLiquidationAutomation',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await WorkflowService.updateLiquidationAutomation(id, payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteLiquidationAutomationThunk = createAsyncThunk(
  'workflow/deleteLiquidationAutomation',
  async (id: string, { rejectWithValue }) => {
    try {
      return await WorkflowService.deleteLiquidationAutomation(id);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const patchLiquidationAutomationStatusThunk = createAsyncThunk(
  'workflow/patchLiquidationAutomationStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      return await WorkflowService.patchLiquidationAutomationStatus(id, status);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);


export const previewEmailTokenThunk = createAsyncThunk(
  'workflow/previewEmailToken',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await WorkflowService.previewEmailToken(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAutomationRunsThunk = createAsyncThunk(
  'workflow/fetchAutomationRuns',
  async (supplierId: string | undefined, { rejectWithValue }) => {
    try {
      return await WorkflowService.fetchAutomationRuns(supplierId);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createAutomationRunThunk = createAsyncThunk(
  'workflow/createAutomationRun',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await WorkflowService.createAutomationRun(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const forceExpireRunThunk = createAsyncThunk(
  'workflow/forceExpireRun',
  async (runId: string, { rejectWithValue }) => {
    try {
      return await WorkflowService.forceExpireRun(runId);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
