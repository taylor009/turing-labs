export interface EmailOptions {
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: {
    email: string;
    name?: string;
  };
}

export interface EmailAttachment {
  content: string;
  filename: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  timestamp: Date;
}

export interface EmailQueueJob {
  id: string;
  emailOptions: EmailOptions;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
}

export enum EmailTemplate {
  STAKEHOLDER_INVITATION = 'stakeholder-invitation',
  APPROVAL_REQUEST = 'approval-request',
  STATUS_CHANGE = 'status-change',
  REMINDER = 'reminder',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
}

export interface StakeholderInvitationData {
  inviterName: string;
  projectName: string;
  invitationLink: string;
  expiresIn: string;
}

export interface ApprovalRequestData {
  requesterName: string;
  projectName: string;
  approvalLink: string;
  deadline?: string;
}

export interface StatusChangeData {
  projectName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  comments?: string;
}