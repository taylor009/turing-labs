import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  addStakeholder,
  getProposalStakeholders,
  updatestakeholder_status,
  updateStakeholder,
  removeStakeholder,
} from '../controllers/stakeholder.controller';

const router: Router = Router();

// All stakeholder routes require authentication
router.use(authenticateToken);

// GET /api/proposals/:proposalId/stakeholders - Get all stakeholders for a proposal
router.get('/:proposalId/stakeholders', getProposalStakeholders);

// POST /api/proposals/:proposalId/stakeholders - Add a stakeholder to a proposal
router.post('/:proposalId/stakeholders', addStakeholder);

// PUT /api/proposals/:proposalId/stakeholders/:stakeholderId/status - Update stakeholder status (by stakeholder)
router.put('/:proposalId/stakeholders/:stakeholderId/status', updatestakeholder_status);

// PUT /api/proposals/:proposalId/stakeholders/:stakeholderId - Update stakeholder info (by proposal owner)
router.put('/:proposalId/stakeholders/:stakeholderId', updateStakeholder);

// DELETE /api/proposals/:proposalId/stakeholders/:stakeholderId - Remove stakeholder from proposal
router.delete('/:proposalId/stakeholders/:stakeholderId', removeStakeholder);

export default router;