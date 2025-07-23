import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'

jest.mock('@/components/auth/auth-provider')

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>
const mockPush = jest.fn()
const mockOnToggleMode = jest.fn()

// Mock useRouter separately
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders login form with all required fields', () => {
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows validation errors for invalid inputs', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: '' })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('calls signIn when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn().mockResolvedValue({ success: true })
    
    mockUseAuthContext.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      })
    })
  })

  it('stores rememberMe preference when checkbox is checked', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn().mockResolvedValue({ success: true })
    const mockSetItem = jest.fn()
    
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: mockSetItem },
      writable: true,
    })
    
    mockUseAuthContext.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByLabelText(/remember me/i))
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('rememberMe', 'true')
    })
  })

  it('redirects authenticated user to dashboard', async () => {
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('disables form when loading', () => {
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: true,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('calls onToggleMode when sign up link is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<LoginForm onToggleMode={mockOnToggleMode} />)
    
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(mockOnToggleMode).toHaveBeenCalled()
  })
})