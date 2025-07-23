import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email.service';
import { EmailTemplates } from '../services/email-templates';
import { EmailTemplate } from '../types/email.types';

export class EmailController {
  static async sendEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { to, subject, text, html } = req.body;

      if (!to || !subject || (!text && !html)) {
        return res.status(400).json({
          error: 'Missing required fields: to, subject, and either text or html',
        });
      }

      const result = await emailService.sendEmail({
        to,
        subject,
        text,
        html,
      });

      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        timestamp: result.timestamp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async queueEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const emailOptions = req.body;

      if (!emailOptions.to) {
        return res.status(400).json({
          error: 'Missing required field: to',
        });
      }

      const jobId = await emailService.queueEmail(emailOptions);

      return res.status(202).json({
        success: true,
        jobId,
        message: 'Email queued for delivery',
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendTemplateEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { template, to, data } = req.body;

      if (!template || !to || !data) {
        return res.status(400).json({
          error: 'Missing required fields: template, to, and data',
        });
      }

      if (!Object.values(EmailTemplate).includes(template)) {
        return res.status(400).json({
          error: `Invalid template. Must be one of: ${Object.values(EmailTemplate).join(', ')}`,
        });
      }

      const result = await emailService.sendTemplateEmail(template, to, data);

      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        timestamp: result.timestamp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendInvitation(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { to, inviterName, projectName, invitationLink, expiresIn = '7 days' } = req.body;

      if (!to || !inviterName || !projectName || !invitationLink) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const result = await emailService.sendTemplateEmail(
        EmailTemplate.STAKEHOLDER_INVITATION,
        to,
        { inviterName, projectName, invitationLink, expiresIn }
      );

      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendReminder(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { to, subject, message, actionLink, actionText } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          error: 'Missing required fields: to and message',
        });
      }

      const result = await emailService.sendTemplateEmail(
        EmailTemplate.REMINDER,
        to,
        { subject, message, actionLink, actionText }
      );

      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQueueStatus(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const status = emailService.getQueueStatus();
      
      return res.status(200).json({
        success: true,
        queue: status,
      });
    } catch (error) {
      next(error);
    }
  }

  static async previewTemplate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { template, data } = req.body;

      if (!template || !data) {
        return res.status(400).json({
          error: 'Missing required fields: template and data',
        });
      }

      if (!Object.values(EmailTemplate).includes(template)) {
        return res.status(400).json({
          error: `Invalid template. Must be one of: ${Object.values(EmailTemplate).join(', ')}`,
        });
      }

      const emailContent = EmailTemplates.generateTemplate(template, data);

      return res.status(200).json({
        success: true,
        preview: emailContent,
      });
    } catch (error) {
      next(error);
    }
  }
}