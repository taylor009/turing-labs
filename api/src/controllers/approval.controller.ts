import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {
  submitApprovalSchema,
  requestChangesSchema,
  approveProposalSchema,
  SubmitApprovalInput,
  RequestChangesInput,
  ApproveProposalInput,
  ApprovalResponse,
  ApprovalsListResponse,
} from '../schemas/approval.schemas';
import {
  calculateApprovalSummary,
  updateproposal_statusBasedOnApprovals,
  isUserAuthorizedToApprove,
  getOrCreateApproval,
} from '../services/approval.service';

const prisma = new PrismaClient();

// Get all approvals for a proposal
export const getProposalApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Get approvals
    const approvals = await prisma.approval.findMany({
      where: { proposalId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate summary
    const summary = await calculateApprovalSummary(proposalId);

    const approvalResponses: ApprovalResponse[] = approvals.map(approval => ({
      id: approval.id,
      proposalId: approval.proposalId,
      userId: approval.userId,
      status: approval.status,
      comments: approval.comments,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      user: approval.user || undefined,
    }));

    const response: ApprovalsListResponse = {
      data: approvalResponses,
      total: approvals.length,
      proposalId,
      summary: {
        pending: summary.pendingCount,
        approved: summary.approvedCount,
        changesRequested: summary.changesRequestedCount,
        rejected: summary.rejectedCount,
        totalStakeholders: summary.totalStakeholders,
        approvalPercentage: summary.totalStakeholders > 0 
          ? Math.round((summary.approvedCount / summary.totalStakeholders) * 100)
          : 0,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit an approval (general endpoint for any approval status)
export const submitApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const validatedData = submitApprovalSchema.parse(req.body) as SubmitApprovalInput;

    // Check if user is authorized to approve this proposal
    const isAuthorized = await isUserAuthorizedToApprove(proposalId, req.user.id);
    if (!isAuthorized) {
      res.status(403).json({ 
        error: 'You must be an accepted stakeholder to approve this proposal' 
      });
      return;
    }

    // Get or create approval record
    let approval = await getOrCreateApproval(proposalId, req.user.id);

    // Update approval
    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: validatedData.status,
        comments: validatedData.comments,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update proposal status based on all approvals
    const statusUpdate = await updateproposal_statusBasedOnApprovals(proposalId);

    const response: ApprovalResponse = {
      id: updatedApproval.id,
      proposalId: updatedApproval.proposalId,
      userId: updatedApproval.userId,
      status: updatedApproval.status,
      comments: updatedApproval.comments,
      createdAt: updatedApproval.createdAt,
      updatedAt: updatedApproval.updatedAt,
      user: updatedApproval.user,
    };

    // Include proposal status update info in response headers for client to handle
    res.set('X-Proposal-Status-Changed', statusUpdate.changed.toString());
    res.set('X-Proposal-Old-Status', statusUpdate.oldStatus);
    res.set('X-Proposal-New-Status', statusUpdate.newStatus);

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error submitting approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve proposal (convenience endpoint)
export const approveProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const validatedData = approveProposalSchema.parse(req.body) as ApproveProposalInput;

    // Check if user is authorized to approve this proposal
    const isAuthorized = await isUserAuthorizedToApprove(proposalId, req.user.id);
    if (!isAuthorized) {
      res.status(403).json({ 
        error: 'You must be an accepted stakeholder to approve this proposal' 
      });
      return;
    }

    // Get or create approval record
    let approval = await getOrCreateApproval(proposalId, req.user.id);

    // Update approval to APPROVED
    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        comments: validatedData.comments,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update proposal status based on all approvals
    const statusUpdate = await updateproposal_statusBasedOnApprovals(proposalId);

    const response: ApprovalResponse = {
      id: updatedApproval.id,
      proposalId: updatedApproval.proposalId,
      userId: updatedApproval.userId,
      status: updatedApproval.status,
      comments: updatedApproval.comments,
      createdAt: updatedApproval.createdAt,
      updatedAt: updatedApproval.updatedAt,
      user: updatedApproval.user,
    };

    res.set('X-Proposal-Status-Changed', statusUpdate.changed.toString());
    res.set('X-Proposal-Old-Status', statusUpdate.oldStatus);
    res.set('X-Proposal-New-Status', statusUpdate.newStatus);

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error approving proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request changes to proposal (convenience endpoint)
export const requestChanges = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const validatedData = requestChangesSchema.parse(req.body) as RequestChangesInput;

    // Check if user is authorized to approve this proposal
    const isAuthorized = await isUserAuthorizedToApprove(proposalId, req.user.id);
    if (!isAuthorized) {
      res.status(403).json({ 
        error: 'You must be an accepted stakeholder to request changes to this proposal' 
      });
      return;
    }

    // Get or create approval record
    let approval = await getOrCreateApproval(proposalId, req.user.id);

    // Update approval to CHANGES_REQUESTED
    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'CHANGES_REQUESTED',
        comments: validatedData.comments,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update proposal status based on all approvals
    const statusUpdate = await updateproposal_statusBasedOnApprovals(proposalId);

    const response: ApprovalResponse = {
      id: updatedApproval.id,
      proposalId: updatedApproval.proposalId,
      userId: updatedApproval.userId,
      status: updatedApproval.status,
      comments: updatedApproval.comments,
      createdAt: updatedApproval.createdAt,
      updatedAt: updatedApproval.updatedAt,
      user: updatedApproval.user,
    };

    res.set('X-Proposal-Status-Changed', statusUpdate.changed.toString());
    res.set('X-Proposal-Old-Status', statusUpdate.oldStatus);
    res.set('X-Proposal-New-Status', statusUpdate.newStatus);

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error requesting changes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get proposal status and approval summary
export const getProposalapproval_status = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Get approval summary
    const summary = await calculateApprovalSummary(proposalId);

    const response = {
      proposalId,
      currentStatus: proposal.status,
      approvalSummary: summary,
      approvalPercentage: summary.totalStakeholders > 0 
        ? Math.round((summary.approvedCount / summary.totalStakeholders) * 100)
        : 0,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error getting proposal approval status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};