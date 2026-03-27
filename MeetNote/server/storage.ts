import { type User, type InsertUser, type Meeting, type InsertMeeting, type ActionItem, type InsertActionItem, type Reminder, type InsertReminder, type IntegrationStatus, type ActivityLog, type InsertActivityLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Meeting methods
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetingByFirefliesId(firefliesId: string): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<Meeting>): Promise<Meeting | undefined>;

  // Action item methods
  getActionItem(id: string): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]>;
  getActionItemsDueToday(): Promise<ActionItem[]>;
  getPendingActionItems(): Promise<ActionItem[]>;
  getAllActionItems(): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: string, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined>;

  // Reminder methods
  getReminder(id: string): Promise<Reminder | undefined>;
  getRemindersByActionItem(actionItemId: string): Promise<Reminder[]>;
  getUnsentReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined>;

  // Integration status methods
  getIntegrationStatus(service: string): Promise<IntegrationStatus | undefined>;
  getAllIntegrationStatuses(): Promise<IntegrationStatus[]>;
  updateIntegrationStatus(service: string, status: Partial<IntegrationStatus>): Promise<IntegrationStatus>;

  // Activity log methods
  addActivityLog(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;

  // Stats methods
  getStats(): Promise<{
    totalMeetings: number;
    pendingActions: number;
    completedActions: number;
    processingQueue: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private meetings: Map<string, Meeting>;
  private actionItems: Map<string, ActionItem>;
  private reminders: Map<string, Reminder>;
  private integrationStatuses: Map<string, IntegrationStatus>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.users = new Map();
    this.meetings = new Map();
    this.actionItems = new Map();
    this.reminders = new Map();
    this.integrationStatuses = new Map();
    this.activityLogs = new Map();

    // Initialize integration statuses
    this.initializeIntegrationStatuses();
  }

  private initializeIntegrationStatuses() {
    const services = ['fireflies', 'notion', 'openai', 'email'];
    services.forEach(service => {
      const status: IntegrationStatus = {
        id: randomUUID(),
        service,
        status: 'disconnected',
        lastChecked: new Date(),
        errorMessage: null,
      };
      this.integrationStatuses.set(service, status);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Meeting methods
  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingByFirefliesId(firefliesId: string): Promise<Meeting | undefined> {
    return Array.from(this.meetings.values()).find(meeting => meeting.firefliesId === firefliesId);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      status: insertMeeting.status || 'processing',
      createdAt: new Date(),
      processedAt: null,
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: string, meetingUpdate: Partial<Meeting>): Promise<Meeting | undefined> {
    const existing = this.meetings.get(id);
    if (!existing) return undefined;
    
    const updated: Meeting = { ...existing, ...meetingUpdate };
    this.meetings.set(id, updated);
    return updated;
  }

  // Action item methods
  async getActionItem(id: string): Promise<ActionItem | undefined> {
    return this.actionItems.get(id);
  }

  async getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(item => item.meetingId === meetingId);
  }

  async getActionItemsDueToday(): Promise<ActionItem[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return Array.from(this.actionItems.values()).filter(item => 
      item.dueDate && 
      item.status !== 'completed' &&
      new Date(item.dueDate) >= startOfDay && 
      new Date(item.dueDate) <= today
    );
  }

  async getPendingActionItems(): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(item => 
      item.status === 'pending' || item.status === 'in_progress'
    );
  }

  async getAllActionItems(): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createActionItem(insertActionItem: InsertActionItem): Promise<ActionItem> {
    const id = randomUUID();
    const actionItem: ActionItem = {
      ...insertActionItem,
      id,
      status: insertActionItem.status || 'pending',
      createdAt: new Date(),
      completedAt: null,
    };
    this.actionItems.set(id, actionItem);
    return actionItem;
  }

  async updateActionItem(id: string, actionItemUpdate: Partial<ActionItem>): Promise<ActionItem | undefined> {
    const existing = this.actionItems.get(id);
    if (!existing) return undefined;
    
    const updated: ActionItem = { ...existing, ...actionItemUpdate };
    if (updated.status === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date();
    }
    this.actionItems.set(id, updated);
    return updated;
  }

  // Reminder methods
  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getRemindersByActionItem(actionItemId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.actionItemId === actionItemId);
  }

  async getUnsentReminders(): Promise<Reminder[]> {
    const now = new Date();
    return Array.from(this.reminders.values()).filter(reminder => 
      !reminder.sent && new Date(reminder.reminderDate) <= now
    );
  }

  async getRemindersDueToday(): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return Array.from(this.reminders.values()).filter(reminder => 
      !reminder.sent &&
      new Date(reminder.reminderDate) >= startOfDay && 
      new Date(reminder.reminderDate) <= today
    );
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      sent: insertReminder.sent || false,
      createdAt: new Date(),
      sentAt: null,
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, reminderUpdate: Partial<Reminder>): Promise<Reminder | undefined> {
    const existing = this.reminders.get(id);
    if (!existing) return undefined;
    
    const updated: Reminder = { ...existing, ...reminderUpdate };
    if (updated.sent && !updated.sentAt) {
      updated.sentAt = new Date();
    }
    this.reminders.set(id, updated);
    return updated;
  }

  // Integration status methods
  async getIntegrationStatus(service: string): Promise<IntegrationStatus | undefined> {
    return this.integrationStatuses.get(service);
  }

  async getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
    return Array.from(this.integrationStatuses.values());
  }

  async updateIntegrationStatus(service: string, statusUpdate: Partial<IntegrationStatus>): Promise<IntegrationStatus> {
    const existing = this.integrationStatuses.get(service);
    const updated: IntegrationStatus = {
      ...existing,
      ...statusUpdate,
      service,
      status: statusUpdate.status || existing?.status || 'disconnected',
      lastChecked: new Date(),
      id: existing?.id || randomUUID(),
    };
    this.integrationStatuses.set(service, updated);
    return updated;
  }

  // Activity log methods
  async addActivityLog(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const activity: ActivityLog = {
      ...insertActivity,
      id,
      metadata: insertActivity.metadata || null,
      timestamp: new Date(),
    };
    this.activityLogs.set(id, activity);
    return activity;
  }

  async getRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Stats methods
  async getStats(): Promise<{
    totalMeetings: number;
    pendingActions: number;
    completedActions: number;
    processingQueue: number;
  }> {
    const totalMeetings = this.meetings.size;
    const pendingActions = Array.from(this.actionItems.values()).filter(item => 
      item.status === 'pending' || item.status === 'in_progress'
    ).length;
    const completedActions = Array.from(this.actionItems.values()).filter(item => 
      item.status === 'completed'
    ).length;
    const processingQueue = Array.from(this.meetings.values()).filter(meeting => 
      meeting.status === 'processing'
    ).length;

    return {
      totalMeetings,
      pendingActions,
      completedActions,
      processingQueue,
    };
  }
}

export const storage = new MemStorage();
