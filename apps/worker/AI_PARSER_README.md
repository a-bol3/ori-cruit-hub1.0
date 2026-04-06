# ORI CRUIT AI Conversation Parser

This worker provides AI-powered parsing of WhatsApp conversations for recruitment purposes using OpenAI's GPT models.

## Features

- 🤖 **AI-Powered Parsing**: Uses OpenAI GPT-4o-mini for intelligent conversation analysis
- 📊 **Structured Extraction**: Extracts candidate information, intent, and priority
- 🔄 **Async Processing**: BullMQ-based queue system for scalable processing
- 🎯 **Confidence Scoring**: Automatic review task creation for low-confidence results
- 🔗 **Auto-Linking**: Automatically links conversations to existing candidates
- 🛡️ **Fallback Support**: Works with mock data when OpenAI is not configured

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# OpenAI (Required for AI parsing)
OPENAI_API_KEY=your_openai_api_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ori_cruit
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build

```bash
npm run build
```

### 4. Test AI Parser

```bash
npm run test:ai
```

This will test the AI parser with sample conversation data.

## Usage

### Starting the Worker

```bash
# Development mode
npm run dev

# Production mode
npm run start:prod
```

### Processing Conversations

The worker automatically processes conversations added to the `conversation-extraction` queue.

Example queue job:
```typescript
import { QUEUE_NAMES } from './shared/queue.constants';

// Add conversation to processing queue
await queue.add(JOB_NAMES.CONVERSATION_EXTRACTION_PROCESS, {
  conversationId: 'conversation-uuid'
});
```

## AI Parsing Features

### Extracted Information

- **Personal Info**: Name, phone, email, nationality, location
- **Job Details**: Position, company, salary, experience
- **Availability**: Start date, travel plans
- **Documents**: Passport, visa, work permits mentioned
- **Intent Classification**: Inquiry, document submission, status check
- **Priority Assessment**: Low, Medium, High, Urgent

### Confidence & Review

- **High Confidence (>0.8)**: Auto-confirms extractions
- **Medium Confidence (0.5-0.8)**: Creates review tasks
- **Low Confidence (<0.5)**: Requires manual review

### Auto-Linking

When confidence > 0.9, the system automatically links conversations to existing candidates based on:
- Phone number matches
- Email matches
- Name verification

## Troubleshooting

### OpenAI Not Working

If you see "Mock analysis" results:

1. **Check API Key**: Ensure `OPENAI_API_KEY` is set in `.env`
2. **Verify Key Validity**: Test with OpenAI API directly
3. **Check Quota**: Ensure you have credits remaining
4. **Network Issues**: Verify internet connection

### Alternative AI Providers

If OpenAI is unavailable, you can implement alternatives:

1. **Claude (Anthropic)**: Similar structured output capabilities
2. **Local Models**: Ollama with Llama 2/3
3. **Azure OpenAI**: If using Azure deployment

### Queue Issues

- **Redis Connection**: Verify Redis is running on configured host/port
- **Queue Backlog**: Monitor queue length with Redis CLI
- **Worker Health**: Check worker logs for processing errors

### Database Issues

- **Connection**: Verify `DATABASE_URL` is correct
- **Migrations**: Run `npx prisma migrate deploy`
- **Schema Sync**: Run `npx prisma generate` after schema changes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │ => │  Conversation    │ => │   AI Parser     │
│  Conversation   │    │   Intake Queue   │    │   (OpenAI)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌──────────────────┐             │
│  Extraction     │ <= │   Processing     │ <───────────┘
│  Results        │    │   Worker         │
└─────────────────┘    └──────────────────┘
         │
         v
┌─────────────────┐    ┌──────────────────┐
│  Review Tasks   │    │  Auto-linking    │
│  (if needed)    │    │  to Candidates   │
└─────────────────┘    └──────────────────┘
```

## Development

### Adding New Extraction Fields

1. Update the AI prompt in `conversation-ai-parser.service.ts`
2. Add fields to the `ConversationAnalysis` schema
3. Update the processing logic in `conversation-extraction.processor.ts`

### Custom AI Prompts

Modify the system prompt in `conversation-ai-parser.service.ts` to:
- Change extraction focus
- Add domain-specific knowledge
- Adjust output format

### Queue Monitoring

```bash
# Check queue status
redis-cli KEYS "bull:conversation-extraction:*"

# View active jobs
redis-cli LRANGE "bull:conversation-extraction:active" 0 -1
```

## Support

For issues with:
- **OpenAI API**: Check OpenAI status and documentation
- **Queue System**: Review BullMQ documentation
- **Database**: Check Prisma documentation
- **Worker**: Check NestJS logs and error messages