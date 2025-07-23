import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'PRODUCT_MANAGER' | 'STAKEHOLDER'
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
}

export interface SignUpData {
  email: string
  password: string
  confirmPassword: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}