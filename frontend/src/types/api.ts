/**
 * Type definitions for API responses and requests
 */

export interface Document {
  document_id: string;
  customer_id: string;
  name: string;
  type: string;
  download_url: string;
  created_date?: string;
}

export interface DocumentListResponse {
  documents: Document[];
}

export interface Case {
  case_id: string;
  customer_id: string;
  subject: string;
  description?: string;
  type?: string;
  status: string;
  created_date: string;
}

export interface CaseListResponse {
  cases: Case[];
}

export interface CaseCreateRequest {
  subject: string;
  description?: string;
}

export interface CaseCreateResponse {
  case_id: string;
  message: string;
  status: string;
}
