/**
 * Tests for Login component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import { fireEvent } from '@testing-library/react'
import Login from '../Login'

// Mock AuthContext
const mockLogin = vi.fn()
const mockAuthContext = {
  user: null,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  loading: false,
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock react-router-dom
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form', () => {
    render(<Login />)

    expect(screen.getByText('Anmelden')).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument()
  })

  it('should call login function on form submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)

    render(<Login />)

    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/passwort/i)
    const submitButton = screen.getByRole('button', { name: /anmelden/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should display error message on login failure', async () => {
    const error = new Error('Invalid credentials')
    mockLogin.mockRejectedValueOnce(error)

    render(<Login />)

    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/passwort/i)
    const submitButton = screen.getByRole('button', { name: /anmelden/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/passwort/i)
    const submitButton = screen.getByRole('button', { name: /anmelden/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/anmelden.../i)).toBeInTheDocument()
    })
  })
})
