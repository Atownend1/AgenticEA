import nodemailer from 'nodemailer';
import { type ActionItem } from '@shared/schema';
import { storage } from './storage';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter(): void {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('SMTP credentials not configured. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter(emailConfig);
      console.log('Email transporter configured successfully');
    } catch (error) {
      console.error('Failed to setup email transporter:', error);
    }
  }

  /**
   * Send morning reminder email for due action items
   */
  async sendMorningReminder(recipientEmail: string, actionItems: ActionItem[]): Promise<void> {
    if (!this.transporter) {
      console.log('Email transporter not configured, skipping email notification');
      return;
    }

    const subject = `Daily Action Items Reminder - ${actionItems.length} item${actionItems.length > 1 ? 's' : ''} due today`;
    
    const html = this.generateMorningReminderHtml(actionItems);
    
    try {
      await this.transporter.sendMail({
        from: `"Meeting Intelligence Hub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject,
        html,
      });

      await storage.updateIntegrationStatus('email', {
        status: 'connected',
        errorMessage: null
      });

      console.log(`Morning reminder sent to ${recipientEmail} for ${actionItems.length} action items`);
    } catch (error) {
      console.error(`Failed to send morning reminder to ${recipientEmail}:`, error);
      
      await storage.updateIntegrationStatus('email', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Generate HTML for morning reminder email
   */
  private generateMorningReminderHtml(actionItems: ActionItem[]): string {
    const itemsHtml = actionItems.map(item => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background-color: #f9fafb;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px; font-weight: 600;">${item.title}</h3>
        ${item.description ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${item.description}</p>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #6b7280;">
          <span>Due: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}</span>
          <span style="background-color: ${this.getStatusColor(item.status)}; color: white; padding: 4px 8px; border-radius: 4px;">
            ${item.status.toUpperCase()}
          </span>
        </div>
        ${item.deliverable ? `<p style="margin: 8px 0 0 0; color: #374151; font-size: 13px;"><strong>Deliverable:</strong> ${item.deliverable}</p>` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Action Items Reminder</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; background-color: #3b82f6; border-radius: 12px; margin-bottom: 16px; position: relative;">
              <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 20px;">🤖</span>
            </div>
            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">Good Morning!</h1>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 16px;">You have ${actionItems.length} action item${actionItems.length > 1 ? 's' : ''} due today</p>
          </div>

          <div style="margin-bottom: 32px;">
            ${itemsHtml}
          </div>

          <div style="text-align: center; padding: 24px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">Ready to tackle these tasks? Click below to access your dashboard.</p>
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Open Dashboard
            </a>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">This reminder was sent by Meeting Intelligence Hub</p>
            <p style="margin: 4px 0 0 0;">Powered by Fireflies.ai and Notion automation</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get status color for action items
   */
  private getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(recipientEmail: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.transporter.sendMail({
        from: `"Meeting Intelligence Hub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: 'Test Email - Meeting Intelligence Hub',
        html: `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>Email Configuration Test</h2>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p>If you received this email, your Meeting Intelligence Hub is properly configured to send notifications.</p>
          </div>
        `,
      });

      console.log(`Test email sent successfully to ${recipientEmail}`);
    } catch (error) {
      console.error(`Failed to send test email to ${recipientEmail}:`, error);
      throw error;
    }
  }

  /**
   * Check email service connection
   */
  async checkConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection check failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
