import { PrismaClient } from '../generated/prisma';
import { EnhancedEmailTemplates, TemplateContext } from './enhanced-email-templates';
import { EmailTemplate, EmailOptions } from '../types/email.types';

const prisma = new PrismaClient();

// Simple email sender (replace with actual email service implementation)
const sendEmail = async (options: EmailOptions): Promise<void> => {
  // In a real implementation, this would use SendGrid, SES, etc.
  console.log('Sending email:', {
    to: options.to,
    subject: options.subject,
    // Don't log full HTML/text for brevity
  });
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 100));
};

export interface NotificationPreferences {
  stakeholderInvitations: boolean;
  approvalRequests: boolean;
  statusChanges: boolean;
  reminders: boolean;
}

export class NotificationService {

  // Send stakeholder invitation notification
  static async sendStakeholderInvitation(data: {
    proposalId: string;
    stakeholderId: string;
    inviterUserId: string;
  }): Promise<void> {
    try {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { id: data.stakeholderId },
        include: {
          user: true,
          proposal: {
            include: {
              creator: true,
            },
          },
        },
      });

      if (!stakeholder) {
        throw new Error('Stakeholder not found');
      }

      const inviter = stakeholder.proposal.creator;
      const recipient = stakeholder.user;

      // Check notification preferences (would be stored in user preferences)
      // For now, using default preferences

      const templateData = {
        inviterName: inviter.name,
        projectName: stakeholder.proposal.productName,
        invitationLink: `${process.env.FRONTEND_URL}/proposals/${data.proposalId}/review`,
        expiresIn: '14 days',
      };

      const context: TemplateContext = {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
      };

      const emailContent = EnhancedEmailTemplates.generateTemplate(
        EmailTemplate.STAKEHOLDER_INVITATION,
        templateData,
        context
      );

      await sendEmail({
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Stakeholder invitation sent to ${recipient.email} for proposal ${data.proposalId}`);
    } catch (error) {
      console.error('Failed to send stakeholder invitation:', error);
      throw error;
    }
  }

  // Send approval request notification
  static async sendApprovalRequest(data: {
    proposalId: string;
    requesterUserId: string;
    stakeholderUserIds?: string[];
  }): Promise<void> {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: data.proposalId },
        include: {
          creator: true,
          stakeholders: {
            where: { status: 'ACCEPTED' },
            include: { user: true },
          },
        },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const requester = proposal.creator;
      const stakeholders = data.stakeholderUserIds 
        ? proposal.stakeholders.filter(s => data.stakeholderUserIds!.includes(s.userId))
        : proposal.stakeholders;

      const templateData = {
        requesterName: requester.name,
        projectName: proposal.productName,
        approvalLink: `${process.env.FRONTEND_URL}/proposals/${data.proposalId}/approve`,
        deadline: undefined, // Could be set from proposal data
      };

      // Send to each stakeholder
      const emailPromises = stakeholders.map(async (stakeholder) => {
        const context: TemplateContext = {
          recipientName: stakeholder.user.name,
          recipientEmail: stakeholder.user.email,
        };

        const emailContent = EnhancedEmailTemplates.generateTemplate(
          EmailTemplate.APPROVAL_REQUEST,
          templateData,
          context
        );

        return sendEmail({
          to: stakeholder.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      });

      await Promise.all(emailPromises);

      console.log(`Approval request sent to ${stakeholders.length} stakeholders for proposal ${data.proposalId}`);
    } catch (error) {
      console.error('Failed to send approval request:', error);
      throw error;
    }
  }

  // Send status change notification
  static async sendStatusChangeNotification(data: {
    proposalId: string;
    oldStatus: string;
    newStatus: string;
    changedByUserId: string;
    comments?: string;
  }): Promise<void> {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: data.proposalId },
        include: {
          creator: true,
          stakeholders: {
            where: { status: 'ACCEPTED' },
            include: { user: true },
          },
        },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const changedBy = await prisma.user.findUnique({
        where: { id: data.changedByUserId },
      });

      if (!changedBy) {
        throw new Error('User who changed status not found');
      }

      const templateData = {
        projectName: proposal.productName,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        changedBy: changedBy.name,
        comments: data.comments,
      };

      // Notify proposal creator and all accepted stakeholders
      const recipients = [proposal.creator, ...proposal.stakeholders.map(s => s.user)]
        .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index) // Remove duplicates
        .filter(user => user.id !== data.changedByUserId); // Don't notify the person who made the change

      const emailPromises = recipients.map(async (user) => {
        const context: TemplateContext = {
          recipientName: user.name,
          recipientEmail: user.email,
        };

        const emailContent = EnhancedEmailTemplates.generateTemplate(
          EmailTemplate.STATUS_CHANGE,
          templateData,
          context
        );

        return sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      });

      await Promise.all(emailPromises);

      console.log(`Status change notification sent to ${recipients.length} users for proposal ${data.proposalId}`);
    } catch (error) {
      console.error('Failed to send status change notification:', error);
      throw error;
    }
  }

  // Send reminder notification
  static async sendReminderNotification(data: {
    userId: string;
    subject: string;
    message: string;
    actionLink?: string;
    actionText?: string;
  }): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const templateData = {
        subject: data.subject,
        message: data.message,
        actionLink: data.actionLink,
        actionText: data.actionText,
      };

      const context: TemplateContext = {
        recipientName: user.name,
        recipientEmail: user.email,
      };

      const emailContent = EnhancedEmailTemplates.generateTemplate(
        EmailTemplate.REMINDER,
        templateData,
        context
      );

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Reminder notification sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send reminder notification:', error);
      throw error;
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(data: {
    userId: string;
  }): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const templateData = {
        name: user.name,
        loginLink: `${process.env.FRONTEND_URL}/login`,
      };

      const context: TemplateContext = {
        recipientName: user.name,
        recipientEmail: user.email,
      };

      const emailContent = EnhancedEmailTemplates.generateTemplate(
        EmailTemplate.WELCOME,
        templateData,
        context
      );

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(data: {
    userId: string;
    resetToken: string;
  }): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const templateData = {
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}`,
        expiresIn: '1 hour',
      };

      const context: TemplateContext = {
        recipientName: user.name,
        recipientEmail: user.email,
      };

      const emailContent = EnhancedEmailTemplates.generateTemplate(
        EmailTemplate.PASSWORD_RESET,
        templateData,
        context
      );

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  // Batch notification for multiple users
  static async sendBatchNotification(data: {
    userIds: string[];
    template: EmailTemplate;
    templateData: Record<string, any>;
    subject?: string;
  }): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: data.userIds } },
      });

      const emailPromises = users.map(async (user) => {
        const context: TemplateContext = {
          recipientName: user.name,
          recipientEmail: user.email,
        };

        const emailContent = EnhancedEmailTemplates.generateTemplate(
          data.template,
          data.templateData,
          context
        );

        return sendEmail({
          to: user.email,
          subject: data.subject || emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      });

      await Promise.all(emailPromises);

      console.log(`Batch notification sent to ${users.length} users using template ${data.template}`);
    } catch (error) {
      console.error('Failed to send batch notification:', error);
      throw error;
    }
  }
}