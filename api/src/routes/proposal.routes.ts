import { Router } from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { user_role } from '../generated/prisma';
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
} from '../controllers/proposal.controller';
import {
  createProposalSchema,
  updateProposalSchema,
  getProposalsQuerySchema,
} from '../schemas/proposal.schemas';
import { paramSchemas } from '../schemas/common.schemas';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Proposals
 *   description: Proposal management operations
 */

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     summary: List all proposals
 *     tags: [Proposals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and formulation
 *     responses:
 *       200:
 *         description: List of proposals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer } 
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *                     hasNextPage: { type: boolean }
 *                     hasPrevPage: { type: boolean }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/proposals - List proposals (with optional filtering, sorting, pagination)
router.get('/', 
  // validateQuery(getProposalsQuerySchema), // Temporarily disabled for debugging
  optionalAuth, 
  getProposals
);

// GET /api/proposals/:id - Get specific proposal
router.get('/:id', 
  validateParams(paramSchemas.proposalId),
  optionalAuth, 
  getProposalById
);

/**
 * @swagger
 * /api/proposals:
 *   post:
 *     summary: Create a new proposal
 *     tags: [Proposals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProposal'
 *           example:
 *             productName: "Premium Dark Chocolate Bar"
 *             currentCost: 2.45
 *             category: "Premium Confectionery"
 *             formulation: "70% cocoa, organic cane sugar, cocoa butter, vanilla extract, lecithin"
 *             businessObjectives:
 *               - "Reduce manufacturing cost by 10-15%"
 *               - "Maintain premium taste profile"
 *             priorityObjectives:
 *               - objective: "Reduce manufacturing cost by 10-15%"
 *                 priority: "HIGH"
 *             constraints:
 *               "Technical Requirements":
 *                 - "Storage temperature must remain between 15-20°C"
 *                 - "Minimum 12-month shelf life required"
 *             acceptableChanges:
 *               - "Cocoa content adjustment within 5%"
 *               - "Alternative natural sweeteners"
 *             notAcceptableChanges:
 *               - "Artificial preservatives"
 *               - "Non-organic ingredients"
 *             feasibilityLimits:
 *               - "Maximum 20% cost reduction realistic"
 *               - "Minimum 6-month shelf life required"
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/proposals - Create new proposal (requires authentication)
router.post('/', 
  validateBody(createProposalSchema),
  authenticateToken, 
  createProposal
);

// PUT /api/proposals/:id - Update proposal (requires authentication and proper permissions)
router.put('/:id', 
  validateParams(paramSchemas.proposalId),
  validateBody(updateProposalSchema, { allowPartial: true }),
  authenticateToken, 
  updateProposal
);

// DELETE /api/proposals/:id - Delete proposal (requires admin or product manager role)
router.delete('/:id', 
  validateParams(paramSchemas.proposalId),
  authenticateToken, 
  requireRole([user_role.ADMIN, user_role.PRODUCT_MANAGER]), 
  deleteProposal
);

export default router;