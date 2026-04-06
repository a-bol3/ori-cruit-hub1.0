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
      this.logger.warn('No OpenAI key configured, using mock extraction');
      return this.mockExtract(text, typeHint);
    }

    try {
      this.logger.debug(`Extracting from ${typeHint || 'document'} with text length: ${text.length}`);

      // Validar que la clave de API no está vacía
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < 10) {
        this.logger.error('Invalid OPENAI_API_KEY configuration');
        return this.mockExtract(text, typeHint);
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert recruitment assistant for ORI-CRUIT.
            Extract candidate details from the following OCR text from a ${typeHint || 'document'}.
            Return ONLY a JSON object with: firstName, lastName, phone, email, passportNumber, nationality, and a confidence score (0-1).
            If not found, use null for that field.`
          },
          {
            role: "user",
            content: text.substring(0, 8000) // Límite de 8k chars para economizar tokens
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Baja temperatura para resultados más determinísticos
      });

      const extractedText = response.choices[0].message?.content || '{}';
      const extracted = JSON.parse(extractedText);

      this.logger.debug(`Extraction successful. Confidence: ${extracted.confidence}`);

      return {
        ...extracted,
        confidence: Math.min(1, Math.max(0, extracted.confidence || 0.7))
      };
    } catch (error: any) {
      // Manejar tipos específicos de error
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        this.logger.error('Network connectivity issue connecting to OpenAI', error.message);
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.logger.error('Invalid OPENAI_API_KEY - check your credentials');
      } else if (error.message.includes('429')) {
        this.logger.error('OpenAI rate limit exceeded - backing off');
      } else if (error.message.includes('vector')) {
        this.logger.error('Vector/embedding error from OpenAI (likely network timeout)', error.message);
      } else {
        this.logger.error(`Unexpected OpenAI extraction error: ${error.message}`, error);
      }

      // Fallback a mock en caso de cualquier error
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
