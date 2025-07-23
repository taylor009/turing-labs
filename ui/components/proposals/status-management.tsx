'use client';

import { useState } from 'react';
import { proposals as proposalsApi } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, CheckCircle, XCircle, Clock, FileEdit, AlertTriangle } from 'lucide-react';
import { ProposalStatus } from '@/types/database.types';

interface StatusManagementProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  isCreator: boolean;
  isAdmin?: boolean;
  onStatusChanged: () => void;
}

const statusConfig = {
  DRAFT: { 
    label: 'Draft', 
    icon: FileEdit, 
    color: 'text-gray-600',
    description: 'Proposal is being prepared'
  },
  PENDING_APPROVAL: { 
    label: 'Pending Approval', 
    icon: Clock, 
    color: 'text-blue-600',
    description: 'Waiting for stakeholder approvals'
  },
  APPROVED: { 
    label: 'Approved', 
    icon: CheckCircle, 
    color: 'text-green-600',
    description: 'Proposal has been approved'
  },
  REJECTED: { 
    label: 'Rejected', 
    icon: XCircle, 
    color: 'text-red-600',
    description: 'Proposal has been rejected'
  },
  CHANGES_REQUESTED: { 
    label: 'Changes Requested', 
    icon: AlertTriangle, 
    color: 'text-orange-600',
    description: 'Stakeholders have requested changes'
  },
};

export function StatusManagement({
  proposalId,
  currentStatus,
  isCreator,
  isAdmin = false,
  onStatusChanged
}: StatusManagementProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    newStatus: ProposalStatus | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    newStatus: null,
    title: '',
    description: ''
  });

  const getAvailableStatuses = (): ProposalStatus[] => {
    if (isAdmin) {
      // Admins can change to any status
      return Object.keys(statusConfig) as ProposalStatus[];
    }

    if (isCreator) {
      switch (currentStatus) {
        case 'DRAFT':
          return ['PENDING_APPROVAL'];
        case 'PENDING_APPROVAL':
          return ['DRAFT']; // Can withdraw from approval
        case 'CHANGES_REQUESTED':
          return ['DRAFT', 'PENDING_APPROVAL']; // Can address changes or resubmit
        case 'APPROVED':
        case 'REJECTED':
          return []; // Final states, only admin can change
        default:
          return [];
      }
    }

    return []; // Non-creators can't change status directly
  };

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    // Show confirmation for certain status changes
    const requiresConfirmation = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'];
    
    if (requiresConfirmation.includes(newStatus)) {
      const config = statusConfig[newStatus];
      setConfirmDialog({
        isOpen: true,
        newStatus,
        title: `Change status to ${config.label}?`,
        description: getConfirmationMessage(newStatus)
      });
      return;
    }

    // Direct change for non-critical statuses
    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: ProposalStatus) => {
    try {
      setLoading(true);
      
      await proposalsApi.update(proposalId, { status: newStatus });
      
      const config = statusConfig[newStatus];
      toast({
        title: "Status updated",
        description: `Proposal status changed to ${config.label}.`,
      });

      onStatusChanged();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Status update failed",
        description: "Could not update proposal status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false, newStatus: null }));
    }
  };

  const getConfirmationMessage = (status: ProposalStatus): string => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'This will submit the proposal for stakeholder review. Stakeholders will be notified and can provide their approval.';
      case 'APPROVED':
        return 'This will mark the proposal as approved. This action should only be done when all necessary approvals have been received.';
      case 'REJECTED':
        return 'This will mark the proposal as rejected. This is typically done when fundamental issues cannot be resolved.';
      default:
        return 'Are you sure you want to change the status?';
    }
  };

  const availableStatuses = getAvailableStatuses();
  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;

  if (availableStatuses.length === 0) {
    // Show current status only (read-only)
    return (
      <div className="flex items-center gap-2">
        <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
        <span className="text-sm font-medium">{currentConfig.label}</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
            {currentConfig.label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {availableStatuses.map((status) => {
            if (status === currentStatus) return null;
            
            const config = statusConfig[status];
            const Icon = config.icon;
            
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                className="flex items-start gap-3 py-3"
              >
                <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {config.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.newStatus && executeStatusChange(confirmDialog.newStatus)}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}