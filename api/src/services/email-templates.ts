import { 
  EmailTemplate, 
  StakeholderInvitationData, 
  ApprovalRequestData, 
  StatusChangeData 
} from '../types/email.types';

export class EmailTemplates {
  private static baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333333;
  `;

  private static buttonStyles = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    margin: 20px 0;
  `;

  static generateTemplate(template: EmailTemplate, data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    switch (template) {
      case EmailTemplate.STAKEHOLDER_INVITATION:
        return this.stakeholderInvitation(data as StakeholderInvitationData);
      case EmailTemplate.APPROVAL_REQUEST:
        return this.approvalRequest(data as ApprovalRequestData);
      case EmailTemplate.STATUS_CHANGE:
        return this.statusChange(data as StatusChangeData);
      case EmailTemplate.REMINDER:
        return this.reminder(data);
      case EmailTemplate.PASSWORD_RESET:
        return this.passwordReset(data);
      case EmailTemplate.WELCOME:
        return this.welcome(data);
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  private static stakeholderInvitation(data: StakeholderInvitationData) {
    const subject = `You've been invited to review ${data.projectName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px;">
              <h1 style="color: #1a1a1a; margin-bottom: 24px; font-size: 24px;">
                You're Invited as a Stakeholder
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 16px;">
                Hi there,
              </p>
              
              <p style="font-size: 16px; margin-bottom: 16px;">
                <strong>${data.inviterName}</strong> has invited you to review and provide feedback on 
                <strong>${data.projectName}</strong>.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                As a stakeholder, you'll be able to:
              </p>
              
              <ul style="font-size: 16px; margin-bottom: 24px;">
                <li>Review the complete project proposal</li>
                <li>Provide feedback and request changes</li>
                <li>Approve or reject the proposal</li>
                <li>Track the project's progress</li>
              </ul>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.invitationLink}" style="${this.buttonStyles}">
                  View Project Proposal
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 24px;">
                This invitation will expire in ${data.expiresIn}. If you have any questions, 
                please contact ${data.inviterName} directly.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} TuringLabs. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
You're Invited as a Stakeholder

Hi there,

${data.inviterName} has invited you to review and provide feedback on ${data.projectName}.

As a stakeholder, you'll be able to:
- Review the complete project proposal
- Provide feedback and request changes
- Approve or reject the proposal
- Track the project's progress

View the project proposal: ${data.invitationLink}

This invitation will expire in ${data.expiresIn}.

© ${new Date().getFullYear()} TuringLabs. All rights reserved.
    `.trim();
    
    return { subject, html, text };
  }

  private static approvalRequest(data: ApprovalRequestData) {
    const subject = `Approval requested for ${data.projectName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px;">
              <h1 style="color: #1a1a1a; margin-bottom: 24px; font-size: 24px;">
                Approval Requested
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 16px;">
                <strong>${data.requesterName}</strong> has requested your approval for:
              </p>
              
              <div style="background-color: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #3b82f6; font-size: 20px; margin: 0;">
                  ${data.projectName}
                </h2>
              </div>
              
              ${data.deadline ? `
                <p style="font-size: 16px; color: #dc2626; margin-bottom: 24px;">
                  <strong>Deadline:</strong> ${data.deadline}
                </p>
              ` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.approvalLink}" style="${this.buttonStyles}">
                  Review & Approve
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                You can approve, request changes, or reject this proposal.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} TuringLabs. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Approval Requested

${data.requesterName} has requested your approval for:

${data.projectName}

${data.deadline ? `Deadline: ${data.deadline}` : ''}

Review and approve: ${data.approvalLink}

You can approve, request changes, or reject this proposal.

© ${new Date().getFullYear()} TuringLabs. All rights reserved.
    `.trim();
    
    return { subject, html, text };
  }

  private static statusChange(data: StatusChangeData) {
    const subject = `Status update: ${data.projectName}`;
    
    const statusColors: Record<string, string> = {
      approved: '#10b981',
      rejected: '#ef4444',
      'changes-requested': '#f59e0b',
      pending: '#6b7280',
    };
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px;">
              <h1 style="color: #1a1a1a; margin-bottom: 24px; font-size: 24px;">
                Project Status Updated
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                The status of <strong>${data.projectName}</strong> has been updated:
              </p>
              
              <div style="background-color: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <p style="margin: 0; color: #666; font-size: 14px;">From</p>
                    <p style="margin: 4px 0; font-size: 16px; font-weight: 500;">${data.oldStatus}</p>
                  </div>
                  <div style="padding: 0 20px;">→</div>
                  <div>
                    <p style="margin: 0; color: #666; font-size: 14px;">To</p>
                    <p style="margin: 4px 0; font-size: 16px; font-weight: 500; color: ${statusColors[data.newStatus] || '#333'};">
                      ${data.newStatus}
                    </p>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                Changed by: <strong>${data.changedBy}</strong>
              </p>
              
              ${data.comments ? `
                <div style="background-color: #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Comments:</p>
                  <p style="margin: 8px 0 0 0; font-size: 16px;">${data.comments}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} TuringLabs. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Project Status Updated

The status of ${data.projectName} has been updated:

From: ${data.oldStatus}
To: ${data.newStatus}

Changed by: ${data.changedBy}
${data.comments ? `\nComments: ${data.comments}` : ''}

© ${new Date().getFullYear()} TuringLabs. All rights reserved.
    `.trim();
    
    return { subject, html, text };
  }

  private static reminder(data: any) {
    const subject = `Reminder: ${data.subject || 'Action required'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 40px;">
              <h1 style="color: #92400e; margin-bottom: 24px; font-size: 24px;">
                ⏰ Reminder
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                ${data.message || 'You have a pending action that requires your attention.'}
              </p>
              
              ${data.actionLink ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.actionLink}" style="${this.buttonStyles}">
                    ${data.actionText || 'Take Action'}
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Reminder

${data.message || 'You have a pending action that requires your attention.'}

${data.actionLink ? `${data.actionText || 'Take Action'}: ${data.actionLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }

  private static passwordReset(data: any) {
    const subject = 'Reset your password';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px;">
              <h1 style="color: #1a1a1a; margin-bottom: 24px; font-size: 24px;">
                Reset Your Password
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.resetLink}" style="${this.buttonStyles}">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                This link will expire in ${data.expiresIn || '1 hour'}. If you didn't request this, 
                you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Reset Your Password

We received a request to reset your password.

Reset your password: ${data.resetLink}

This link will expire in ${data.expiresIn || '1 hour'}.
If you didn't request this, you can safely ignore this email.
    `.trim();
    
    return { subject, html, text };
  }

  private static welcome(data: any) {
    const subject = 'Welcome to TuringLabs!';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="${this.baseStyles}">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 40px;">
              <h1 style="color: #1a1a1a; margin-bottom: 24px; font-size: 24px;">
                Welcome to TuringLabs! 🎉
              </h1>
              
              <p style="font-size: 16px; margin-bottom: 16px;">
                Hi ${data.name || 'there'},
              </p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                We're excited to have you on board! TuringLabs helps teams collaborate on 
                food product reformulation projects with ease.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                Here's how to get started:
              </p>
              
              <ul style="font-size: 16px; margin-bottom: 24px;">
                <li>Create your first project proposal</li>
                <li>Invite stakeholders to collaborate</li>
                <li>Track approvals and feedback in real-time</li>
              </ul>
              
              ${data.loginLink ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.loginLink}" style="${this.buttonStyles}">
                    Get Started
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Welcome to TuringLabs! 🎉

Hi ${data.name || 'there'},

We're excited to have you on board! TuringLabs helps teams collaborate on food product reformulation projects with ease.

Here's how to get started:
- Create your first project proposal
- Invite stakeholders to collaborate
- Track approvals and feedback in real-time

${data.loginLink ? `Get started: ${data.loginLink}` : ''}
    `.trim();
    
    return { subject, html, text };
  }
}