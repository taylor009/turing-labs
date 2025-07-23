import { 
  EmailTemplate, 
  StakeholderInvitationData, 
  ApprovalRequestData, 
  StatusChangeData 
} from '../types/email.types';

export interface TemplateContext {
  recipientName?: string;
  recipientEmail?: string;
  unsubscribeLink?: string;
  preferencesLink?: string;
  baseUrl?: string;
  companyName?: string;
  supportEmail?: string;
}

export class EnhancedEmailTemplates {
  private static readonly BASE_STYLES = `
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    
    /* Base styles */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      padding: 40px 20px;
      text-align: center;
    }
    
    .header-logo {
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-decoration: none;
    }
    
    .content {
      padding: 40px;
    }
    
    .content h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin: 0 0 24px 0;
      line-height: 1.3;
    }
    
    .content p {
      font-size: 16px;
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 24px 0;
      transition: background-color 0.2s ease;
    }
    
    .button:hover {
      background-color: #2563eb;
    }
    
    .button-secondary {
      background-color: #6b7280;
    }
    
    .button-secondary:hover {
      background-color: #4b5563;
    }
    
    .highlight-box {
      background-color: #f3f4f6;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-approved { background-color: #d1fae5; color: #065f46; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-changes-requested { background-color: #fef3c7; color: #92400e; }
    
    .footer {
      background-color: #f8f9fa;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0;
    }
    
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    
    .unsubscribe {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 20px;
    }
    
    .unsubscribe a {
      color: #9ca3af;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      
      .content {
        padding: 20px !important;
      }
      
      .content h1 {
        font-size: 20px !important;
      }
      
      .button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
        text-align: center !important;
      }
      
      .header {
        padding: 20px !important;
      }
    }
  `;

