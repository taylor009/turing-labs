'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { proposals as proposalsApi, stakeholders as stakeholdersApi, approvals as approvalsApi, subscriptions } from '@/lib/supabase-client';
import { useAuthContext } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit,
  Mail,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns/format';
import { ProposalWithRelations, StakeholderWithUser, ApprovalWithUser } from '@/types/database.types';
import { AddStakeholderDialog, StatusManagement } from '@/components/proposals';
import { useToast } from '@/hooks/use-toast';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<ProposalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const proposalId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && proposalId) {
      loadProposal();
      
      // Set up real-time subscriptions
      const proposalChannel = subscriptions.onProposalChange(proposalId, () => {
        loadProposal();
      });
      
      const stakeholderChannel = subscriptions.onStakeholderChange(proposalId, () => {
        loadProposal();
      });
      
      const approvalChannel = subscriptions.onApprovalChange(proposalId, () => {
        loadProposal();
      });

      return () => {
        subscriptions.unsubscribe(proposalChannel);
        subscriptions.unsubscribe(stakeholderChannel);
        subscriptions.unsubscribe(approvalChannel);
      };
    }
  }, [user, authLoading, proposalId]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const data = await proposalsApi.getById(proposalId);
      setProposal(data);
    } catch (err) {
      console.error('Error loading proposal:', err);
      setError('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStakeholder = async (stakeholderId: string) => {
    try {
      await stakeholdersApi.remove(stakeholderId);
      await loadProposal();
      
      toast({
        title: "Stakeholder removed",
        description: "The stakeholder has been removed from this proposal.",
      });
    } catch (error) {
      console.error('Error removing stakeholder:', error);
      toast({
        title: "Removal failed",
        description: "Could not remove stakeholder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleApproval = async (status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
    if (!user || !proposal) return;

    try {
      setSubmittingApproval(true);
      
      // Check if user already has an approval
      const existingApproval = proposal.approvals?.find(a => a.user.id === user.id);
      
      if (existingApproval) {
        await approvalsApi.update(existingApproval.id, status, approvalComment);
      } else {
        await approvalsApi.submit(proposal.id, user.id, status, approvalComment);
      }
      
      setApprovalComment('');
      await loadProposal();
    } catch (err) {
      console.error('Error submitting approval:', err);
      setError('Failed to submit approval');
    } finally {
      setSubmittingApproval(false);
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

  if (authLoading || loading) {
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

  if (error || !proposal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error || 'Proposal not found'}</p>
            <Button onClick={() => router.push('/proposals')} className="mt-4">
              Back to Proposals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userApproval = proposal.approvals?.find(a => a.user.id === user.id);
  const isCreator = proposal.created_by === user.id;
  const isStakeholder = proposal.stakeholders?.some(s => s.user_id === user.id);
  const canApprove = isStakeholder && proposal.status === 'PENDING_APPROVAL';

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/proposals')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Proposals
      </Button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{proposal.product_name}</h1>
          <p className="text-muted-foreground mt-2">
            {proposal.category} • Current Cost: ${proposal.current_cost.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusManagement
            proposalId={proposal.id}
            currentStatus={proposal.status}
            isCreator={isCreator}
            isAdmin={user.role === 'ADMIN'}
            onStatusChanged={loadProposal}
          />
          {isCreator && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/proposals/${proposal.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="stakeholders">
            Stakeholders ({proposal.stakeholders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals ({proposal.approvals?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Formulation</Label>
                <p className="mt-1">{proposal.formulation}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Business Objectives</Label>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {proposal.business_objectives.map((obj, idx) => (
                    <li key={idx} className="text-sm">{obj}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(proposal.constraints).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <Label className="text-sm font-medium">{category}</Label>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Acceptable Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {proposal.acceptable_changes.map((change, idx) => (
                    <li key={idx} className="text-sm">{change}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Not Acceptable Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {proposal.not_acceptable_changes.map((change, idx) => (
                    <li key={idx} className="text-sm">{change}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-4">
          {isCreator && (
            <div className="flex justify-end">
              <AddStakeholderDialog
                proposalId={proposal.id}
                existingStakeholders={proposal.stakeholders || []}
                onStakeholderAdded={loadProposal}
              />
            </div>
          )}

          {proposal.stakeholders?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No stakeholders added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proposal.stakeholders?.map((stakeholder) => (
                <Card key={stakeholder.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {stakeholder.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{stakeholder.user.name}</p>
                        <p className="text-sm text-muted-foreground">{stakeholder.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(stakeholder.status)}
                      {isCreator && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveStakeholder(stakeholder.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {canApprove && !userApproval && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Comments (Optional)</Label>
                  <Textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Add any comments about your decision..."
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproval('APPROVED')}
                    disabled={submittingApproval}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleApproval('CHANGES_REQUESTED')}
                    disabled={submittingApproval}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproval('REJECTED')}
                    disabled={submittingApproval}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {proposal.approvals?.length === 0 && !canApprove ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approvals yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proposal.approvals?.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {approval.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{approval.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(approval.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(approval.status)}
                    </div>
                    {approval.comments && (
                      <p className="text-sm mt-2 pl-12">{approval.comments}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}