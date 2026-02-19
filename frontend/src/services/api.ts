/**
 * API Service Layer
 * 
 * Centralized API client that handles communication with the backend.
 * In production, this would include:
 * - Authentication token management
 * - Request/response interceptors
 * - Error handling and retry logic
 * - Request cancellation
 */

import type {
  DocumentListResponse,
  CaseListResponse,
  CaseCreateRequest,
  CaseCreateResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// For MVP, we use a hardcoded customer ID
// In production, this would come from authentication context
const DEFAULT_CUSTOMER_ID = '123';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(errorData.detail || 'API request failed', response.status);
  }
  return response.json() as Promise<T>;
}

export const api = {
  /**
   * Get all documents for a customer
   */
  async getDocuments(customerId: string = DEFAULT_CUSTOMER_ID): Promise<DocumentListResponse> {
    const response = await fetch(`${API_BASE_URL}/customer/${customerId}/documents`);
    return handleResponse<DocumentListResponse>(response);
  },

  /**
   * Get all cases/tickets for a customer
   */
  async getCases(customerId: string = DEFAULT_CUSTOMER_ID): Promise<CaseListResponse> {
    const response = await fetch(`${API_BASE_URL}/customer/${customerId}/cases`);
    return handleResponse<CaseListResponse>(response);
  },

  /**
   * Create a new case/ticket
   */
  async createCase(
    customerId: string,
    caseData: CaseCreateRequest
  ): Promise<CaseCreateResponse> {
    const response = await fetch(`${API_BASE_URL}/customer/${customerId}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseData),
    });
    return handleResponse<CaseCreateResponse>(response);
  },
};
