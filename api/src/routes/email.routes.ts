import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router: Router = Router();

// Send immediate email
router.post('/send', EmailController.sendEmail);

// Queue email for later delivery
router.post('/queue', EmailController.queueEmail);

// Send template email
router.post('/send-template', EmailController.sendTemplateEmail);

// Send stakeholder invitation
router.post('/send-invitation', EmailController.sendInvitation);

// Send reminder email
router.post('/send-reminder', EmailController.sendReminder);

// Get queue status
router.get('/queue/status', EmailController.getQueueStatus);

// Preview email template
router.post('/template/preview', EmailController.previewTemplate);

export default router;