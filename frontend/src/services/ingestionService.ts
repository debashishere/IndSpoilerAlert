import { API_BASE_URL } from './coreService';
import type { IngestionParsedResult, SemanticRule } from '../store/slices/ingestionSlice';

const COMMON_HEADERS = {
  'Cache-Control': 'no-cache, no-store',
  'Pragma': 'no-cache',
};

const JSON_HEADERS = {
  ...COMMON_HEADERS,
  'Content-Type': 'application/json',
};

export const ingestionService = {
  async uploadInventoryFile(
    file: File,
    supplierId: string,
    onProgressStep?: (step: string) => void
  ): Promise<IngestionParsedResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierId', supplierId);

    if (onProgressStep) {
      onProgressStep('Uploading file to backend...');
    }

    const response = await fetch(`${API_BASE_URL}/ingest/upload`, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Failed to parse file.');
    }

    if (response.status === 202) {
      const acceptData = await response.json();
      const jobId = acceptData.ingestionJobId;

      if (onProgressStep) {
        onProgressStep('Queued for processing. Polling job status...');
      }

      let finished = false;
      let attempts = 0;
      let jobResult: any = null;

      while (!finished && attempts < 60) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;

        const pollResponse = await fetch(`${API_BASE_URL}/ingest/jobs/${jobId}`, {
          method: 'GET',
          headers: COMMON_HEADERS,
        });

        if (!pollResponse.ok) {
          throw new Error('Failed to query ingestion job status.');
        }

        const job = await pollResponse.json();
        if (job.status === 'parsing') {
          if (onProgressStep) {
            onProgressStep('Python Sidecar worker is actively parsing table structures...');
          }
        } else if (job.status === 'parsed') {
          finished = true;
          jobResult = job;
        } else if (job.status === 'error') {
          throw new Error(job.errorMessage || 'Worker failed to parse file.');
        }
      }

      if (!finished) {
        throw new Error('Ingestion job timed out.');
      }

      return {
        ...jobResult,
        documentId: jobResult.documentId || jobResult._id || jobId,
      };
    } else {
      if (onProgressStep) {
        onProgressStep('Cleaning raw results and guessing header mapping templates...');
      }
      const result = await response.json();
      return {
        ...result,
        documentId: result.documentId || result._id || result.ingestionJobId,
      };
    }
  },

  async confirmInventoryIngestion(payload: {
    documentId: string;
    supplierId: string;
    mappings: Record<string, string>;
    saveTemplate: boolean;
    templateName?: string;
    semanticRules?: SemanticRule[];
  }): Promise<{ countImported: number; importedLotIds: string[]; [key: string]: any }> {
    const response = await fetch(`${API_BASE_URL}/ingest/confirm`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to confirm ingestion and import lots.');
    }

    return await response.json();
  },

  async uploadSalesFile(
    file: File,
    supplierId: string,
    onProgressStep?: (step: string) => void
  ): Promise<IngestionParsedResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierId', supplierId);

    if (onProgressStep) {
      onProgressStep('Uploading sales report...');
    }

    const response = await fetch(`${API_BASE_URL}/ingest/upload`, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || 'Upload failed');
    }

    // Handle 202 Accepted: backend queued the file for async processing
    if (response.status === 202) {
      const acceptData = await response.json();
      const jobId = acceptData.ingestionJobId;

      if (onProgressStep) {
        onProgressStep('Queued for processing. Polling job status...');
      }

      let finished = false;
      let attempts = 0;
      let jobResult: any = null;

      while (!finished && attempts < 60) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;

        const pollResponse = await fetch(`${API_BASE_URL}/ingest/jobs/${jobId}`, {
          method: 'GET',
          headers: COMMON_HEADERS,
        });

        if (!pollResponse.ok) {
          throw new Error('Failed to query ingestion job status.');
        }

        const job = await pollResponse.json();
        if (job.status === 'parsing') {
          if (onProgressStep) {
            onProgressStep('Python Sidecar worker is actively parsing table structures...');
          }
        } else if (job.status === 'parsed') {
          finished = true;
          jobResult = job;
        } else if (job.status === 'error') {
          throw new Error(job.errorMessage || 'Worker failed to parse sales file.');
        }
      }

      if (!finished) {
        throw new Error('Sales ingestion job timed out.');
      }

      const autoMapping: Record<string, string> = {};
      if (jobResult.suggestedMapping) {
        Object.entries(jobResult.suggestedMapping).forEach(([dbField, header]: [string, any]) => {
          autoMapping[dbField] = header;
        });
      }

      return {
        ...jobResult,
        documentId: jobResult.documentId || jobResult._id || jobId,
        suggestedMapping: autoMapping,
      };
    }

    // Synchronous parse response (direct 200 OK)
    if (onProgressStep) {
      onProgressStep('Parsing sales data...');
    }
    const result = await response.json();
    const autoMapping: Record<string, string> = {};
    if (result.suggestedMapping) {
      Object.entries(result.suggestedMapping).forEach(([dbField, header]: [string, any]) => {
        autoMapping[dbField] = header;
      });
    }

    return {
      ...result,
      documentId: result.documentId || result._id || result.ingestionJobId,
      suggestedMapping: autoMapping,
    };
  },

  async confirmSalesIngestion(payload: {
    documentId: string;
    supplierId: string;
    mappings: Record<string, string>;
    saveTemplate: boolean;
  }): Promise<{ countImported: number; warnings?: string[]; [key: string]: any }> {
    const response = await fetch(`${API_BASE_URL}/ingest/confirm-sales`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Sales import failed');
    }

    return await response.json();
  },

  async fetchSalesRecords(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: 'GET',
      headers: COMMON_HEADERS,
    });
    if (!res.ok) {
      throw new Error('Failed to fetch sales records');
    }
    return await res.json();
  },

  async addBuyer(payload: {
    companyName: string;
    email: string;
    tier?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/buyers`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save buyer');
    }
    return await res.json();
  },

  async uploadBuyerFile(
    file: File,
    supplierId?: string,
    onProgressStep?: (step: string) => void
  ): Promise<IngestionParsedResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (supplierId) {
      formData.append('supplierId', supplierId);
    }

    if (onProgressStep) {
      onProgressStep('Uploading buyer file to backend...');
    }

    const response = await fetch(`${API_BASE_URL}/ingest/upload`, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Failed to parse buyer file.');
    }

    if (response.status === 202) {
      const acceptData = await response.json();
      const jobId = acceptData.ingestionJobId;

      if (onProgressStep) {
        onProgressStep('Queued for processing. Polling job status...');
      }

      let finished = false;
      let attempts = 0;
      let jobResult: any = null;

      while (!finished && attempts < 60) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;

        const pollResponse = await fetch(`${API_BASE_URL}/ingest/jobs/${jobId}`, {
          method: 'GET',
          headers: COMMON_HEADERS,
        });

        if (!pollResponse.ok) {
          throw new Error('Failed to query ingestion job status.');
        }

        const job = await pollResponse.json();
        if (job.status === 'parsing') {
          if (onProgressStep) {
            onProgressStep('Python Sidecar worker is actively parsing table structures...');
          }
        } else if (job.status === 'parsed') {
          finished = true;
          jobResult = job;
        } else if (job.status === 'error') {
          throw new Error(job.errorMessage || 'Worker failed to parse buyer file.');
        }
      }

      if (!finished) {
        throw new Error('Buyer ingestion job timed out.');
      }

      const autoMapping: Record<string, string> = {};
      if (jobResult.suggestedMapping) {
        Object.entries(jobResult.suggestedMapping).forEach(([dbField, header]: [string, any]) => {
          autoMapping[dbField] = header;
        });
      }

      return {
        ...jobResult,
        documentId: jobResult.documentId || jobResult._id || jobId,
        suggestedMapping: autoMapping,
      };
    } else {
      if (onProgressStep) {
        onProgressStep('Parsing buyer data...');
      }
      const result = await response.json();
      const autoMapping: Record<string, string> = {};
      if (result.suggestedMapping) {
        Object.entries(result.suggestedMapping).forEach(([dbField, header]: [string, any]) => {
          autoMapping[dbField] = header;
        });
      }

      return {
        ...result,
        documentId: result.documentId || result._id || result.ingestionJobId,
        suggestedMapping: autoMapping,
      };
    }
  },

  async confirmBuyerIngestion(payload: {
    documentId: string;
    mappings: Record<string, string>;
    buyerListId?: string;
  }): Promise<{ createdCount: number; updatedCount: number; buyerIds: string[]; [key: string]: any }> {
    const response = await fetch(`${API_BASE_URL}/ingest/confirm-buyer`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to confirm buyer ingestion.');
    }

    return await response.json();
  },
};

export default ingestionService;

