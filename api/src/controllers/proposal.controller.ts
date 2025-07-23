import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {
  createProposalSchema,
  updateProposalSchema,
  getProposalsQuerySchema,
  CreateProposalInput,
  UpdateProposalInput,
  GetProposalsQuery,
  ProposalResponse,
  PaginatedProposalsResponse,
} from '../schemas/proposal.schemas';

const prisma = new PrismaClient();

export const createProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const validatedData = createProposalSchema.parse(req.body) as CreateProposalInput;

    const proposal = await prisma.proposal.create({
      data: {
        product_name: validatedData.productName,
        current_cost: validatedData.currentCost,
        category: validatedData.category,
        formulation: validatedData.formulation,
        business_objectives: validatedData.businessObjectives,
        priority_objectives: validatedData.priorityObjectives,
        constraints: validatedData.constraints,
        acceptable_changes: validatedData.acceptableChanges,
        not_acceptable_changes: validatedData.notAcceptableChanges,
        feasibility_limits: validatedData.feasibilityLimits,
        created_by: req.user.id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const response: ProposalResponse = {
      id: proposal.id,
      productName: proposal.product_name,
      currentCost: proposal.current_cost,
      category: proposal.category,
      formulation: proposal.formulation,
      status: proposal.status,
      businessObjectives: proposal.business_objectives as string[],
      priorityObjectives: proposal.priority_objectives as Array<{objective: string, priority: string}>,
      constraints: proposal.constraints as Record<string, string[]>,
      acceptableChanges: proposal.acceptable_changes as string[],
      notAcceptableChanges: proposal.not_acceptable_changes as string[],
      feasibilityLimits: proposal.feasibility_limits as string[],
      createdBy: proposal.created_by,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      creator: proposal.users,
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('getProposals called with query:', req.query);
    console.log('req.user:', req.user);
    
    // Use default values for now (we'll fix validation later)
    const query = req.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sortByParam = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    // Map sortBy from camelCase to snake_case for database
    const sortByMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'productName': 'product_name',
      'currentCost': 'current_cost',
      'status': 'status'
    };
    const sortBy = sortByMapping[sortByParam] || 'created_at';
    const status = query.status;
    const category = query.category;
    const createdBy = query.createdBy;
    const search = query.search;
    
    console.log('Parsed query params:', { page, limit, sortByParam, sortBy, sortOrder, status, category, createdBy, search });

    // Build where clause
    const where: any = { AND: [] };
    
    if (status) {
      where.AND.push({ status });
    }
    
    if (category) {
      where.AND.push({ category: { contains: category, mode: 'insensitive' } });
    }
    
    if (createdBy) {
      where.AND.push({ created_by: createdBy });
    }
    
    if (search) {
      where.AND.push({
        OR: [
          { product_name: { contains: search, mode: 'insensitive' } },
          { formulation: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Access control based on user role
    if (!req.user) {
      // Unauthenticated users can only see approved proposals
      where.AND.push({ status: 'APPROVED' });
    } else if (req.user.role === 'STAKEHOLDER') {
      // Stakeholders can see approved proposals OR their own proposals
      where.AND.push({
        OR: [
          { status: 'APPROVED' },
          { created_by: req.user.id }
        ]
      });
    }
    // Admin and Product Managers can see all proposals (no additional filter)
    
    // If no conditions, remove the AND array
    const finalWhere = where.AND.length > 0 ? where : {};

    // Calculate pagination
    const skip = (page - 1) * limit;
    console.log('WHERE clause:', JSON.stringify(finalWhere, null, 2));

    // Get total count for pagination
    console.log('Getting count...');
    const totalCount = await prisma.proposal.count({ where: finalWhere });
    console.log('Total count:', totalCount);

    // Fetch proposals
    console.log('Fetching proposals...');
    const proposals = await prisma.proposal.findMany({
      where: finalWhere,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const proposalResponses: ProposalResponse[] = proposals.map(proposal => ({
      id: proposal.id,
      productName: proposal.product_name,
      currentCost: proposal.current_cost,
      category: proposal.category,
      formulation: proposal.formulation,
      status: proposal.status,
      businessObjectives: proposal.business_objectives as string[],
      priorityObjectives: proposal.priority_objectives as Array<{objective: string, priority: string}>,
      constraints: proposal.constraints as Record<string, string[]>,
      acceptableChanges: proposal.acceptable_changes as string[],
      notAcceptableChanges: proposal.not_acceptable_changes as string[],
      feasibilityLimits: proposal.feasibility_limits as string[],
      createdBy: proposal.created_by,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      creator: proposal.users,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const response: PaginatedProposalsResponse = {
      data: proposalResponses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        status,
        category,
        createdBy,
        search,
      },
      sorting: {
        sortBy: sortByParam,
        sortOrder,
      },
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
      return;
    }

    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProposalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        stakeholders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Access control: non-authenticated users and stakeholders can only see approved proposals
    if ((!req.user || req.user.role === 'STAKEHOLDER') && proposal.status !== 'APPROVED') {
      // Unless they are the creator or a stakeholder in the proposal
      if (!req.user || (req.user.id !== proposal.createdBy && !proposal.stakeholders.some(s => s.userId === req.user!.id))) {
        res.status(404).json({ error: 'Proposal not found' });
        return;
      }
    }

    const response: ProposalResponse & { stakeholders?: any[]; approvals?: any[] } = {
      id: proposal.id,
      productName: proposal.product_name,
      currentCost: proposal.current_cost,
      category: proposal.category,
      formulation: proposal.formulation,
      status: proposal.status,
      businessObjectives: proposal.business_objectives as string[],
      priorityObjectives: proposal.priority_objectives as Array<{objective: string, priority: string}>,
      constraints: proposal.constraints as Record<string, string[]>,
      acceptableChanges: proposal.acceptable_changes as string[],
      notAcceptableChanges: proposal.not_acceptable_changes as string[],
      feasibilityLimits: proposal.feasibility_limits as string[],
      createdBy: proposal.created_by,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      creator: proposal.users,
      stakeholders: proposal.stakeholders,
      approvals: proposal.approvals,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const validatedData = updateProposalSchema.parse(req.body) as UpdateProposalInput;

    // Check if proposal exists and user has permission to edit
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!existingProposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Permission check: only creator, admin, or product manager can update
    const canUpdate = req.user.id === existingProposal.createdBy || 
                     req.user.role === 'ADMIN' || 
                     req.user.role === 'PRODUCT_MANAGER';

    if (!canUpdate) {
      res.status(403).json({ error: 'Insufficient permissions to update this proposal' });
      return;
    }

    // Filter out undefined values from the update data
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const response: ProposalResponse = {
      id: updatedProposal.id,
      productName: updatedProposal.product_name,
      currentCost: updatedProposal.current_cost,
      category: updatedProposal.category,
      formulation: updatedProposal.formulation,
      status: updatedProposal.status,
      businessObjectives: updatedProposal.business_objectives as string[],
      priorityObjectives: updatedProposal.priority_objectives as Array<{objective: string, priority: string}>,
      constraints: updatedProposal.constraints as Record<string, string[]>,
      acceptableChanges: updatedProposal.acceptable_changes as string[],
      notAcceptableChanges: updatedProposal.not_acceptable_changes as string[],
      feasibilityLimits: updatedProposal.feasibility_limits as string[],
      createdBy: updatedProposal.created_by,
      createdAt: updatedProposal.createdAt,
      updatedAt: updatedProposal.updatedAt,
      creator: updatedProposal.users,
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!existingProposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Delete the proposal (cascading deletes will handle related records)
    await prisma.proposal.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};