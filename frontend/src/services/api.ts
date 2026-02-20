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

const TOKEN_KEY = 'auth_token';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get user ID from stored user data
 */
function getUserId(): string | null {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.user_id || null;
    } catch {
      return null;
    }
  }
  return null;
}

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
    // Handle 401 Unauthorized - token might be invalid
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('auth_user');
      // Dispatch event to notify components about authentication failure
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Navigate to login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(errorData.detail || 'API request failed', response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * Create headers with authentication token if available
 */
function createHeaders(includeAuth: boolean = true, contentType: string = 'application/json'): HeadersInit {
  const headers: HeadersInit = {};

  // Only set Content-Type if not multipart/form-data (browser will set it with boundary)
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

export const api = {
  /**
   * Get all documents for a customer
   * Uses authenticated user's ID if customerId is not provided
   */
  async getDocuments(customerId?: string): Promise<DocumentListResponse> {
    const userId = customerId || getUserId();
    if (!userId) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      throw new ApiError('User not authenticated', 401);
    }
    const response = await fetch(`${API_BASE_URL}/customer/${userId}/documents`, {
      headers: createHeaders(),
    });
    return handleResponse<DocumentListResponse>(response);
  },

  /**
   * Get all cases/tickets for a customer
   * Uses authenticated user's ID if customerId is not provided
   */
  async getCases(customerId?: string): Promise<CaseListResponse> {
    const userId = customerId || getUserId();
    if (!userId) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      throw new ApiError('User not authenticated', 401);
    }
    const response = await fetch(`${API_BASE_URL}/customer/${userId}/cases`, {
      headers: createHeaders(),
    });
    return handleResponse<CaseListResponse>(response);
  },

  /**
   * Create a new case/ticket
   * Uses authenticated user's ID if customerId is not provided
   */
  async createCase(
    caseData: CaseCreateRequest,
    customerId?: string
  ): Promise<CaseCreateResponse> {
    const userId = customerId || getUserId();
    if (!userId) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      throw new ApiError('User not authenticated', 401);
    }
    const response = await fetch(`${API_BASE_URL}/customer/${userId}/cases`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(caseData),
    });
    return handleResponse<CaseCreateResponse>(response);
  },

  /**
   * Upload a document for a customer
   * Uses authenticated user's ID if customerId is not provided
   */
  async uploadDocument(
    file: File,
    documentType?: string,
    customerId?: string
  ): Promise<Document> {
    const userId = customerId || getUserId();
    if (!userId) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      throw new ApiError('User not authenticated', 401);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('document_type', documentType);
    }

    const response = await fetch(`${API_BASE_URL}/customer/${userId}/documents`, {
      method: 'POST',
      headers: createHeaders(true, 'multipart/form-data'),
      body: formData,
    });
    return handleResponse<Document>(response);
  },
};
