import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthUser, SignUpData, SignInData } from '@/types/auth.types'
import { useToast } from '@/hooks/use-toast'
import { Session, User } from '@supabase/supabase-js'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  // Helper function to transform Supabase user to AuthUser
  const transformUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || '',
      role: supabaseUser.user_metadata?.role || 'STAKEHOLDER',
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        if (mounted) {
          setSession(session)
          setUser(transformUser(session?.user ?? null))
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(transformUser(session?.user ?? null))
          setLoading(false)
          setInitialized(true)

          // Handle different auth events
          if (event === 'SIGNED_OUT') {
            // Clear any local storage items if needed
            localStorage.removeItem('supabase.auth.token')
            // Ensure state is fully cleared
            setUser(null)
            setSession(null)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true)
      
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'STAKEHOLDER'
          }
        }
      })

      if (error) throw error

      // Create user profile in the users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.fullName,
            password: 'managed_by_supabase_auth',
            role: 'STAKEHOLDER'
          })

        if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
          console.error('Error creating user profile:', profileError)
        }
      }

      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      })

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInData) => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      })

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (redirect: boolean = true) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      // Clear local state immediately
      setUser(null)
      setSession(null)

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })

      // Redirect to login/home page if requested
      if (redirect) {
        // Small delay to ensure state is cleared
        setTimeout(() => {
          router.push('/')
        }, 100)
      }

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Get authentication token
  const getAuthToken = () => {
    return session?.access_token || null
  }

  // Refresh session manually if needed
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      setSession(session)
      setUser(transformUser(session?.user ?? null))
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh session'
      return { success: false, error: errorMessage }
    }
  }

  return {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    getAuthToken,
    refreshSession
  }
}