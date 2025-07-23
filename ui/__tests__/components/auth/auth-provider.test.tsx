import React from 'react'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '@/components/auth/auth-provider'
import * as useAuthHook from '@/hooks/use-auth'

jest.mock('@/hooks/use-auth')

const mockUseAuth = jest.spyOn(useAuthHook, 'useAuth')

function TestComponent() {
  const { user, loading, signIn, signOut } = useAuthContext()
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => signIn({ email: 'test@example.com', password: 'password' })}>
        Sign In
      </button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides auth context to children', () => {
    const mockAuthValue = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: null,
      loading: false,
      initialized: true,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    }

    mockUseAuth.mockReturnValue(mockAuthValue)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const mockAuthValue = {
      user: null,
      session: null,
      loading: true,
      initialized: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getAuthToken: jest.fn(),
      refreshSession: jest.fn(),
    }

    mockUseAuth.mockReturnValue(mockAuthValue)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
  })

  it('throws error when useAuthContext is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuthContext must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})