'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { proposalsApi } from '@/lib/api';
import { useAuthContext } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Users, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns/format';

type ProposalWithCounts = any; // We'll use any for now since the exact type depends on Supabase response

export default function ProposalsPage() {
  const router = useRouter();
  const { user, loading: authLoading, getAuthToken } = useAuthContext();
  const [proposals, setProposals] = useState<ProposalWithCounts[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ProposalWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && user) {
      loadProposals();
    }
  }, [user, authLoading]);

  // Filter proposals when search query or filters change
  useEffect(() => {
    let filtered = [...proposals];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(proposal => 
        proposal.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.formulation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    // Creator filter
    if (creatorFilter !== 'all') {
      if (creatorFilter === 'mine') {
        filtered = filtered.filter(proposal => proposal.createdBy === user?.id);
      } else if (creatorFilter === 'others') {
        filtered = filtered.filter(proposal => proposal.createdBy !== user?.id);
      }
    }

    setFilteredProposals(filtered);
  }, [proposals, searchQuery, statusFilter, creatorFilter, user?.id]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const data = await proposalsApi.list(token);
      setProposals(data?.data || []);
    } catch (err) {
      console.error('Error loading proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      PENDING_APPROVAL: { label: 'Pending Approval', variant: 'default' as const, icon: Clock },
      APPROVED: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      CHANGES_REQUESTED: { label: 'Changes Requested', variant: 'warning' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Project Proposals</h1>
            <p className="text-muted-foreground mt-2">
              Manage and review product reformulation proposals
            </p>
          </div>
          <Button onClick={() => router.push('/proposals/new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search proposals by name, category, or creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                </SelectContent>
              </Select>

              {/* Creator Filter */}
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proposals</SelectItem>
                  <SelectItem value="mine">My Proposals</SelectItem>
                  <SelectItem value="others">Others' Proposals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredProposals.length} of {proposals.length} proposals
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {proposals.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-4">No proposals found</p>
                <Button onClick={() => router.push('/proposals/new')}>
                  Create your first proposal
                </Button>
              </>
            ) : (
              <>
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No proposals match your current filters</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCreatorFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/proposals/${proposal.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{proposal.productName}</CardTitle>
                  {getStatusBadge(proposal.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {proposal.category} • ${proposal.currentCost.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proposal.formulation}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>0</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>

                  <div className="pt-2 text-xs text-muted-foreground">
                    Created by {proposal.creator?.name || 'Unknown'} •{' '}
                    {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}