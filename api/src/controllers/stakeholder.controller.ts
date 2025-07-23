import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {
  addStakeholderSchema,
  updatestakeholder_statusSchema,
  updateStakeholderSchema,
  AddStakeholderInput,
  Updatestakeholder_statusInput,
  UpdateStakeholderInput,
  StakeholderResponse,
  StakeholdersListResponse,
} from '../schemas/stakeholder.schemas';

const prisma = new PrismaClient();

// Add a stakeholder to a proposal (only proposal owner can do this)
export const addStakeholder = async (req: Request, res: Response): Promise<void> => {
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

    const validatedData = addStakeholderSchema.parse(req.body) as AddStakeholderInput;

    // Check if proposal exists and user is the owner
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // Only proposal creator, admin, or product manager can add stakeholders
    const canAddStakeholder = req.user.id === proposal.createdBy || 
                             req.user.role === 'ADMIN' || 
                             req.user.role === 'PRODUCT_MANAGER';

    if (!canAddStakeholder) {
      res.status(403).json({ error: 'Only proposal owners can add stakeholders' });
      return;
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!userExists) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Check if stakeholder already exists for this proposal
    const existingStakeholder = await prisma.stakeholder.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingStakeholder) {
      res.status(409).json({ error: 'User is already a stakeholder for this proposal' });
      return;
    }

    // Create stakeholder
    const stakeholder = await prisma.stakeholder.create({
      data: {
        proposalId,
        userId: validatedData.userId,
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

    const response: StakeholderResponse = {
      id: stakeholder.id,
      proposalId: stakeholder.proposalId,
      userId: stakeholder.userId,
      status: stakeholder.status,
      invitedAt: stakeholder.invitedAt,
      respondedAt: stakeholder.respondedAt,
      comments: stakeholder.comments,
      user: stakeholder.user,
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

    console.error('Error adding stakeholder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all stakeholders for a proposal
export const getProposalStakeholders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
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

    // Access control: only authenticated users can view stakeholders
    // Additional restrictions could be applied based on user role or relationship to proposal
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get stakeholders
    const stakeholders = await prisma.stakeholder.findMany({
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
      orderBy: { invitedAt: 'desc' },
    });

    const stakeholderResponses: StakeholderResponse[] = stakeholders.map(stakeholder => ({
      id: stakeholder.id,
      proposalId: stakeholder.proposalId,
      userId: stakeholder.userId,
      status: stakeholder.status,
      invitedAt: stakeholder.invitedAt,
      respondedAt: stakeholder.respondedAt,
      comments: stakeholder.comments,
      user: stakeholder.user,
    }));

    const response: StakeholdersListResponse = {
      data: stakeholderResponses,
      total: stakeholders.length,
      proposalId,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching stakeholders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update stakeholder status (by the stakeholder themselves)
export const updatestakeholder_status = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId, stakeholderId } = req.params;
    if (!proposalId || !stakeholderId) {
      res.status(400).json({ error: 'Proposal ID and Stakeholder ID are required' });
      return;
    }

    const validatedData = updatestakeholder_statusSchema.parse(req.body) as Updatestakeholder_statusInput;

    // Check if stakeholder exists and user is the stakeholder
    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: stakeholderId },
    });

    if (!stakeholder) {
      res.status(404).json({ error: 'Stakeholder not found' });
      return;
    }

    if (stakeholder.proposalId !== proposalId) {
      res.status(400).json({ error: 'Stakeholder does not belong to this proposal' });
      return;
    }

    // Only the stakeholder themselves can update their status
    if (stakeholder.userId !== req.user.id) {
      res.status(403).json({ error: 'You can only update your own stakeholder status' });
      return;
    }

    // Update stakeholder
    const updatedStakeholder = await prisma.stakeholder.update({
      where: { id: stakeholderId },
      data: {
        status: validatedData.status,
        comments: validatedData.comments !== undefined ? validatedData.comments : stakeholder.comments,
        respondedAt: new Date(),
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

    const response: StakeholderResponse = {
      id: updatedStakeholder.id,
      proposalId: updatedStakeholder.proposalId,
      userId: updatedStakeholder.userId,
      status: updatedStakeholder.status,
      invitedAt: updatedStakeholder.invitedAt,
      respondedAt: updatedStakeholder.respondedAt,
      comments: updatedStakeholder.comments,
      user: updatedStakeholder.user,
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

    console.error('Error updating stakeholder status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update stakeholder (by proposal owner) - mainly for comments
export const updateStakeholder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId, stakeholderId } = req.params;
    if (!proposalId || !stakeholderId) {
      res.status(400).json({ error: 'Proposal ID and Stakeholder ID are required' });
      return;
    }

    const validatedData = updateStakeholderSchema.parse(req.body) as UpdateStakeholderInput;

    // Check if stakeholder exists
    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: stakeholderId },
      include: {
        proposal: true,
      },
    });

    if (!stakeholder) {
      res.status(404).json({ error: 'Stakeholder not found' });
      return;
    }

    if (stakeholder.proposalId !== proposalId) {
      res.status(400).json({ error: 'Stakeholder does not belong to this proposal' });
      return;
    }

    // Only proposal creator, admin, or product manager can update stakeholder
    const canUpdate = req.user.id === stakeholder.proposal.createdBy || 
                     req.user.role === 'ADMIN' || 
                     req.user.role === 'PRODUCT_MANAGER';

    if (!canUpdate) {
      res.status(403).json({ error: 'Only proposal owners can update stakeholder information' });
      return;
    }

    // Update stakeholder
    const updatedStakeholder = await prisma.stakeholder.update({
      where: { id: stakeholderId },
      data: {
        comments: validatedData.comments !== undefined ? validatedData.comments : stakeholder.comments,
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

    const response: StakeholderResponse = {
      id: updatedStakeholder.id,
      proposalId: updatedStakeholder.proposalId,
      userId: updatedStakeholder.userId,
      status: updatedStakeholder.status,
      invitedAt: updatedStakeholder.invitedAt,
      respondedAt: updatedStakeholder.respondedAt,
      comments: updatedStakeholder.comments,
      user: updatedStakeholder.user,
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

    console.error('Error updating stakeholder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove stakeholder from proposal (only proposal owner can do this)
export const removeStakeholder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { proposalId, stakeholderId } = req.params;
    if (!proposalId || !stakeholderId) {
      res.status(400).json({ error: 'Proposal ID and Stakeholder ID are required' });
      return;
    }

    // Check if stakeholder exists
    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: stakeholderId },
      include: {
        proposal: true,
      },
    });

    if (!stakeholder) {
      res.status(404).json({ error: 'Stakeholder not found' });
      return;
    }

    if (stakeholder.proposalId !== proposalId) {
      res.status(400).json({ error: 'Stakeholder does not belong to this proposal' });
      return;
    }

    // Only proposal creator, admin, or product manager can remove stakeholders
    const canRemove = req.user.id === stakeholder.proposal.createdBy || 
                     req.user.role === 'ADMIN' || 
                     req.user.role === 'PRODUCT_MANAGER';

    if (!canRemove) {
      res.status(403).json({ error: 'Only proposal owners can remove stakeholders' });
      return;
    }

    // Remove stakeholder
    await prisma.stakeholder.delete({
      where: { id: stakeholderId },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing stakeholder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};