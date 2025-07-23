import { EnhancedEmailTemplates, TemplateContext } from './enhanced-email-templates';
import { EmailTemplate } from '../types/email.types';

export interface TemplatePreviewData {
  template: EmailTemplate;
  sampleData: Record<string, any>;
  context: TemplateContext;
}

export class TemplateManager {
  private static sampleData: Record<EmailTemplate, any> = {
    [EmailTemplate.STAKEHOLDER_INVITATION]: {
      inviterName: 'Sarah Johnson',
      projectName: 'Organic Pasta Reformulation',
      invitationLink: 'https://app.turinglabs.com/invitations/abc123',
      expiresIn: '7 days',
    },
    [EmailTemplate.APPROVAL_REQUEST]: {
      requesterName: 'Mike Chen',
      projectName: 'Low-Sodium Bread Recipe',
      approvalLink: 'https://app.turinglabs.com/approvals/def456',
      deadline: 'Friday, March 15, 2024',
    },
    [EmailTemplate.STATUS_CHANGE]: {
      projectName: 'Gluten-Free Pizza Dough',
      oldStatus: 'PENDING_APPROVAL',
      newStatus: 'APPROVED',
      changedBy: 'Alex Rivera',
      comments: 'All stakeholders have approved the reformulation plan. Great work team!',
    },
    [EmailTemplate.REMINDER]: {
      subject: 'Pending approval for Quinoa Salad Mix',
      message: 'You have a pending approval request that expires in 2 days. Please review the proposal when you have a moment.',
      actionLink: 'https://app.turinglabs.com/approvals/ghi789',
      actionText: 'Review Proposal',
    },
    [EmailTemplate.PASSWORD_RESET]: {
      resetLink: 'https://app.turinglabs.com/reset-password?token=xyz789',
      expiresIn: '1 hour',
    },
    [EmailTemplate.WELCOME]: {
      name: 'Taylor Smith',
      loginLink: 'https://app.turinglabs.com/login',
    },
  };

  private static defaultContext: TemplateContext = {
    recipientName: 'Taylor Smith',
    recipientEmail: 'taylor.smith@example.com',
    companyName: 'TuringLabs',
    supportEmail: 'support@turinglabs.com',
    baseUrl: 'https://app.turinglabs.com',
    unsubscribeLink: 'https://app.turinglabs.com/unsubscribe?email=taylor.smith@example.com',
    preferencesLink: 'https://app.turinglabs.com/preferences?email=taylor.smith@example.com',
  };

  /**
   * Generate a template with provided or sample data
   */
  static generateTemplate(
    template: EmailTemplate,
    data?: Record<string, any>,
    context?: TemplateContext
  ) {
    const templateData = data || this.sampleData[template];
    const templateContext = { ...this.defaultContext, ...context };

    return EnhancedEmailTemplates.generateTemplate(template, templateData, templateContext);
  }

  /**
   * Get sample data for a template (useful for testing)
   */
  static getSampleData(template: EmailTemplate) {
    return this.sampleData[template];
  }

  /**
   * Get all available templates
   */
  static getAvailableTemplates(): EmailTemplate[] {
    return Object.values(EmailTemplate);
  }

  /**
   * Generate preview data for all templates
   */
  static generateAllPreviews(context?: TemplateContext): TemplatePreviewData[] {
    const templateContext = { ...this.defaultContext, ...context };

    return this.getAvailableTemplates().map(template => ({
      template,
      sampleData: this.sampleData[template],
      context: templateContext,
    }));
  }

  /**
   * Test template generation (useful for debugging)
   */
  static testTemplate(template: EmailTemplate): {
    success: boolean;
    error?: string;
    result?: ReturnType<typeof EnhancedEmailTemplates.generateTemplate>;
  } {
    try {
      const result = this.generateTemplate(template);
      
      // Basic validation
      if (!result.subject || !result.html || !result.text) {
        throw new Error('Template generation resulted in missing content');
      }

      if (result.html.length < 100) {
        throw new Error('HTML content appears too short');
      }

      if (result.text.length < 50) {
        throw new Error('Text content appears too short');
      }

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test all templates
   */
  static testAllTemplates(): Record<EmailTemplate, ReturnType<typeof TemplateManager.testTemplate>> {
    const results: Record<string, any> = {};

    for (const template of this.getAvailableTemplates()) {
      results[template] = this.testTemplate(template);
    }

    return results as Record<EmailTemplate, ReturnType<typeof TemplateManager.testTemplate>>;
  }

  /**
   * Validate template data against expected structure
   */
  static validateTemplateData(template: EmailTemplate, data: Record<string, any>): {
    valid: boolean;
    missingFields: string[];
    extraFields: string[];
  } {
    const sampleData = this.sampleData[template];
    const requiredFields = Object.keys(sampleData);
    const providedFields = Object.keys(data);

    const missingFields = requiredFields.filter(field => !(field in data));
    const extraFields = providedFields.filter(field => !(field in sampleData));

    return {
      valid: missingFields.length === 0,
      missingFields,
      extraFields,
    };
  }

  /**
   * Get template metadata
   */
  static getTemplateMetadata(template: EmailTemplate): {
    name: string;
    description: string;
    requiredFields: string[];
    category: 'notification' | 'authentication' | 'system';
  } {
    const metadata: Record<EmailTemplate, any> = {
      [EmailTemplate.STAKEHOLDER_INVITATION]: {
        name: 'Stakeholder Invitation',
        description: 'Sent when a user is invited to be a stakeholder on a project',
        requiredFields: ['inviterName', 'projectName', 'invitationLink', 'expiresIn'],
        category: 'notification',
      },
      [EmailTemplate.APPROVAL_REQUEST]: {
        name: 'Approval Request',
        description: 'Sent when a project requires stakeholder approval',
        requiredFields: ['requesterName', 'projectName', 'approvalLink'],
        category: 'notification',
      },
      [EmailTemplate.STATUS_CHANGE]: {
        name: 'Status Change Notification',
        description: 'Sent when a project status changes',
        requiredFields: ['projectName', 'oldStatus', 'newStatus', 'changedBy'],
        category: 'notification',
      },
      [EmailTemplate.REMINDER]: {
        name: 'Reminder Email',
        description: 'Generic reminder for pending actions',
        requiredFields: ['message'],
        category: 'system',
      },
      [EmailTemplate.PASSWORD_RESET]: {
        name: 'Password Reset',
        description: 'Sent when a user requests a password reset',
        requiredFields: ['resetLink'],
        category: 'authentication',
      },
      [EmailTemplate.WELCOME]: {
        name: 'Welcome Email',
        description: 'Sent to new users upon registration',
        requiredFields: [],
        category: 'system',
      },
    };

    return metadata[template];
  }
}