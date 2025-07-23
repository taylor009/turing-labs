import sgMail from '@sendgrid/mail';
import { EmailOptions, EmailResult, EmailQueueJob, EmailTemplate } from '../types/email.types';

export class EmailService {
  private static instance: EmailService;
  private queue: EmailQueueJob[] = [];
  private processing = false;
  private retryDelays = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

  private constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SendGrid API key not found. Email functionality will be disabled.');
      return;
    }
    sgMail.setApiKey(apiKey);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured. Email not sent:', options.subject);
      return {
        messageId: 'mock-' + Date.now(),
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        timestamp: new Date(),
      };
    }

    const msg: any = {
      to: options.to,
      from: options.from || {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'TuringLabs',
      },
      subject: options.subject,
      text: options.text,
      html: options.html,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    };

    // Clean up undefined values
    Object.keys(msg).forEach(key => {
      if (msg[key] === undefined) {
        delete msg[key];
      }
    });

    try {
      const [response] = await sgMail.send(msg);
      
      return {
        messageId: response.headers['x-message-id'] || 'sg-' + Date.now(),
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('SendGrid error:', error);
      
      if (error.response) {
        console.error('SendGrid response error:', error.response.body);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  public async queueEmail(options: EmailOptions): Promise<string> {
    const job: EmailQueueJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      emailOptions: options,
      attempts: 0,
      maxAttempts: 5,
      status: 'pending',
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.processQueue();

    return job.id;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const pendingJobs = this.queue.filter(
        job => job.status === 'pending' && 
        (!job.nextRetry || job.nextRetry <= new Date())
      );

      if (pendingJobs.length === 0) {
        break;
      }

      const job = pendingJobs[0];
      job.status = 'processing';
      job.attempts++;
      job.lastAttempt = new Date();

      try {
        await this.sendEmail(job.emailOptions);
        job.status = 'completed';
        this.removeFromQueue(job.id);
      } catch (error: any) {
        job.error = error.message;

        if (job.attempts >= job.maxAttempts) {
          job.status = 'failed';
          console.error(`Email job ${job.id} failed after ${job.attempts} attempts:`, error);
          this.removeFromQueue(job.id);
        } else {
          job.status = 'pending';
          const delayIndex = Math.min(job.attempts - 1, this.retryDelays.length - 1);
          job.nextRetry = new Date(Date.now() + this.retryDelays[delayIndex]);
          console.warn(`Email job ${job.id} failed, retrying in ${this.retryDelays[delayIndex]}ms`);
        }
      }
    }

    this.processing = false;

    // Schedule next check if there are pending jobs
    const hasPendingJobs = this.queue.some(job => job.status === 'pending');
    if (hasPendingJobs) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private removeFromQueue(jobId: string): void {
    const index = this.queue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  public getQueueStatus(): { pending: number; processing: number; total: number } {
    const pending = this.queue.filter(job => job.status === 'pending').length;
    const processing = this.queue.filter(job => job.status === 'processing').length;
    
    return {
      pending,
      processing,
      total: this.queue.length,
    };
  }

  public async sendTemplateEmail(
    template: EmailTemplate,
    to: string | string[],
    data: Record<string, any>
  ): Promise<EmailResult> {
    const templateIds: Record<EmailTemplate, string> = {
      [EmailTemplate.STAKEHOLDER_INVITATION]: process.env.SENDGRID_TEMPLATE_INVITATION || '',
      [EmailTemplate.APPROVAL_REQUEST]: process.env.SENDGRID_TEMPLATE_APPROVAL || '',
      [EmailTemplate.STATUS_CHANGE]: process.env.SENDGRID_TEMPLATE_STATUS || '',
      [EmailTemplate.REMINDER]: process.env.SENDGRID_TEMPLATE_REMINDER || '',
      [EmailTemplate.PASSWORD_RESET]: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || '',
      [EmailTemplate.WELCOME]: process.env.SENDGRID_TEMPLATE_WELCOME || '',
    };

    const templateId = templateIds[template];
    
    // Enhance data with standard fields that work with Supabase users
    const enhancedData = {
      ...data,
      user: data.user || {},
      timestamp: new Date().toISOString(),
      appName: process.env.APP_NAME || 'TuringLabs',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };
    
    if (!templateId) {
      // Fallback to text email if template not configured
      return this.sendEmail({
        to,
        subject: this.getDefaultSubject(template),
        text: this.generateTextContent(template, enhancedData),
        html: this.generateHtmlContent(template, enhancedData),
      });
    }

    return this.sendEmail({
      to,
      templateId,
      dynamicTemplateData: enhancedData,
    });
  }

  private getDefaultSubject(template: EmailTemplate): string {
    const subjects: Record<EmailTemplate, string> = {
      [EmailTemplate.STAKEHOLDER_INVITATION]: 'You\'ve been invited as a stakeholder',
      [EmailTemplate.APPROVAL_REQUEST]: 'Approval requested for project',
      [EmailTemplate.STATUS_CHANGE]: 'Project status has changed',
      [EmailTemplate.REMINDER]: 'Reminder: Action required',
      [EmailTemplate.PASSWORD_RESET]: 'Reset your password',
      [EmailTemplate.WELCOME]: 'Welcome to TuringLabs',
    };
    return subjects[template];
  }

  private generateTextContent(template: EmailTemplate, data: Record<string, any>): string {
    // Simple text content generation
    switch (template) {
      case EmailTemplate.STAKEHOLDER_INVITATION:
        return `${data.inviterName} has invited you as a stakeholder for ${data.projectName}. Click here to view: ${data.invitationLink}`;
      case EmailTemplate.APPROVAL_REQUEST:
        return `${data.requesterName} has requested your approval for ${data.projectName}. Click here to review: ${data.approvalLink}`;
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private generateHtmlContent(template: EmailTemplate, data: Record<string, any>): string {
    // Basic HTML template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${this.getDefaultSubject(template)}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">${this.getDefaultSubject(template)}</h2>
            <div style="margin: 20px 0;">
              ${this.generateTextContent(template, data)}
            </div>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #888;">
              This email was sent by TuringLabs. If you did not expect this email, please ignore it.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = EmailService.getInstance();