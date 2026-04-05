import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export type ExtractionData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  passportNumber?: string;
  nationality?: string;
  confidence: number;
};

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI Extraction Service initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found. Using Mock Extraction mode.');
    }
  }

  async extractFromDocument(text: string, typeHint?: string): Promise<ExtractionData> {
    if (!this.openai) {
      return this.mockExtract(text, typeHint);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert recruitment assistant for ORI-CRUIT. 
            Extract candidate details from the following OCR text from a ${typeHint || 'document'}. 
            Return ONLY a JSON object with: firstName, lastName, phone, email, passportNumber, nationality, and a confidence score (0-1).`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      return {
        ...extracted,
        confidence: extracted.confidence || 0.8
      };
    } catch (error) {
      this.logger.error('OpenAI Extraction failed', error);
      return this.mockExtract(text, typeHint);
    }
  }

  private mockExtract(text: string, typeHint?: string): ExtractionData {
    this.logger.debug('Running mock extraction...');
    
    // Simple regex for dummy matching if phone exists in text
    const phoneMatch = text.match(/\d{9,12}/);
    
    return {
      firstName: 'Extracted',
      lastName: typeHint ? typeHint.toUpperCase() : 'CANDIDATE',
      phone: phoneMatch ? phoneMatch[0] : undefined,
      confidence: 0.5,
      nationality: 'Detected'
    };
  }
}
