import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getProposalApprovals,
  submitApproval,
  approveProposal,
  requestChanges,
  getProposalapproval_status,
} from '../controllers/approval.controller';

const router: Router = Router();

// All approval routes require authentication
router.use(authenticateToken);

// GET /api/proposals/:proposalId/approvals - Get all approvals for a proposal
router.get('/:proposalId/approvals', getProposalApprovals);

// GET /api/proposals/:proposalId/approval-status - Get proposal approval status summary
router.get('/:proposalId/approval-status', getProposalapproval_status);

// POST /api/proposals/:proposalId/approvals - Submit an approval (general endpoint)
router.post('/:proposalId/approvals', submitApproval);

// POST /api/proposals/:proposalId/approve - Approve a proposal (convenience endpoint)
router.post('/:proposalId/approve', approveProposal);

// POST /api/proposals/:proposalId/request-changes - Request changes to a proposal
router.post('/:proposalId/request-changes', requestChanges);

export default router;