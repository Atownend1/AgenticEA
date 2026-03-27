import * as cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './email';

export class SchedulerService {
  private morningReminderJob: cron.ScheduledTask | null = null;

  /**
   * Start the morning reminder scheduler
   * Runs every day at 8:00 AM
   */
  startMorningReminders(): void {
    // Stop existing job if running
    if (this.morningReminderJob) {
      this.morningReminderJob.stop();
    }

    // Schedule for 8:00 AM every day
    this.morningReminderJob = cron.schedule('0 8 * * *', async () => {
      await this.sendMorningReminders();
    }, {
      timezone: 'America/New_York' // Adjust timezone as needed
    });

    console.log('Morning reminder scheduler started (8:00 AM daily)');
  }

  /**
   * Stop the morning reminder scheduler
   */
  stopMorningReminders(): void {
    if (this.morningReminderJob) {
      this.morningReminderJob.stop();
      this.morningReminderJob = null;
      console.log('Morning reminder scheduler stopped');
    }
  }

  /**
   * Send morning reminders for action items due today
   */
  async sendMorningReminders(): Promise<void> {
    try {
      console.log('Running morning reminder check...');

      // Get action items due today
      const dueToday = await storage.getActionItemsDueToday();
      
      if (dueToday.length === 0) {
        console.log('No action items due today');
        await storage.addActivityLog({
          type: 'morning_reminders_checked',
          description: 'Morning reminder check completed - no action items due today',
          metadata: { dueToday: 0 }
        });
        return;
      }

      // Filter out items that already have reminders sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const itemsNeedingReminders = [];
      for (const item of dueToday) {
        const existingReminders = await storage.getRemindersByActionItem(item.id);
        const todayReminders = existingReminders.filter(reminder => {
          const reminderDate = new Date(reminder.reminderDate);
          reminderDate.setHours(0, 0, 0, 0);
          return reminderDate.getTime() === today.getTime() && reminder.sent;
        });
        
        if (todayReminders.length === 0) {
          itemsNeedingReminders.push(item);
        }
      }

      if (itemsNeedingReminders.length === 0) {
        console.log('All action items due today have already been reminded');
        await storage.addActivityLog({
          type: 'morning_reminders_checked',
          description: `Morning reminder check completed - ${dueToday.length} items due but all already reminded`,
          metadata: { dueToday: dueToday.length, alreadyReminded: true }
        });
        return;
      }

      // Group by assignee email
      const groupedByAssignee = itemsNeedingReminders.reduce((acc, item) => {
        if (!item.assigneeEmail) {
          // For items without email, use the assignee name as a fallback
          console.warn(`No email for action item "${item.title}" assigned to ${item.assignee}`);
          return acc;
        }
        
        if (!acc[item.assigneeEmail]) {
          acc[item.assigneeEmail] = [];
        }
        acc[item.assigneeEmail].push(item);
        return acc;
      }, {} as Record<string, typeof itemsNeedingReminders>);

      // Send reminder emails
      let totalSent = 0;
      const successfulRecipients = [];
      const failedRecipients = [];

      for (const [email, items] of Object.entries(groupedByAssignee)) {
        try {
          await emailService.sendMorningReminder(email, items);
          totalSent += items.length;
          successfulRecipients.push(email);

          // Create reminder records for successful sends
          for (const item of items) {
            await storage.createReminder({
              actionItemId: item.id,
              reminderDate: new Date(),
              sent: true,
            });
          }
        } catch (error) {
          console.error(`Failed to send reminder to ${email}:`, error);
          failedRecipients.push({ email, error: error instanceof Error ? error.message : 'Unknown error' });
          
          // Create reminder records for failed sends (marked as not sent)
          for (const item of items) {
            await storage.createReminder({
              actionItemId: item.id,
              reminderDate: new Date(),
              sent: false,
            });
          }
        }
      }

      // Log activity
      await storage.addActivityLog({
        type: 'morning_reminders_sent',
        description: `Morning reminders processed: ${totalSent} action items sent to ${successfulRecipients.length} recipients${failedRecipients.length > 0 ? `, ${failedRecipients.length} failed` : ''}`,
        metadata: { 
          recipientCount: successfulRecipients.length,
          actionItemCount: totalSent,
          dueToday: dueToday.length,
          itemsNeedingReminders: itemsNeedingReminders.length,
          failedRecipients: failedRecipients.length,
          successfulEmails: successfulRecipients,
          failedEmails: failedRecipients
        }
      });

      console.log(`Morning reminders sent: ${totalSent} items to ${successfulRecipients.length} people`);
      if (failedRecipients.length > 0) {
        console.log(`Failed to send reminders to ${failedRecipients.length} recipients`);
      }

    } catch (error) {
      console.error('Error sending morning reminders:', error);
      
      await storage.addActivityLog({
        type: 'morning_reminders_failed',
        description: `Failed to send morning reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Start all scheduled tasks
   */
  startAll(): void {
    this.startMorningReminders();
    console.log('All scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    this.stopMorningReminders();
    console.log('All scheduled tasks stopped');
  }

  /**
   * Check for overdue action items and update their status
   */
  async updateOverdueItems(): Promise<void> {
    try {
      const allActionItems = await storage.getAllActionItems();
      const now = new Date();
      
      let overdueCount = 0;
      for (const item of allActionItems) {
        if (
          item.dueDate && 
          new Date(item.dueDate) < now && 
          item.status !== 'completed' && 
          item.status !== 'overdue'
        ) {
          await storage.updateActionItem(item.id, { status: 'overdue' });
          overdueCount++;
        }
      }

      if (overdueCount > 0) {
        await storage.addActivityLog({
          type: 'overdue_items_updated',
          description: `Updated ${overdueCount} action items to overdue status`,
          metadata: { overdueCount }
        });
      }

    } catch (error) {
      console.error('Error updating overdue items:', error);
    }
  }

  /**
   * Run a one-time morning reminder check (for testing)
   */
  async runMorningReminderNow(): Promise<void> {
    await this.sendMorningReminders();
  }
}

export const schedulerService = new SchedulerService();
