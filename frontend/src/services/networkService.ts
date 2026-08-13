import { firebaseAuthService } from './firebaseAuthService';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const SIDECAR_BASE_URL = import.meta.env.VITE_SIDECAR_URL || '/sidecar';

/**
 * Generic API request helper that prevents 304 Not Modified caching issues
 * and parses JSON responses cleanly.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = await firebaseAuthService.getCurrentIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    headers,
  });

  if (!response.ok && response.status !== 304) {
    throw new Error(`Request to ${url} failed with status ${response.status}: ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch all buyers from the backend API.
 * Prevents 304 Not Modified status errors by requesting fresh data.
 */
export async function getBuyers(): Promise<any[]> {
  return apiFetch<any[]>('/buyers', { method: 'GET' });
}

/**
 * Fetch all buyers including deactivated ones (for two-panel assignment).
 */
export async function getAllBuyers(): Promise<any[]> {
  return apiFetch<any[]>('/buyers?all=true', { method: 'GET' });
}

/**
 * Fetch a single buyer by ID (includes emailThreadCount).
 */
export async function getBuyerById(id: string): Promise<any> {
  return apiFetch(`/buyers/${id}`, { method: 'GET' });
}

/**
 * Update mutable fields on a buyer record.
 */
export async function updateBuyer(id: string, payload: Record<string, any>): Promise<any> {
  return apiFetch(`/buyers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deactivate a buyer (soft-kill: isActive = false).
 */
export async function deactivateBuyer(id: string, reason?: string): Promise<any> {
  return apiFetch(`/buyers/${id}/deactivate`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason || '' }),
  });
}

/**
 * Reactivate a previously deactivated buyer.
 */
export async function reactivateBuyer(id: string): Promise<any> {
  return apiFetch(`/buyers/${id}/reactivate`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

/**
 * Update the allergen exclusions list for a specific buyer.
 */
export async function updateBuyerExclusions(
  buyerId: string,
  excludedAllergens: string[]
): Promise<any> {
  return apiFetch(`/buyers/${buyerId}/exclusions`, {
    method: 'PUT',
    body: JSON.stringify({ excludedAllergens }),
  });
}

/**
 * Fetch all suppliers from the backend API.
 */
export async function getSuppliers(): Promise<any[]> {
  return apiFetch<any[]>('/suppliers', { method: 'GET' });
}

/**
 * Fetch inventory list from the backend API.
 */
export async function getInventory(): Promise<any[]> {
  return apiFetch<any[]>('/inventory', { method: 'GET' });
}

/**
 * Fetch shipments list from the backend API.
 */
export async function getShipments(): Promise<any[]> {
  return apiFetch<any[]>('/shipments', { method: 'GET' });
}

/**
 * Update allergens for a specific product.
 */
export async function updateProductAllergens(
  productId: string,
  allergens: string[]
): Promise<any> {
  return apiFetch(`/products/${productId}/allergens`, {
    method: 'PUT',
    body: JSON.stringify({ allergens }),
  });
}

// ─── Buyer Lists ─────────────────────────────────────────────────────────────

export async function getBuyerLists(supplierId?: string): Promise<any[]> {
  const url = supplierId ? `/buyer-lists?supplierId=${encodeURIComponent(supplierId)}` : '/buyer-lists';
  return apiFetch<any[]>(url, { method: 'GET' });
}

export async function createBuyerList(payload: { name: string; description?: string; type?: string; supplierId?: string }): Promise<any> {
  return apiFetch('/buyer-lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBuyerList(id: string, payload: { name?: string; description?: string }): Promise<any> {
  return apiFetch(`/buyer-lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBuyerList(id: string): Promise<any> {
  return apiFetch(`/buyer-lists/${id}`, { method: 'DELETE' });
}

export async function updateBuyerListMembers(id: string, buyerIds: string[]): Promise<any> {
  return apiFetch(`/buyer-lists/${id}/members`, {
    method: 'PUT',
    body: JSON.stringify({ buyerIds }),
  });
}

export interface EmailThread {
  _id: string;
  subject: string;
  buyerEmail?: string;
  lastMessageSnippet?: string;
  snippet?: string;
  body?: string;
  unread?: boolean;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export type EmailTemplateCategory = 'Clearance' | 'Auction' | 'Award' | 'General';

export interface EmailTemplate {
  _id: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  body?: string;
  supplierId: string;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * Fetch all email templates for a given supplier.
 */
export async function getEmailTemplates(supplierId: string): Promise<EmailTemplate[]> {
  return apiFetch<EmailTemplate[]>(`/email-templates?supplierId=${encodeURIComponent(supplierId)}`, { method: 'GET' });
}

/**
 * Delete an email template by id.
 */
export async function deleteEmailTemplate(id: string): Promise<void> {
  await apiFetch(`/email-templates/${id}`, { method: 'DELETE' });
}

export interface CreateEmailTemplatePayload {
  name: string;
  subject: string;
  category: EmailTemplateCategory;
  bodyHtml: string;
  supplierId: string;
  fromEmail?: string;
  signature?: string;
}

/**
 * Create a new email template (POST).
 */
export async function createEmailTemplate(
  payload: CreateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>('/email-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing email template (PUT).
 */
export async function updateEmailTemplate(
  id: string,
  payload: CreateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>(`/email-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getEmailThreadsByBuyerEmail(email: string): Promise<EmailThread[]> {
  const encoded = encodeURIComponent(email);
  const result = await apiFetch<any>(`/email-threads?buyerEmail=${encoded}`, { method: 'GET' });
  // The email-threads route returns { threads: [...] } or an array directly
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.threads)) return result.threads;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────

const networkService = {
  API_BASE_URL,
  SIDECAR_BASE_URL,
  apiFetch,
  getBuyers,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deactivateBuyer,
  reactivateBuyer,
  updateBuyerExclusions,
  getBuyerLists,
  createBuyerList,
  updateBuyerList,
  deleteBuyerList,
  updateBuyerListMembers,
  getEmailThreadsByBuyerEmail,
  getSuppliers,
  getInventory,
  getShipments,
  updateProductAllergens,
  getEmailTemplates,
  deleteEmailTemplate,
};

export default networkService;
