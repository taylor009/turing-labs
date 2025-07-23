"use client"

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth'
import { AuthForms } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, FileText, Plus, BarChart3 } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const { user, loading, signOut } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForms />
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TuringLabs Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your product reformulation proposals
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/proposals')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                View Proposals
              </CardTitle>
              <CardDescription>
                Browse and manage all project proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start">
                View all proposals →
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/proposals/new')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Proposal
              </CardTitle>
              <CardDescription>
                Create a new reformulation proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start">
                Create proposal →
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View proposal statistics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start">
                View analytics →
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
