import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey(),
  firefliesId: text("fireflies_id").notNull().unique(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration"), // in minutes
  attendees: jsonb("attendees").$type<Array<{name: string, email: string}>>().notNull().default([]),
  transcript: text("transcript"),
  summary: text("summary"),
  keyTopics: jsonb("key_topics").$type<string[]>().notNull().default([]),
  outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
  takeaways: jsonb("takeaways").$type<string[]>().notNull().default([]),
  nextSteps: jsonb("next_steps").$type<string[]>().notNull().default([]),
  notionPageId: text("notion_page_id"),
  notionUrl: text("notion_url"),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const actionItems = pgTable("action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => meetings.id),
  title: text("title").notNull(),
  description: text("description"),
  assignee: text("assignee").notNull(),
  assigneeEmail: text("assignee_email"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  deliverable: text("deliverable"),
  notionPageId: text("notion_page_id"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionItemId: varchar("action_item_id").notNull().references(() => actionItems.id),
  reminderDate: timestamp("reminder_date").notNull(),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const integrationStatus = pgTable("integration_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull().unique(), // fireflies, notion, openai, email
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  lastChecked: timestamp("last_checked").notNull().default(sql`now()`),
  errorMessage: text("error_message"),
});

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // meeting_processed, action_created, reminder_sent, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type IntegrationStatus = typeof integrationStatus.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
