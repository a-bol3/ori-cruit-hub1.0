import OpenAI from 'openai';

export type ParsedConversationResult = {
  summary: string | null;
  intent: string | null;
  status: string | null;
  confidence: number;
  extractedFields: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    nationality?: string;
    currentCountry?: string;
    language?: string;
    offerInterest?: string;
    availabilityDate?: string;
    travelDate?: string;
    documentMentions?: string[];
    legalClue?: string;
    paymentMention?: boolean;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  nextAction?: string;
};

export class ConversationAiParserService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not found. AI parsing will return mock data.');
      this.openai = null as any;
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async parse(params: { text: string; filename?: string }): Promise<ParsedConversationResult> {
    const { text, filename } = params;

    // If no OpenAI key, return mock data
    if (!this.openai) {
      return this.getMockResult(text);
    }

    try {
      const prompt = this.buildPrompt(text, filename);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model for this use case
        messages: [
          {
            role: 'system',
            content: `You are an expert AI assistant specialized in analyzing WhatsApp conversations for recruitment agencies.

Your task is to extract structured information from candidate conversations and provide actionable insights.

RECRUITMENT CONTEXT:
- We help candidates find jobs in Europe (mainly Poland, Germany, Spain)
- Common nationalities: Mexican, Ukrainian, Indian, Filipino, etc.
- Jobs: construction, hospitality, agriculture, manufacturing
- Documents needed: passport, work permits, medical certificates
- Process: interview → documents → legal review → work permit → placement

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the conversation",
  "intent": "CANDIDATE_INQUIRY | DOCUMENT_SUBMISSION | STATUS_CHECK | COMPLAINT | CONFIRMATION",
  "status": "NEW_LEAD | CONTACTED | INTERESTED | WAITING_DOCUMENTS | READY_LEGAL | PLACED | CLOSED",
  "confidence": 0.0-1.0,
  "extractedFields": {
    "firstName": "string or null",
    "lastName": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "nationality": "string or null",
    "currentCountry": "string or null",
    "language": "string or null",
    "offerInterest": "string or null",
    "availabilityDate": "ISO date string or null",
    "travelDate": "ISO date string or null",
    "documentMentions": ["array of mentioned documents"],
    "legalClue": "string or null",
    "paymentMention": boolean
  },
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "nextAction": "Suggested next action for recruiter"
}

EXTRACTION RULES:
- Extract personal info from conversation context
- Look for job interests, availability dates, travel plans
- Identify document mentions (passport, visa, work permit, etc.)
- Detect payment discussions
- Assess urgency (urgent = mentions deadlines, complaints, immediate needs)
- Status based on conversation progress
- Confidence based on clarity of information`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      // Validate the response structure
      return this.validateAndNormalizeResult(parsed);

    } catch (error) {
      console.error('OpenAI parsing error:', error);
      // Fallback to mock result
      return this.getMockResult(text);
    }
  }

  private buildPrompt(text: string, filename?: string): string {
    let prompt = `Analyze this WhatsApp conversation for recruitment purposes:\n\n`;

    if (filename) {
      prompt += `Filename: ${filename}\n`;
      // Extract metadata from filename if possible
      const filenameMatch = filename.match(/(.+)_(.+)_(\d{8})_(.+)\.txt/i);
      if (filenameMatch) {
        prompt += `Possible metadata from filename: ${filenameMatch[1]} ${filenameMatch[2]}, Date: ${filenameMatch[3]}, Channel: ${filenameMatch[4]}\n`;
      }
    }

    prompt += `Conversation content:\n${text}\n\n`;

    prompt += `Provide structured analysis in JSON format.`;

    return prompt;
  }

  private validateAndNormalizeResult(result: any): ParsedConversationResult {
    // Ensure all required fields exist with defaults
    const normalized: ParsedConversationResult = {
      summary: result.summary || null,
      intent: result.intent || null,
      status: result.status || 'NEW_LEAD',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      extractedFields: {
        firstName: result.extractedFields?.firstName || null,
        lastName: result.extractedFields?.lastName || null,
        phone: result.extractedFields?.phone || null,
        email: result.extractedFields?.email || null,
        nationality: result.extractedFields?.nationality || null,
        currentCountry: result.extractedFields?.currentCountry || null,
        language: result.extractedFields?.language || null,
        offerInterest: result.extractedFields?.offerInterest || null,
        availabilityDate: result.extractedFields?.availabilityDate || null,
        travelDate: result.extractedFields?.travelDate || null,
        documentMentions: Array.isArray(result.extractedFields?.documentMentions)
          ? result.extractedFields.documentMentions
          : [],
        legalClue: result.extractedFields?.legalClue || null,
        paymentMention: Boolean(result.extractedFields?.paymentMention)
      },
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(result.priority)
        ? result.priority
        : 'MEDIUM',
      nextAction: result.nextAction || null
    };

    return normalized;
  }

  private getMockResult(text: string): ParsedConversationResult {
    // Simple mock extraction based on text patterns
    const hasPhone = /\d{9,}/.test(text);
    const hasEmail = /\S+@\S+\.\S+/.test(text);
    const hasDocuments = /(passport|visa|permit|document|paper)/i.test(text);
    const hasPayment = /(pay|money|fee|cost|price)/i.test(text);
    const isUrgent = /(urgent|asap|immediately|deadline)/i.test(text);

    return {
      summary: "Mock analysis - OpenAI not configured. Install OpenAI API key for real analysis.",
      intent: hasDocuments ? "DOCUMENT_SUBMISSION" : "CANDIDATE_INQUIRY",
      status: "NEW_LEAD",
      confidence: 0.3,
      extractedFields: {
        firstName: undefined,
        lastName: undefined,
        phone: hasPhone ? text.match(/\d{9,}/)?.[0] || undefined : undefined,
        email: hasEmail ? text.match(/\S+@\S+\.\S+/)?.[0] || undefined : undefined,
        nationality: undefined,
        currentCountry: undefined,
        language: undefined,
        offerInterest: undefined,
        availabilityDate: undefined,
        travelDate: undefined,
        documentMentions: hasDocuments ? ["documents mentioned"] : [],
        legalClue: undefined,
        paymentMention: hasPayment
      },
      priority: isUrgent ? "HIGH" : "MEDIUM",
      nextAction: "Configure OpenAI API key for proper analysis"
    };
  }
}

export const conversationAiParserService = new ConversationAiParserService();