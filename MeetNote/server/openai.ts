import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface ExtractedMeetingData {
  keyTopics: string[];
  outcomes: string[];
  takeaways: string[];
  nextSteps: string[];
  actionItems: Array<{
    title: string;
    description?: string;
    assignee: string;
    assigneeEmail?: string;
    dueDate?: string;
    deliverable?: string;
  }>;
}

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key";
    if (!this.apiKey || this.apiKey === "default_key") {
      console.warn('OpenAI API key not configured. AI processing will be limited.');
    }
  }

  /**
   * Extract meeting data from transcript using OpenAI
   */
  async extractMeetingData(transcript: string, meetingTitle: string): Promise<ExtractedMeetingData> {
    if (!this.apiKey || this.apiKey === "default_key") {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analyze the following meeting transcript and extract structured information. Return your response in JSON format with the following structure:

{
  "keyTopics": ["topic1", "topic2", ...],
  "outcomes": ["outcome1", "outcome2", ...],
  "takeaways": ["takeaway1", "takeaway2", ...],
  "nextSteps": ["step1", "step2", ...],
  "actionItems": [
    {
      "title": "Action item title",
      "description": "Optional detailed description",
      "assignee": "Person's name",
      "assigneeEmail": "email@example.com (if mentioned)",
      "dueDate": "YYYY-MM-DD (if mentioned)",
      "deliverable": "What needs to be delivered"
    }
  ]
}

Guidelines:
- Extract 3-7 key topics that were discussed
- Identify concrete outcomes and decisions made
- List important takeaways and insights
- Extract actionable next steps
- For action items, identify who is responsible and what they need to do
- Only include due dates if explicitly mentioned in the transcript
- Be specific and actionable in descriptions
- If no clear assignee is mentioned, use "Team" or the most relevant participant

Meeting Title: ${meetingTitle}

Transcript:
${transcript}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [
          {
            role: "system",
            content: "You are an expert meeting analyst. Extract key information from meeting transcripts and structure it for productivity tracking. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      // Validate and clean the result
      const extractedData: ExtractedMeetingData = {
        keyTopics: Array.isArray(result.keyTopics) ? result.keyTopics.slice(0, 10) : [],
        outcomes: Array.isArray(result.outcomes) ? result.outcomes.slice(0, 10) : [],
        takeaways: Array.isArray(result.takeaways) ? result.takeaways.slice(0, 10) : [],
        nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 10) : [],
        actionItems: Array.isArray(result.actionItems) ? result.actionItems.map(item => ({
          title: item.title || 'Untitled Action',
          description: item.description || '',
          assignee: item.assignee || 'Team',
          assigneeEmail: item.assigneeEmail || '',
          dueDate: item.dueDate || null,
          deliverable: item.deliverable || ''
        })) : []
      };

      // Update integration status
      await storage.updateIntegrationStatus('openai', {
        status: 'connected',
        errorMessage: null
      });

      return extractedData;

    } catch (error) {
      console.error('Error extracting meeting data with OpenAI:', error);
      
      // Update integration status
      await storage.updateIntegrationStatus('openai', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Generate action item suggestions from a meeting summary
   */
  async generateActionItemSuggestions(summary: string, attendees: string[]): Promise<string[]> {
    if (!this.apiKey || this.apiKey === "default_key") {
      return [];
    }

    const prompt = `
Based on this meeting summary and attendee list, suggest 3-5 specific action items that would add value to the meeting outcomes.

Meeting Summary: ${summary}
Attendees: ${attendees.join(', ')}

Return a JSON array of suggested action items as strings. Focus on:
- Follow-up tasks that were implied but not explicitly stated
- Documentation or communication needs
- Preparation for future meetings
- Implementation steps for decisions made

Respond with: {"suggestions": ["action1", "action2", ...]}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return Array.isArray(result.suggestions) ? result.suggestions : [];

    } catch (error) {
      console.error('Error generating action item suggestions:', error);
      return [];
    }
  }

  /**
   * Check OpenAI API connection
   */
  async checkConnection(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === "default_key") {
      return false;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });

      return !!response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI connection check failed:', error);
      return false;
    }
  }

  /**
   * Enhance meeting summary with additional insights
   */
  async enhanceMeetingSummary(transcript: string, existingSummary?: string): Promise<string> {
    if (!this.apiKey || this.apiKey === "default_key") {
      return existingSummary || 'Summary not available';
    }

    const prompt = existingSummary 
      ? `Enhance this meeting summary with additional insights from the full transcript:

Existing Summary: ${existingSummary}

Full Transcript: ${transcript}

Provide an enhanced summary that includes key decisions, important discussions, and strategic insights.`
      : `Create a comprehensive meeting summary from this transcript, focusing on key decisions, important discussions, and strategic insights:

${transcript}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      return response.choices[0].message.content || existingSummary || 'Summary not available';

    } catch (error) {
      console.error('Error enhancing meeting summary:', error);
      return existingSummary || 'Summary not available';
    }
  }
}

export const openaiService = new OpenAIService();
