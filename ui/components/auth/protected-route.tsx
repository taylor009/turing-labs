"use client"

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from './auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requiredRoles?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requiredRoles = [],
  fallbackPath = '/auth'
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect after auth is initialized to avoid flashing
    if (!initialized || loading) return

    if (requireAuth && !user) {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirectAfterAuth', pathname)
      router.push(fallbackPath)
      return
    }

    if (user && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        // User doesn't have required role, redirect to unauthorized page or home
        router.push('/unauthorized')
        return
      }
    }
  }, [user, loading, initialized, requireAuth, requiredRoles, router, pathname, fallbackPath])

  // Show loading state while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If specific roles are required but user doesn't have them, don't render children
  if (user && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}

// Convenience wrapper for admin-only routes
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requiredRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for product manager and admin routes
export function ProductManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requiredRoles={['ADMIN', 'PRODUCT_MANAGER']}>
      {children}
    </ProtectedRoute>
  )
}