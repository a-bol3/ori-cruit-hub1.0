import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  interests?: string[];
  confidence: number;
  // AI-enhanced fields
  aiSummary?: string;
  detectedIntent?: string;
  nextActionSuggestion?: string;
  availabilityDate?: string;
  currentCountry?: string;
  documentMentions?: string[];
  paymentMention?: boolean;
  legalClue?: boolean;
}

@Injectable()
export class ExtractionEngine {
  private readonly openai: OpenAI | null;

  // Common nationality patterns for recruitment context (PL/EU focus)
  private readonly nationalityPatterns = [
    { regex: /\b(polish|polsk[ai]|polska|poland|pl)\b/i, value: 'Polish' },
    { regex: /\b(ukrainian|ukrai[nń]sk[ai]|ukraina|ukraine|ua)\b/i, value: 'Ukrainian' },
    { regex: /\b(belarusi?an|białoruski|belarus|by)\b/i, value: 'Belarusian' },
    { regex: /\b(georgian|gruzińsk[ai]|georgia|ge)\b/i, value: 'Georgian' },
    { regex: /\b(moldovan|mołdawsk[ai]|moldova|md)\b/i, value: 'Moldovan' },
    { regex: /\b(indian|indyjsk[ai]|india|in)\b/i, value: 'Indian' },
    { regex: /\b(nepalese|nepals?k[ai]|nepal|np)\b/i, value: 'Nepalese' },
    { regex: /\b(bangladeshi|banglade[sś]k[ai]|bangladesh|bd)\b/i, value: 'Bangladeshi' },
    { regex: /\b(filipino|filipińsk[ai]|philippines|ph)\b/i, value: 'Filipino' },
    { regex: /\b(romanian|rumuńsk[ai]|romania|ro)\b/i, value: 'Romanian' },
    { regex: /\b(turkish|tureck[ai]|turkey|türkiye|tr)\b/i, value: 'Turkish' },
    { regex: /\b(uzbek|uzbeck[ai]|uzbekistan|uz)\b/i, value: 'Uzbek' },
    { regex: /\b(colombian|kolumbijsk[ai]|colombia|co)\b/i, value: 'Colombian' },
  ];

  // Common job interest keywords
  private readonly interestKeywords = [
    'warehouse', 'magazyn', 'production', 'produkcja',
    'logistics', 'logistyka', 'driver', 'kierowca',
    'welding', 'spawanie', 'construction', 'budowa',
    'cleaning', 'sprzątanie', 'agriculture', 'rolnictwo',
    'food processing', 'przetwórstwo', 'packaging', 'pakowanie',
    'forklift', 'wózek widłowy', 'assembly', 'montaż',
  ];

  constructor() {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  async extract(text: string): Promise<ExtractedData> {
    console.log(`ExtractionEngine: Processing ${text.length} chars of text...`);

    if (this.openai) {
      try {
        return await this.extractWithOpenAI(text);
      } catch (err) {
        console.warn('OpenAI extraction failed, falling back to regex:', err);
      }
    }

    return this.extractWithRegex(text);
  }

  private async extractWithOpenAI(text: string): Promise<ExtractedData> {
    const truncated = text.slice(0, 4000); // Stay within token limits

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert recruitment data extractor for an international staffing agency.
You process WhatsApp conversations (in Polish, Ukrainian, English, or mixed languages) between recruiters and candidates.

Extract ALL available candidate information and return ONLY valid JSON with these fields:
{
  "firstName": string | null,
  "lastName": string | null,
  "phone": string | null,
  "email": string | null,
  "nationality": string | null,
  "currentCountry": string | null,
  "availabilityDate": string | null,
  "interests": string[],
  "documentMentions": string[],
  "paymentMention": boolean,
  "legalClue": boolean,
  "detectedIntent": "DOCUMENT_SUBMISSION" | "JOB_INTEREST" | "PAYMENT_QUESTION" | "GENERAL_RECRUITMENT" | "NOT_INTERESTED" | "STATUS_INQUIRY",
  "nextActionSuggestion": string,
  "aiSummary": string,
  "confidence": number (0.0-1.0)
}

Rules:
- confidence: 0.9+ if name+phone+nationality found; 0.6-0.8 partial; below 0.5 if very little info
- documentMentions: list any documents mentioned (passport, visa, pesel, karta pobytu, etc.)
- legalClue: true if any legal status, visa, work permit, or document issues mentioned
- paymentMention: true if salary, payment, przelew, or money mentioned
- availabilityDate: in ISO format if determinable, else null
- aiSummary: 1-2 sentence summary of the conversation context`,
        },
        {
          role: 'user',
          content: `Extract candidate data from this recruitment conversation:\n\n${truncated}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty OpenAI response');

    const parsed = JSON.parse(raw);

    return {
      firstName: parsed.firstName || undefined,
      lastName: parsed.lastName || undefined,
      phone: parsed.phone || undefined,
      email: parsed.email || undefined,
      nationality: parsed.nationality || undefined,
      currentCountry: parsed.currentCountry || undefined,
      availabilityDate: parsed.availabilityDate || undefined,
      interests: parsed.interests || [],
      documentMentions: parsed.documentMentions || [],
      paymentMention: !!parsed.paymentMention,
      legalClue: !!parsed.legalClue,
      detectedIntent: parsed.detectedIntent || 'GENERAL_RECRUITMENT',
      nextActionSuggestion: parsed.nextActionSuggestion || 'Review conversation and determine next action.',
      aiSummary: parsed.aiSummary || undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
    };
  }

  private async extractWithRegex(text: string): Promise<ExtractedData> {
    // Parse WhatsApp-style messages
    const messages = this.parseWhatsAppMessages(text);
    const combinedText = messages.length > 0
      ? messages.map(m => m.content).join(' ')
      : text;

    // Extract all fields
    const email = this.extractEmail(combinedText);
    const phone = this.extractPhone(combinedText);
    const name = this.extractName(combinedText);
    const nationality = this.extractNationality(combinedText);
    const interests = this.extractInterests(combinedText);

    // Calculate confidence based on how many fields were extracted
    const fieldsFound = [email, phone, name?.firstName, name?.lastName, nationality]
      .filter(Boolean).length;
    const confidence = Math.min(0.5 + (fieldsFound * 0.1), 0.95);

    const data: ExtractedData = {
      firstName: name?.firstName,
      lastName: name?.lastName,
      nationality,
      email,
      phone,
      interests,
      confidence,
    };

    console.log(`ExtractionEngine: Extracted ${fieldsFound} fields with ${confidence} confidence`);
    return data;
  }

  /**
   * Parse WhatsApp chat export format:
   * [dd/mm/yyyy, hh:mm:ss] Sender: Message
   * or: dd/mm/yyyy, hh:mm - Sender: Message
   */
  private parseWhatsAppMessages(text: string): Array<{ 
    date: string; sender: string; content: string 
  }> {
    const messages: Array<{ date: string; sender: string; content: string }> = [];
    
    // Match common WhatsApp export formats
    const patterns = [
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*\d{1,2}:\d{2}(?::\d{2})?\]\s*([^:]+):\s*(.+)/gm,
      /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*\d{1,2}:\d{2}(?::\d{2})?\s*-\s*([^:]+):\s*(.+)/gm,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        messages.push({
          date: match[1],
          sender: match[2].trim(),
          content: match[3].trim(),
        });
      }
    }

