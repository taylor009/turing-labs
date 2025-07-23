"use client"

import { useState } from 'react'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

export function AuthForms() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Project Proposal Platform
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp 
              ? 'Create your account to start managing project proposals' 
              : 'Sign in to access your project proposals'
            }
          </p>
        </div>
        
        {isSignUp ? (
          <SignupForm onToggleMode={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  )
}