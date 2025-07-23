import { z } from 'zod';
import { proposal_status } from '../generated/prisma';
import { commonSchemas, businessRules, querySchemas } from './common.schemas';

// Base proposal fields
export const createProposalSchema = z.object({
  productName: businessRules.projectName,
  currentCost: businessRules.productCost,
  category: z.string().min(1, 'Category is required').max(100, 'Category too long').trim(),
  formulation: z.string().min(1, 'Formulation is required').max(2000, 'Formulation too long').trim(),
  businessObjectives: commonSchemas.nonEmptyStringArray,
  priorityObjectives: z.array(z.object({
    objective: z.string().min(1, 'Objective is required').trim(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW'], { message: 'Priority must be HIGH, MEDIUM, or LOW' }),
  })).optional().default([]),
  constraints: z.record(z.string(), z.array(z.string())).optional().default({}),
  acceptableChanges: z.array(z.string()).optional().default([]),
  notAcceptableChanges: z.array(z.string()).optional().default([]),
  feasibilityLimits: z.array(z.string()).optional().default([]),
});

export const updateProposalSchema = createProposalSchema.partial().extend({
  status: z.nativeEnum(proposal_status).optional(),
});

// Query parameters for listing proposals  
export const getProposalsQuerySchema = querySchemas.listQuery.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'productName', 'status', 'currentCost']).default('createdAt'),
  status: z.nativeEnum(proposal_status).optional(),
  createdBy: commonSchemas.id.optional(),
});

// DTOs for responses
export const proposalResponseSchema = z.object({
  id: z.string(),
  productName: z.string(),
  currentCost: z.number(),
  category: z.string(),
  formulation: z.string(),
  status: z.nativeEnum(proposal_status),
  businessObjectives: z.array(z.string()),
  priorityObjectives: z.array(z.object({
    objective: z.string(),
    priority: z.string(),
  })),
  constraints: z.record(z.string(), z.array(z.string())),
  acceptableChanges: z.array(z.string()),
  notAcceptableChanges: z.array(z.string()),
  feasibilityLimits: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  creator: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
  }).optional(),
});

export const paginatedProposalsResponseSchema = z.object({
  data: z.array(proposalResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
  filters: z.object({
    status: z.nativeEnum(proposal_status).optional(),
    category: z.string().optional(),
    createdBy: z.string().optional(),
    search: z.string().optional(),
  }),
  sorting: z.object({
    sortBy: z.string(),
    sortOrder: z.enum(['asc', 'desc']),
  }),
});

// Type exports
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type GetProposalsQuery = z.infer<typeof getProposalsQuerySchema>;
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;
export type PaginatedProposalsResponse = z.infer<typeof paginatedProposalsResponseSchema>;