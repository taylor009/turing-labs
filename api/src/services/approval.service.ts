import { PrismaClient, proposal_status } from '../generated/prisma';

const prisma = new PrismaClient();

export interface ApprovalSummary {
  totalStakeholders: number;
  approvedCount: number;
  rejectedCount: number;
  changesRequestedCount: number;
  pendingCount: number;
}

// Calculate approval summary for a proposal
export async function calculateApprovalSummary(proposalId: string): Promise<ApprovalSummary> {
  const approvals = await prisma.approval.findMany({
    where: { proposalId },
  });

  const stakeholders = await prisma.stakeholder.findMany({
    where: { 
      proposalId,
      status: 'ACCEPTED', // Only count stakeholders who accepted the invitation
    },
  });

  return {
    totalStakeholders: stakeholders.length,
    approvedCount: approvals.filter(a => a.status === 'APPROVED').length,
    rejectedCount: approvals.filter(a => a.status === 'REJECTED').length,
    changesRequestedCount: approvals.filter(a => a.status === 'CHANGES_REQUESTED').length,
    pendingCount: stakeholders.length - approvals.length,
  };
}

// Determine what the proposal status should be based on approvals
export function determineproposal_status(summary: ApprovalSummary): {
  status: proposal_status;
  reason: string;
} {
  const { totalStakeholders, approvedCount, rejectedCount, changesRequestedCount } = summary;

  // If no stakeholders have accepted, keep as DRAFT or current status
  if (totalStakeholders === 0) {
    return {
      status: 'DRAFT',
      reason: 'No stakeholders have accepted the invitation yet',
    };
  }

  // If any stakeholder requested changes, proposal needs changes
  if (changesRequestedCount > 0) {
    return {
      status: 'CHANGES_REQUESTED',
      reason: `${changesRequestedCount} stakeholder(s) requested changes`,
    };
  }

  // If any stakeholder rejected, proposal is rejected
  if (rejectedCount > 0) {
    return {
      status: 'REJECTED',
      reason: `${rejectedCount} stakeholder(s) rejected the proposal`,
    };
  }

  // If all stakeholders approved, proposal is approved
  if (approvedCount === totalStakeholders) {
    return {
      status: 'APPROVED',
      reason: 'All stakeholders approved the proposal',
    };
  }

  // If some approved but not all, it's pending approval
  if (approvedCount > 0) {
    return {
      status: 'PENDING_APPROVAL',
      reason: `${approvedCount}/${totalStakeholders} stakeholders have approved`,
    };
  }

  // Default to pending approval
  return {
    status: 'PENDING_APPROVAL',
    reason: 'Waiting for stakeholder approvals',
  };
}

// Update proposal status based on current approvals
export async function updateproposal_statusBasedOnApprovals(proposalId: string): Promise<{
  oldStatus: proposal_status;
  newStatus: proposal_status;
  changed: boolean;
  reason: string;
  summary: ApprovalSummary;
}> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
  });

  const summary = await calculateApprovalSummary(proposalId);
  const { status: newStatus, reason } = determineproposal_status(summary);

  const changed = proposal.status !== newStatus;

  if (changed) {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: newStatus },
    });
  }

  return {
    oldStatus: proposal.status,
    newStatus,
    changed,
    reason,
    summary,
  };
}

// Check if a user is authorized to approve a specific proposal
export async function isUserAuthorizedToApprove(proposalId: string, userId: string): Promise<boolean> {
  const stakeholder = await prisma.stakeholder.findUnique({
    where: {
      proposalId_userId: {
        proposalId,
        userId,
      },
    },
  });

  // User must be an accepted stakeholder to approve
  return stakeholder !== null && stakeholder.status === 'ACCEPTED';
}

// Get or create approval record for a user and proposal
export async function getOrCreateApproval(proposalId: string, userId: string) {
  let approval = await prisma.approval.findUnique({
    where: {
      proposalId_userId: {
        proposalId,
        userId,
      },
    },
  });

  if (!approval) {
    approval = await prisma.approval.create({
      data: {
        proposalId,
        userId,
        status: 'PENDING',
      },
    });
  }

  return approval;
}