  static generateTemplate(
    template: EmailTemplate, 
    data: Record<string, any>,
    context: TemplateContext = {}
  ): {
    subject: string;
    html: string;
    text: string;
  } {
    const defaultContext: TemplateContext = {
      companyName: 'TuringLabs',
      supportEmail: 'support@turinglabs.com',
      baseUrl: process.env.FRONTEND_URL || 'https://app.turinglabs.com',
      unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${context.recipientEmail}`,
      preferencesLink: `${process.env.FRONTEND_URL}/preferences?email=${context.recipientEmail}`,
      ...context,
    };

    switch (template) {
      case EmailTemplate.STAKEHOLDER_INVITATION:
        return this.stakeholderInvitation(data as StakeholderInvitationData, defaultContext);
      case EmailTemplate.APPROVAL_REQUEST:
        return this.approvalRequest(data as ApprovalRequestData, defaultContext);
      case EmailTemplate.STATUS_CHANGE:
        return this.statusChange(data as StatusChangeData, defaultContext);
      case EmailTemplate.REMINDER:
        return this.reminder(data, defaultContext);
      case EmailTemplate.PASSWORD_RESET:
        return this.passwordReset(data, defaultContext);
      case EmailTemplate.WELCOME:
        return this.welcome(data, defaultContext);
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  private static stakeholderInvitation(data: StakeholderInvitationData, context: TemplateContext) {
    const subject = `🎯 You're invited to review "${data.projectName}"`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>🎯 You're Invited as a Stakeholder</h1>
              
              <p>Hi ${context.recipientName || 'there'},</p>
              
              <p>
                <strong>${data.inviterName}</strong> has invited you to review and provide feedback on 
                the <strong>${data.projectName}</strong> project proposal.
              </p>
              
              <div class="highlight-box">
                <p style="margin: 0; font-weight: 600;">As a stakeholder, you'll be able to:</p>
                <ul style="margin: 16px 0 0 0; padding-left: 20px;">
                  <li>Review the complete project proposal</li>
                  <li>Provide detailed feedback and comments</li>
                  <li>Request changes or approve the proposal</li>
                  <li>Track the project's progress in real-time</li>
                  <li>Collaborate with other stakeholders</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.invitationLink}" class="button">
                  🔍 Review Project Proposal
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                <strong>⏰ Important:</strong> This invitation will expire in ${data.expiresIn}. 
                Please review the proposal as soon as possible to ensure your input is included.
              </p>
              
              <p style="font-size: 14px; color: #6b7280;">
                Questions? Contact ${data.inviterName} directly or reply to this email.
              </p>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
🎯 You're Invited as a Stakeholder

Hi ${context.recipientName || 'there'},

${data.inviterName} has invited you to review and provide feedback on the ${data.projectName} project proposal.

As a stakeholder, you'll be able to:
• Review the complete project proposal
• Provide detailed feedback and comments
• Request changes or approve the proposal
• Track the project's progress in real-time
• Collaborate with other stakeholders

Review the project proposal: ${data.invitationLink}

⏰ Important: This invitation will expire in ${data.expiresIn}.

Questions? Contact ${data.inviterName} directly or reply to this email.

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static approvalRequest(data: ApprovalRequestData, context: TemplateContext) {
    const subject = `⏳ Approval needed for "${data.projectName}"`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>⏳ Your Approval is Requested</h1>
              
              <p>Hi ${context.recipientName || 'there'},</p>
              
              <p>
                <strong>${data.requesterName}</strong> has submitted the following project for your approval:
              </p>
              
              <div class="highlight-box">
                <h2 style="color: #3b82f6; font-size: 20px; margin: 0 0 8px 0;">
                  ${data.projectName}
                </h2>
                <p style="margin: 0; color: #6b7280;">
                  Project ready for stakeholder approval
                </p>
              </div>
              
              ${data.deadline ? `
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                  <p style="margin: 0; color: #dc2626; font-weight: 600;">
                    ⏰ Approval deadline: ${data.deadline}
                  </p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.approvalLink}" class="button">
                  📋 Review & Respond
                </a>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600;">
                  Your response options:
                </p>
                <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; color: #374151;">
                  <li>✅ <strong>Approve</strong> - Accept the proposal as presented</li>
                  <li>✏️ <strong>Request Changes</strong> - Provide feedback for revisions</li>
                  <li>❌ <strong>Reject</strong> - Decline the proposal with comments</li>
                </ul>
              </div>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
⏳ Your Approval is Requested

Hi ${context.recipientName || 'there'},

${data.requesterName} has submitted the following project for your approval:

${data.projectName}
${data.deadline ? `⏰ Approval deadline: ${data.deadline}` : ''}

Review and respond: ${data.approvalLink}

Your response options:
✅ Approve - Accept the proposal as presented
✏️ Request Changes - Provide feedback for revisions  
❌ Reject - Decline the proposal with comments

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static statusChange(data: StatusChangeData, context: TemplateContext) {
    const statusEmojis: Record<string, string> = {
      'APPROVED': '✅',
      'REJECTED': '❌',
      'CHANGES_REQUESTED': '✏️',
      'PENDING_APPROVAL': '⏳',
      'DRAFT': '📝'
    };

    const emoji = statusEmojis[data.newStatus.toUpperCase()] || '📊';
    const subject = `${emoji} "${data.projectName}" status updated`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>${emoji} Project Status Updated</h1>
              
              <p>Hi ${context.recipientName || 'there'},</p>
              
              <p>
                The status of <strong>${data.projectName}</strong> has been updated by 
                <strong>${data.changedBy}</strong>:
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 20px;">
                  <div style="text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">From</p>
                    <span class="status-badge status-${data.oldStatus.toLowerCase().replace('_', '-')}">
                      ${data.oldStatus}
                    </span>
                  </div>
                  <div style="font-size: 24px; color: #3b82f6;">→</div>
                  <div style="text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">To</p>
                    <span class="status-badge status-${data.newStatus.toLowerCase().replace('_', '-')}">
                      ${data.newStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              ${data.comments ? `
                <div class="highlight-box">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">💬 Comments from ${data.changedBy}:</p>
                  <p style="margin: 0; font-style: italic;">"${data.comments}"</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${context.baseUrl}/proposals" class="button">
                  📊 View Project Details
                </a>
              </div>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
${emoji} Project Status Updated

Hi ${context.recipientName || 'there'},

The status of ${data.projectName} has been updated by ${data.changedBy}:

From: ${data.oldStatus}
To: ${data.newStatus}

${data.comments ? `💬 Comments: "${data.comments}"` : ''}

View project details: ${context.baseUrl}/proposals

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static reminder(data: any, context: TemplateContext) {
    const subject = `⏰ Reminder: ${data.subject || 'Action required'}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>⏰ Friendly Reminder</h1>
              
              <p>Hi ${context.recipientName || 'there'},</p>
              
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e;">
                  ${data.message || 'You have a pending action that requires your attention.'}
                </p>
              </div>
              
              ${data.actionLink ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.actionLink}" class="button">
                    ${data.actionText || '👆 Take Action'}
                  </a>
                </div>
              ` : ''}
              
              <p style="font-size: 14px; color: #6b7280;">
                This is an automated reminder. If you've already completed this action, 
                please disregard this email.
              </p>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
⏰ Friendly Reminder

Hi ${context.recipientName || 'there'},

${data.message || 'You have a pending action that requires your attention.'}

${data.actionLink ? `${data.actionText || 'Take Action'}: ${data.actionLink}` : ''}

This is an automated reminder. If you've already completed this action, please disregard this email.

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static passwordReset(data: any, context: TemplateContext) {
    const subject = '🔐 Reset your password';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>🔐 Reset Your Password</h1>
              
              <p>Hi ${context.recipientName || 'there'},</p>
              
              <p>
                We received a request to reset your password. Click the button below to 
                create a new password for your account.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.resetLink}" class="button">
                  🔑 Reset Password
                </a>
              </div>
              
              <div class="highlight-box">
                <p style="margin: 0; font-size: 14px;">
                  <strong>🔒 Security Note:</strong> This link will expire in ${data.expiresIn || '1 hour'} 
                  for your security. If you didn't request this password reset, you can safely ignore this email.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                If you're having trouble with the button above, copy and paste this link into your browser:<br>
                <a href="${data.resetLink}" style="color: #3b82f6; word-break: break-all;">${data.resetLink}</a>
              </p>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
🔐 Reset Your Password

Hi ${context.recipientName || 'there'},

We received a request to reset your password.

Reset your password: ${data.resetLink}

🔒 Security Note: This link will expire in ${data.expiresIn || '1 hour'}.
If you didn't request this password reset, you can safely ignore this email.

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static welcome(data: any, context: TemplateContext) {
    const subject = `🎉 Welcome to ${context.companyName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <style>${this.BASE_STYLES}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <a href="${context.baseUrl}" class="header-logo">${context.companyName}</a>
            </div>
            
            <div class="content">
              <h1>🎉 Welcome to ${context.companyName}!</h1>
              
              <p>Hi ${data.name || context.recipientName || 'there'},</p>
              
              <p>
                We're thrilled to have you join our platform! ${context.companyName} makes 
                food product reformulation collaboration simple, transparent, and efficient.
              </p>
              
              <div class="highlight-box">
                <p style="margin: 0 0 16px 0; font-weight: 600;">🚀 Here's how to get started:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Create your first project proposal</li>
                  <li>Invite stakeholders to collaborate</li>
                  <li>Track approvals and feedback in real-time</li>
                  <li>Manage project timelines and deliverables</li>
                </ul>
              </div>
              
              ${data.loginLink ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.loginLink}" class="button">
                    🏁 Get Started
                  </a>
                </div>
              ` : ''}
              
              <p style="font-size: 14px; color: #6b7280;">
                Need help getting started? Check out our 
                <a href="${context.baseUrl}/help" style="color: #3b82f6;">help center</a> 
                or contact our support team at 
                <a href="mailto:${context.supportEmail}" style="color: #3b82f6;">${context.supportEmail}</a>.
              </p>
            </div>
            
            ${this.renderFooter(context)}
          </div>
        </body>
      </html>
    `;
    
    const text = `
🎉 Welcome to ${context.companyName}!

Hi ${data.name || context.recipientName || 'there'},

We're thrilled to have you join our platform! ${context.companyName} makes food product reformulation collaboration simple, transparent, and efficient.

🚀 Here's how to get started:
• Create your first project proposal
• Invite stakeholders to collaborate  
• Track approvals and feedback in real-time
• Manage project timelines and deliverables

${data.loginLink ? `Get started: ${data.loginLink}` : ''}

Need help? Contact us at ${context.supportEmail}

---
${context.companyName}
${context.unsubscribeLink ? `Unsubscribe: ${context.unsubscribeLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static renderFooter(context: TemplateContext): string {
    return `
      <div class="footer">
        <p>
          <strong>${context.companyName}</strong><br>
          Streamlining food product reformulation collaboration
        </p>
        
        <p>
          <a href="${context.baseUrl}">Visit Dashboard</a> • 
          <a href="mailto:${context.supportEmail}">Support</a> • 
          <a href="${context.preferencesLink}">Email Preferences</a>
        </p>
        
        ${context.unsubscribeLink ? `
          <div class="unsubscribe">
            <p>
              Don't want to receive these emails? 
              <a href="${context.unsubscribeLink}">Unsubscribe</a>
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }
}