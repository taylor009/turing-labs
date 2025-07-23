import { z } from 'zod';
import { stakeholder_status } from '../generated/prisma';

// Schema for adding a stakeholder to a proposal
export const addStakeholderSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  comments: z.string().optional(),
});

// Schema for updating stakeholder status (used by stakeholders themselves)
export const updatestakeholder_statusSchema = z.object({
  status: z.nativeEnum(stakeholder_status, {
    message: 'Status must be PENDING, ACCEPTED, or DECLINED',
  }),
  comments: z.string().optional(),
});

// Schema for updating stakeholder by proposal owner
export const updateStakeholderSchema = z.object({
  comments: z.string().optional(),
});

// Response schema for stakeholder data
export const stakeholderResponseSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  userId: z.string(),
  status: z.nativeEnum(stakeholder_status),
  invitedAt: z.date(),
  respondedAt: z.date().nullable(),
  comments: z.string().nullable(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string(),
  }).optional(),
});

// Schema for stakeholder list response
export const stakeholdersListResponseSchema = z.object({
  data: z.array(stakeholderResponseSchema),
  total: z.number(),
  proposalId: z.string(),
});

// Type exports
export type AddStakeholderInput = z.infer<typeof addStakeholderSchema>;
export type Updatestakeholder_statusInput = z.infer<typeof updatestakeholder_statusSchema>;
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>;
export type StakeholderResponse = z.infer<typeof stakeholderResponseSchema>;
export type StakeholdersListResponse = z.infer<typeof stakeholdersListResponseSchema>;