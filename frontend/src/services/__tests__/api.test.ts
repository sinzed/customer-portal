/**
 * Tests for API service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from '../api'
import type { CaseListResponse, CaseCreateRequest, DocumentListResponse } from '../../types/api'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getCases', () => {
    it('should fetch cases successfully', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'
      const mockCases: CaseListResponse = {
        cases: [
          {
            case_id: '1',
            customer_id: mockUserId,
            subject: 'Test Case',
            description: 'Test description',
            status: 'New',
            created_date: '2024-01-01T10:00:00',
          },
        ],
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCases,
      })

      const result = await api.getCases()

      expect(result).toEqual(mockCases)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customer/${mockUserId}/cases`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      )
    })

    it('should throw ApiError when not authenticated', async () => {
      localStorage.clear()

      await expect(api.getCases()).rejects.toThrow(ApiError)
      await expect(api.getCases()).rejects.toThrow('User not authenticated')
    })

    it('should handle API errors', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      })

      await expect(api.getCases()).rejects.toThrow(ApiError)
    })

    it('should handle 401 unauthorized', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(api.getCases()).rejects.toThrow(ApiError)

      expect(removeItemSpy).toHaveBeenCalledWith('auth_token')
      expect(removeItemSpy).toHaveBeenCalledWith('auth_user')
      expect(dispatchEventSpy).toHaveBeenCalled()
    })
  })

  describe('createCase', () => {
    it('should create a case successfully', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'
      const caseRequest: CaseCreateRequest = {
        subject: 'New Case',
        description: 'Case description',
      }
      const mockResponse = {
        case_id: 'new-case-id',
        message: 'Case created successfully',
        status: 'New',
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.createCase(caseRequest)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customer/${mockUserId}/cases`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(caseRequest),
        }),
      )
    })

    it('should throw ApiError when not authenticated', async () => {
      localStorage.clear()

      await expect(
        api.createCase({ subject: 'Test' }),
      ).rejects.toThrow(ApiError)
    })
  })

  describe('getDocuments', () => {
    it('should fetch documents successfully', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'
      const mockDocuments: DocumentListResponse = {
        documents: [
          {
            document_id: '1',
            customer_id: mockUserId,
            name: 'test.pdf',
            type: 'PDF',
            download_url: '/documents/1/download',
            created_date: '2024-01-01T10:00:00',
          },
        ],
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocuments,
      })

      const result = await api.getDocuments()

      expect(result).toEqual(mockDocuments)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customer/${mockUserId}/documents`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      )
    })

    it('should throw ApiError when not authenticated', async () => {
      localStorage.clear()

      await expect(api.getDocuments()).rejects.toThrow(ApiError)
    })
  })

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const mockUserId = '123'
      const mockToken = 'test-token'
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const mockResponse = {
        document_id: 'new-doc-id',
        customer_id: mockUserId,
        name: 'test.pdf',
        type: 'PDF',
        download_url: '/documents/new-doc-id/download',
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify({ user_id: mockUserId }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.uploadDocument(file)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customer/${mockUserId}/documents`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      )
    })

    it('should throw ApiError when not authenticated', async () => {
      localStorage.clear()
      const file = new File(['test'], 'test.pdf')

      await expect(api.uploadDocument(file)).rejects.toThrow(ApiError)
    })
  })
})
