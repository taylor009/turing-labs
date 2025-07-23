import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '@/components/auth/signup-form'
import { useAuthContext } from '@/components/auth/auth-provider'

jest.mock('@/components/auth/auth-provider')

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>
const mockOnToggleMode = jest.fn()

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders signup form with all required fields', () => {
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    expect(screen.getByText(/sign up/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for invalid inputs', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password456')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // Toggle first password field
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Toggle second password field
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
  })

  it('calls signUp when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn().mockResolvedValue({ success: true })
    
    mockUseAuthContext.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
  })

  it('works without full name (optional field)', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn().mockResolvedValue({ success: true })
    
    mockUseAuthContext.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        fullName: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
  })

  it('disables form when loading', () => {
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: true,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    expect(screen.getByLabelText(/full name/i)).toBeDisabled()
    expect(screen.getByLabelText(/^email$/i)).toBeDisabled()
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled()
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })

  it('calls onToggleMode when sign in link is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuthContext.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      user: null,
      session: null,
      initialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    })

    render(<SignupForm onToggleMode={mockOnToggleMode} />)
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(mockOnToggleMode).toHaveBeenCalled()
  })
})