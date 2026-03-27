import axios from 'axios';
import { storage } from './storage';
import { type InsertMeeting } from '@shared/schema';

const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;

interface FirefliesWebhookPayload {
  meetingId: string;
  eventType: string;
  clientReferenceId?: string;
}

interface FirefliesTranscript {
  id: string;
  title: string;
  transcript_url?: string;
  date: string;
  duration: number;
  attendees: Array<{
    name: string;
    email: string;
  }>;
  sentences?: Array<{
    text: string;
    speaker_name: string;
    start_time: number;
    end_time: number;
  }>;
}

export class FirefliesService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = FIREFLIES_API_KEY || null;
    if (!this.apiKey) {
      console.warn('FIREFLIES_API_KEY not configured. Fireflies integration will be disabled.');
    }
  }

  /**
   * Fetch transcript data from Fireflies API
   */
  async fetchTranscript(meetingId: string): Promise<FirefliesTranscript> {
    if (!this.apiKey) {
      throw new Error('Fireflies API key not configured');
    }

    const query = {
      query: `
        query {
          transcript(id: "${meetingId}") {
            id
            title
            transcript_url
            date
            duration
          }
        }
      `
    };

    try {
      const response = await axios.post(FIREFLIES_API_URL, query, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.errors) {
        throw new Error(`Fireflies API error: ${JSON.stringify(response.data.errors)}`);
      }

      const transcript = response.data.data?.transcript;
      if (!transcript) {
        throw new Error(`No transcript found for meeting ID: ${meetingId}`);
      }

      return transcript;
    } catch (error) {
      console.error('Error fetching Fireflies transcript:', error);
      throw error;
    }
  }

  /**
   * Process webhook payload from Fireflies
   */
  async processWebhook(payload: FirefliesWebhookPayload): Promise<string> {
    if (payload.eventType !== 'Transcription completed') {
      console.log(`Ignoring webhook event: ${payload.eventType}`);
      return 'ignored';
    }

    const { meetingId } = payload;
    
    // Check if we already have this meeting
    const existingMeeting = await storage.getMeetingByFirefliesId(meetingId);
    if (existingMeeting) {
      console.log(`Meeting ${meetingId} already exists, skipping processing`);
      return 'exists';
    }

    // Log activity
    await storage.addActivityLog({
      type: 'webhook_received',
      description: `Received Fireflies webhook for meeting ${meetingId}`,
      metadata: { meetingId, eventType: payload.eventType }
    });

    try {
      // Create initial meeting record with processing status
      const meetingData: InsertMeeting = {
        firefliesId: meetingId,
        title: 'Processing...',
        date: new Date(),
        status: 'processing',
        attendees: [],
        keyTopics: [],
        outcomes: [],
        takeaways: [],
        nextSteps: [],
        transcript: null,
        summary: null,
        duration: null,
        notionPageId: null,
        notionUrl: null,
      };

      const meeting = await storage.createMeeting(meetingData);
      
      // Process the meeting asynchronously
      this.processTranscriptAsync(meeting.id, meetingId).catch(error => {
        console.error(`Error processing meeting ${meetingId}:`, error);
      });

      return 'processing';
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Process transcript asynchronously
   */
  private async processTranscriptAsync(meetingDbId: string, firefliesMeetingId: string): Promise<void> {
    try {
      // Fetch transcript from Fireflies
      const transcript = await this.fetchTranscript(firefliesMeetingId);
      
      // Update meeting with transcript data  
      const meetingUpdate = {
        title: transcript.title,
        date: new Date(parseInt(transcript.date)),
        duration: transcript.duration,
        attendees: [],
        transcript: transcript.transcript_url ? `Transcript available at: ${transcript.transcript_url}` : 'Transcript not available',
        summary: `Meeting processed from Fireflies (Duration: ${transcript.duration} seconds)`,
        status: 'completed' as const,
        processedAt: new Date(),
      };

      await storage.updateMeeting(meetingDbId, meetingUpdate);

      await storage.addActivityLog({
        type: 'meeting_processed',
        description: `Meeting "${transcript.title}" processed successfully`,
        metadata: { meetingId: meetingDbId, firefliesId: firefliesMeetingId }
      });

      // Update integration status
      await storage.updateIntegrationStatus('fireflies', {
        status: 'connected',
        errorMessage: null
      });

    } catch (error) {
      console.error(`Error processing transcript for ${firefliesMeetingId}:`, error);
      
      // Update meeting status to failed
      await storage.updateMeeting(meetingDbId, {
        status: 'failed',
        processedAt: new Date(),
      });

      // Update integration status
      await storage.updateIntegrationStatus('fireflies', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      await storage.addActivityLog({
        type: 'meeting_processing_failed',
        description: `Failed to process meeting ${firefliesMeetingId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { meetingId: meetingDbId, firefliesId: firefliesMeetingId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  }

  /**
   * Check API connection status
   */
  async checkConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const query = {
        query: `
          query {
            transcripts(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        `
      };

      const response = await axios.post(FIREFLIES_API_URL, query, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return !response.data.errors;
    } catch (error) {
      console.error('Fireflies connection check failed:', error);
      return false;
    }
  }
}

export const firefliesService = new FirefliesService();
