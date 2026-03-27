import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firefliesService } from "./fireflies";
import { openaiService } from "./openai";
import { setupNotionDatabases } from "./setup-notion";
import { schedulerService } from "./scheduler";
import { emailService } from "./email";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Dashboard stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all meetings
  app.get("/api/meetings", async (req, res) => {
    try {
      const meetings = await storage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Get specific meeting
  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Also get action items for this meeting
      const actionItems = await storage.getActionItemsByMeeting(meeting.id);
      
      res.json({ ...meeting, actionItems });
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  // Get all action items
  app.get("/api/action-items", async (req, res) => {
    try {
      const actionItems = await storage.getAllActionItems();
      res.json(actionItems);
    } catch (error) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });

  // Get action items due today
  app.get("/api/action-items/due-today", async (req, res) => {
    try {
      const actionItems = await storage.getActionItemsDueToday();
      res.json(actionItems);
    } catch (error) {
      console.error("Error fetching due action items:", error);
      res.status(500).json({ message: "Failed to fetch due action items" });
    }
  });

  // Update action item status
  const updateActionItemSchema = z.object({
    status: z.enum(["pending", "in_progress", "completed", "overdue"]),
    completedAt: z.string().datetime().optional(),
  });

  app.patch("/api/action-items/:id", async (req, res) => {
    try {
      const validation = updateActionItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      const { status, completedAt } = validation.data;
      const updateData: any = { status };
      
      if (completedAt) {
        updateData.completedAt = new Date(completedAt);
      }

      const updatedItem = await storage.updateActionItem(req.params.id, updateData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Action item not found" });
      }

      // Log activity
      await storage.addActivityLog({
        type: 'action_item_updated',
        description: `Action item "${updatedItem.title}" status changed to ${status}`,
        metadata: { actionItemId: updatedItem.id, oldStatus: updatedItem.status, newStatus: status }
      });

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating action item:", error);
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // Fireflies webhook endpoint
  app.post("/api/webhooks/fireflies", async (req, res) => {
    try {
      const signature = req.get('x-hub-signature');
      const webhookSecret = process.env.FIREFLIES_WEBHOOK_SECRET;
      
      // Verify webhook signature if secret is provided
      if (webhookSecret && signature) {
        const isValid = firefliesService.verifyWebhookSignature(
          JSON.stringify(req.body),
          signature,
          webhookSecret
        );
        if (!isValid) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const result = await firefliesService.processWebhook(req.body);
      res.json({ status: result });
    } catch (error) {
      console.error("Error processing Fireflies webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Process meeting with AI to extract action items
  app.post("/api/meetings/:id/process", async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      if (!meeting.transcript) {
        return res.status(400).json({ message: "Meeting transcript not available" });
      }

      // Extract action items using OpenAI
      const extractedData = await openaiService.extractMeetingData(meeting.transcript, meeting.title);
      
      // Update meeting with extracted data
      await storage.updateMeeting(meeting.id, {
        keyTopics: extractedData.keyTopics,
        outcomes: extractedData.outcomes,
        takeaways: extractedData.takeaways,
        nextSteps: extractedData.nextSteps,
      });

      // Create action items
      const actionItems = [];
      for (const actionData of extractedData.actionItems) {
        const actionItem = await storage.createActionItem({
          meetingId: meeting.id,
          title: actionData.title,
          description: actionData.description,
          assignee: actionData.assignee,
          assigneeEmail: actionData.assigneeEmail,
          dueDate: actionData.dueDate ? new Date(actionData.dueDate) : null,
          deliverable: actionData.deliverable,
          status: 'pending',
        });
        actionItems.push(actionItem);
      }

      // Log activity
      await storage.addActivityLog({
        type: 'meeting_ai_processed',
        description: `AI processing completed for "${meeting.title}" - ${actionItems.length} action items extracted`,
        metadata: { 
          meetingId: meeting.id, 
          actionItemsCount: actionItems.length,
          keyTopicsCount: extractedData.keyTopics.length 
        }
      });

      res.json({ 
        meeting: await storage.getMeeting(meeting.id),
        actionItems 
      });
    } catch (error) {
      console.error("Error processing meeting with AI:", error);
      res.status(500).json({ message: "Failed to process meeting with AI" });
    }
  });

  // Get integration statuses
  app.get("/api/integrations/status", async (req, res) => {
    try {
      const statuses = await storage.getAllIntegrationStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching integration statuses:", error);
      res.status(500).json({ message: "Failed to fetch integration statuses" });
    }
  });

  // Test integration connections
  app.post("/api/integrations/test", async (req, res) => {
    try {
      const results = {
        fireflies: await firefliesService.checkConnection(),
        email: await emailService.checkConnection(),
        openai: await openaiService.checkConnection(),
      };

      // Update integration statuses
      for (const [service, connected] of Object.entries(results)) {
        await storage.updateIntegrationStatus(service, {
          status: connected ? 'connected' : 'error',
          errorMessage: connected ? null : 'Connection test failed'
        });
      }

      res.json(results);
    } catch (error) {
      console.error("Error testing integrations:", error);
      res.status(500).json({ message: "Failed to test integrations" });
    }
  });

  // Get recent activity
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Setup Notion databases
  app.post("/api/setup/notion", async (req, res) => {
    try {
      await setupNotionDatabases();
      
      await storage.updateIntegrationStatus('notion', {
        status: 'connected',
        errorMessage: null
      });

      await storage.addActivityLog({
        type: 'notion_setup_completed',
        description: 'Notion databases setup completed successfully',
        metadata: {}
      });

      res.json({ message: "Notion databases setup completed" });
    } catch (error) {
      console.error("Error setting up Notion:", error);
      
      await storage.updateIntegrationStatus('notion', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Setup failed'
      });

      res.status(500).json({ message: "Failed to setup Notion databases" });
    }
  });

  // Send test email
  const testEmailSchema = z.object({
    email: z.string().email(),
  });

  app.post("/api/test/email", async (req, res) => {
    try {
      const validation = testEmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      await emailService.sendTestEmail(validation.data.email);
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Trigger morning reminders manually (for testing)
  app.post("/api/reminders/trigger", async (req, res) => {
    try {
      await schedulerService.runMorningReminderNow();
      res.json({ message: "Morning reminders triggered successfully" });
    } catch (error) {
      console.error("Error triggering reminders:", error);
      res.status(500).json({ message: "Failed to trigger reminders" });
    }
  });

  // Start scheduler
  schedulerService.startAll();

  const httpServer = createServer(app);
  return httpServer;
}
