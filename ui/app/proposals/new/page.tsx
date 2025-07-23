'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth';
import { ProjectProposalForm } from '@/components/project-proposal';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewProposalPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Proposal</h1>
        <p className="text-muted-foreground mt-2">
          Submit a new product reformulation proposal for review
        </p>
      </div>
      
      <ProjectProposalForm />
    </div>
  );
}