'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { proposals as proposalsApi } from '@/lib/supabase-client';
import { useAuthContext } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, X } from 'lucide-react';
import { ProposalWithRelations, ProposalFormData } from '@/types/database.types';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  
  const [proposal, setProposal] = useState<ProposalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProposalFormData>({
    product_name: '',
    current_cost: 0,
    category: '',
    formulation: '',
    business_objectives: [],
    priority_objectives: [],
    constraints: {},
    acceptable_changes: [],
    not_acceptable_changes: [],
    feasibility_limits: []
  });
  
  const proposalId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && proposalId) {
      loadProposal();
    }
  }, [user, authLoading, proposalId]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const data = await proposalsApi.getById(proposalId);
      setProposal(data);
      
      // Populate form data
      setFormData({
        product_name: data.product_name,
        current_cost: data.current_cost,
        category: data.category,
        formulation: data.formulation,
        business_objectives: data.business_objectives,
        priority_objectives: data.priority_objectives,
        constraints: data.constraints,
        acceptable_changes: data.acceptable_changes,
        not_acceptable_changes: data.not_acceptable_changes,
        feasibility_limits: data.feasibility_limits
      });
    } catch (err) {
      console.error('Error loading proposal:', err);
      setError('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!proposal || !user) return;

    // Check if user is the creator
    if (proposal.created_by !== user.id) {
      toast({
        title: "Access denied",
        description: "Only the proposal creator can edit this proposal.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await proposalsApi.update(proposal.id, formData);
      
      toast({
        title: "Proposal updated",
        description: "Your proposal has been successfully updated.",
      });

      router.push(`/proposals/${proposalId}`);
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast({
        title: "Update failed",
        description: "Could not update proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrayAdd = (field: keyof ProposalFormData, value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }));
  };

  const handleArrayRemove = (field: keyof ProposalFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleConstraintAdd = (category: string, constraint: string) => {
    if (!constraint.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [category]: [...(prev.constraints[category] || []), constraint]
      }
    }));
  };

  const handleConstraintRemove = (category: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [category]: (prev.constraints[category] || []).filter((_, i) => i !== index)
      }
    }));
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
            <p className="text-destructive">{error || 'Proposal not found'}</p>
            <Button onClick={() => router.push('/proposals')} className="mt-4">
              Back to Proposals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user can edit
  if (proposal.created_by !== user.id) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">You can only edit proposals that you created.</p>
            <Button onClick={() => router.push(`/proposals/${proposalId}`)} className="mt-4">
              View Proposal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/proposals/${proposalId}`)}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Proposal
          </Button>
          <h1 className="text-3xl font-bold">Edit Proposal</h1>
          <p className="text-muted-foreground mt-2">
            Make changes to your proposal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/proposals/${proposalId}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="current_cost">Current Cost ($)</Label>
                <Input
                  id="current_cost"
                  type="number"
                  step="0.01"
                  value={formData.current_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="formulation">Formulation</Label>
              <Textarea
                id="formulation"
                value={formData.formulation}
                onChange={(e) => setFormData(prev => ({ ...prev, formulation: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Objectives */}
        <Card>
          <CardHeader>
            <CardTitle>Business Objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {formData.business_objectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={objective} readOnly className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('business_objectives', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add business objective..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleArrayAdd('business_objectives', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleArrayAdd('business_objectives', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Changes */}
        <Card>
          <CardHeader>
            <CardTitle>Acceptable Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {formData.acceptable_changes.map((change, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={change} readOnly className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('acceptable_changes', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add acceptable change..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleArrayAdd('acceptable_changes', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleArrayAdd('acceptable_changes', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Not Acceptable Changes */}
        <Card>
          <CardHeader>
            <CardTitle>Not Acceptable Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {formData.not_acceptable_changes.map((change, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={change} readOnly className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('not_acceptable_changes', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add non-acceptable change..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleArrayAdd('not_acceptable_changes', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleArrayAdd('not_acceptable_changes', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}