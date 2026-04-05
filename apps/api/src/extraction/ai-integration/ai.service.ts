import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async extractCandidateFromConversation(rawText: string) {
    this.logger.log('Starting AI extraction from conversation log');

    const prompt = `
      You are an expert recruitment assistant for ORI-CRUIT HUB.
      Analyze the following WhatsApp conversation log and extract candidate details into a JSON object.
      
      Fields to extract:
      - firstName
      - lastName
      - phone
      - email
      - nationality
      - gender
      - birthDate (if mentioned)
      - location
      - source (always WHATSAPP)
      - interestLevel (1-5)
      
      Raw Conversation:
      """
      ${rawText.slice(0, 4000)}
      """
      
      Return ONLY the JSON object.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // or gpt-4-turbo
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.logger.log('AI Extraction successful');
      return result;
    } catch (error) {
      this.logger.error(`AI Extraction failed: ${error.message}`);
      throw error;
    }
  }

  async extractCandidateFromDocument(ocrText: string, documentType: string) {
    this.logger.log(`Starting AI extraction from ${documentType}`);

    const prompt = `
      You are an expert recruitment assistant. 
      Analyze the following OCR text from a ${documentType} and extract personal details into a JSON object.
      
      Fields to extract:
      - firstName
      - lastName
      - birthDate
      - expiryDate
      - issuingCountry
      - identifierNumber
      
      OCR Text:
      """
      ${ocrText.slice(0, 4000)}
      """
      
      Return ONLY the JSON object.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      this.logger.error(`AI Document Extraction failed: ${error.message}`);
      throw error;
    }
  }
}
