import { z } from 'zod';
import { approval_status } from '../generated/prisma';

// Schema for submitting an approval
export const submitApprovalSchema = z.object({
  status: z.nativeEnum(approval_status, {
    message: 'Status must be PENDING, APPROVED, CHANGES_REQUESTED, or REJECTED',
  }),
  comments: z.string().optional(),
});

// Schema for requesting changes (simplified for specific endpoint)
export const requestChangesSchema = z.object({
  comments: z.string().min(1, 'Comments are required when requesting changes'),
});

// Schema for approving proposal (simplified for specific endpoint)
export const approveProposalSchema = z.object({
  comments: z.string().optional(),
});

// Response schema for approval data
export const approvalResponseSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  userId: z.string(),
  status: z.nativeEnum(approval_status),
  comments: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string(),
  }).optional(),
});

// Schema for approval list response
export const approvalsListResponseSchema = z.object({
  data: z.array(approvalResponseSchema),
  total: z.number(),
  proposalId: z.string(),
  summary: z.object({
    pending: z.number(),
    approved: z.number(),
    changesRequested: z.number(),
    rejected: z.number(),
    totalStakeholders: z.number(),
    approvalPercentage: z.number(),
  }),
});

// Schema for proposal status update response
export const proposalStatusUpdateResponseSchema = z.object({
  proposalId: z.string(),
  oldStatus: z.string(),
  newStatus: z.string(),
  trigger: z.string(), // What caused the status change
  approvalSummary: z.object({
    totalStakeholders: z.number(),
    approvedCount: z.number(),
    rejectedCount: z.number(),
    changesRequestedCount: z.number(),
    pendingCount: z.number(),
  }),
});

// Type exports
export type SubmitApprovalInput = z.infer<typeof submitApprovalSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type ApproveProposalInput = z.infer<typeof approveProposalSchema>;
export type ApprovalResponse = z.infer<typeof approvalResponseSchema>;
export type ApprovalsListResponse = z.infer<typeof approvalsListResponseSchema>;
export type proposal_statusUpdateResponse = z.infer<typeof proposalStatusUpdateResponseSchema>;