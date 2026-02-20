/**
 * Tests for Cases component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import Cases from '../Cases'
import { api, ApiError } from '../../services/api'
import type { CaseListResponse } from '../../types/api'

// Mock the API service
vi.mock('../../services/api', () => ({
  api: {
    getCases: vi.fn(),
  },
  ApiError: class extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
      this.name = 'ApiError'
    }
  },
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockLocation = { pathname: '/cases', state: {} }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

describe('Cases Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    ;(api.getCases as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    )

    render(<Cases />)

    expect(screen.getByText('Tickets / Cases')).toBeInTheDocument()
    expect(screen.getByText('Lade Tickets...')).toBeInTheDocument()
  })

  it('should render cases list when data is loaded', async () => {
    const mockCases: CaseListResponse = {
      cases: [
        {
          case_id: '1',
          customer_id: '123',
          subject: 'Test Case 1',
          description: 'Description 1',
          status: 'New',
          type: 'Support',
          created_date: '2024-01-01T10:00:00',
        },
        {
          case_id: '2',
          customer_id: '123',
          subject: 'Test Case 2',
          description: 'Description 2',
          status: 'In Progress',
          type: 'Bug',
          created_date: '2024-01-02T10:00:00',
        },
      ],
    }

    ;(api.getCases as any).mockResolvedValueOnce(mockCases)

    render(<Cases />)

    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument()
      expect(screen.getByText('Test Case 2')).toBeInTheDocument()
    })

    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should render empty state when no cases exist', async () => {
    const mockCases: CaseListResponse = {
      cases: [],
    }

    ;(api.getCases as any).mockResolvedValueOnce(mockCases)

    render(<Cases />)

    await waitFor(() => {
      expect(screen.getByText('Keine Tickets vorhanden.')).toBeInTheDocument()
    })
  })

  it('should render error message when API call fails', async () => {
    ;(api.getCases as any).mockRejectedValueOnce(
      new ApiError('Failed to load cases', 500),
    )

    render(<Cases />)

    await waitFor(() => {
      expect(screen.getByText(/Fehler:/)).toBeInTheDocument()
      expect(screen.getByText(/Failed to load cases/)).toBeInTheDocument()
    })
  })

  it('should have create case button', async () => {
    const mockCases: CaseListResponse = {
      cases: [],
    }

    ;(api.getCases as any).mockResolvedValueOnce(mockCases)

    render(<Cases />)

    await waitFor(() => {
      const createButton = screen.getByText('Neues Ticket erstellen')
      expect(createButton).toBeInTheDocument()
    })
  })

  it('should navigate to create-case when button is clicked', async () => {
    const mockCases: CaseListResponse = {
      cases: [],
    }

    ;(api.getCases as any).mockResolvedValueOnce(mockCases)

    render(<Cases />)

    await waitFor(() => {
      const createButton = screen.getByText('Neues Ticket erstellen')
      createButton.click()
    })

    // Note: In a real test, you'd need to wait for navigation
    // For now, we just verify the button exists and is clickable
    expect(mockNavigate).toHaveBeenCalled()
  })
})
