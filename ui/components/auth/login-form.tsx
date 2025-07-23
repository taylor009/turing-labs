"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuthContext } from './auth-provider'
import { SignInData } from '@/types/auth.types'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
})

interface LoginFormProps {
  onToggleMode: () => void
}

type LoginFormData = SignInData & { rememberMe?: boolean }

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading, user } = useAuthContext()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  })

  const rememberMe = watch('rememberMe')

  useEffect(() => {
    if (user) {
      // Check if there's a stored redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterAuth')
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterAuth')
        router.push(redirectPath)
      } else {
        router.push('/dashboard') // or wherever authenticated users should go
      }
    }
  }, [user, router])

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn(data)
    
    if (result.success && data.rememberMe) {
      // Store preference for remember me if needed
      localStorage.setItem('rememberMe', 'true')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <LogIn className="h-5 w-5" />
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue('rememberMe', checked as boolean)}
              disabled={loading}
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm font-normal cursor-pointer"
            >
              Remember me
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-blue-600"
              onClick={onToggleMode}
            >
              Sign up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}