    return messages;
  }

  private extractEmail(text: string): string | undefined {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0].toLowerCase() : undefined;
  }

  private extractPhone(text: string): string | undefined {
    // Match international phone formats
    const patterns = [
      /\+?\d{2,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}/,  // +48 123 456 789
      /\+?\d{9,15}/,                                      // +48123456789
      /\(\+?\d{2,3}\)\s*\d{3}[\s-]?\d{3}[\s-]?\d{3}/,   // (+48) 123 456 789
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Clean up: remove spaces/dashes
        return match[0].replace(/[\s-()]/g, '');
      }
    }
    return undefined;
  }

  /**
   * Extract name from common patterns in recruitment messages
   */
  private extractName(text: string): { firstName: string; lastName: string } | undefined {
    const namePatterns = [
      // "My name is John Smith" / "I am John Smith"
      /(?:my name is|i am|i'm|jestem|nazywam się|mam na imię)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)/i,
      // "Name: John Smith"
      /(?:name|imię|imie)\s*[:=]\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)/i,
      // "John Smith" at start of message after greeting
      /(?:hello|hi|cześć|dzień dobry|hej)[,!.]?\s+(?:my name is |i'm |jestem )?([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)/i,
      // "Surname: Smith" with separate "Name: John"
      /(?:first\s*name|imię)\s*[:=]\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+).*?(?:(?:last\s*name|surname|nazwisko)\s*[:=]\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+))/is,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          firstName: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
          lastName: match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase(),
        };
      }
    }

    return undefined;
  }

  private extractNationality(text: string): string | undefined {
    // First try explicit patterns
    const explicitPatterns = [
      /(?:nationality|obywatelstwo|from|z)\s*[:=]?\s*(\w+)/i,
      /(?:i am|i'm|jestem)\s+(?:from|z)\s+(\w+)/i,
    ];

    for (const pattern of explicitPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Check if the extracted word matches a known nationality
        for (const np of this.nationalityPatterns) {
          if (np.regex.test(match[1])) {
            return np.value;
          }
        }
      }
    }

    // Then scan the entire text for nationality keywords
    for (const np of this.nationalityPatterns) {
      if (np.regex.test(text)) {
        return np.value;
      }
    }

    return undefined;
  }

  private extractInterests(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of this.interestKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        // Normalize to English
        const normalized = this.normalizeInterest(keyword);
        if (!found.includes(normalized)) {
          found.push(normalized);
        }
      }
    }

    return found;
  }

  private normalizeInterest(keyword: string): string {
    const map: Record<string, string> = {
      'magazyn': 'warehouse', 'produkcja': 'production',
      'logistyka': 'logistics', 'kierowca': 'driver',
      'spawanie': 'welding', 'budowa': 'construction',
      'sprzątanie': 'cleaning', 'rolnictwo': 'agriculture',
      'przetwórstwo': 'food processing', 'pakowanie': 'packaging',
      'wózek widłowy': 'forklift', 'montaż': 'assembly',
    };
    return map[keyword.toLowerCase()] || keyword.toLowerCase();
  }
}
