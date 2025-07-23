"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { AuthUser, SignUpData, SignInData } from '@/types/auth.types'

interface AuthContextType {
  user: AuthUser | null
  session: any
  loading: boolean
  initialized: boolean
  signUp: (data: SignUpData) => Promise<{ success: boolean; error: string | null }>
  signIn: (data: SignInData) => Promise<{ success: boolean; error: string | null }>
  signOut: (redirect?: boolean) => Promise<{ success: boolean; error: string | null }>
  getAuthToken: () => string | null
  refreshSession: () => Promise<{ success: boolean; error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}