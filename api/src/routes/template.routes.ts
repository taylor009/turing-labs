import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { user_role } from '../generated/prisma';
import {
  previewTemplate,
  listTemplates,
  previewAllTemplates,
  testTemplate,
  testAllTemplates,
  validateTemplateData,
} from '../controllers/template.controller';

const router: Router = Router();

// All template management routes require admin or product manager access
router.use(authenticateToken);
router.use(requireRole([user_role.ADMIN, user_role.PRODUCT_MANAGER]));

// GET /api/templates - List all available templates
router.get('/', listTemplates);

// POST /api/templates/preview-all - Preview all templates with optional context
router.post('/preview-all', previewAllTemplates);

// GET /api/templates/test - Test all templates
router.get('/test', testAllTemplates);

// GET /api/templates/:template/preview - Preview specific template with sample data
router.get('/:template/preview', previewTemplate);

// POST /api/templates/:template/preview - Preview specific template with custom data
router.post('/:template/preview', previewTemplate);

// GET /api/templates/:template/test - Test specific template
router.get('/:template/test', testTemplate);

// POST /api/templates/:template/validate - Validate template data
router.post('/:template/validate', validateTemplateData);

export default router;