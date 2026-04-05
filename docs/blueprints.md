Full Monorepo Scaffolding Blueprint
Now the real scaffolding map.
This is the exact repo structure, package strategy, env layout, infrastructure shape, and implementation sequence I’d use.

1. Monorepo root structure
ori-cruit-hub/
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ worker/
├─ packages/
│  ├─ ui/
│  ├─ types/
│  ├─ validation/
│  ├─ config/
│  └─ prompts/
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ infra/
│  ├─ caddy/
│  │  └─ Caddyfile
│  ├─ docker/
│  │  ├─ api.Dockerfile
│  │  ├─ web.Dockerfile
│  │  └─ worker.Dockerfile
│  ├─ scripts/
│  │  ├─ dev-up.sh
│  │  ├─ prod-up.sh
│  │  ├─ backup-postgres.sh
│  │  └─ backup-minio.sh
│  └─ minio/
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
├─ docker-compose.prod.yml
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
└─ README.md

2. Apps structure
apps/web
apps/web/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  └─ forgot-password/
│  │  │     └─ page.tsx
│  │  ├─ (dashboard)/
│  │  │  └─ app/
│  │  │     ├─ layout.tsx
│  │  │     ├─ page.tsx
│  │  │     ├─ dashboard/
│  │  │     │  └─ page.tsx
│  │  │     ├─ candidates/
│  │  │     │  ├─ page.tsx
│  │  │     │  ├─ new/
│  │  │     │  │  └─ page.tsx
│  │  │     │  └─ [id]/
│  │  │     │     └─ page.tsx
│  │  │     ├─ intake/
│  │  │     │  ├─ page.tsx
│  │  │     │  ├─ conversations/
│  │  │     │  │  └─ page.tsx
│  │  │     │  ├─ documents/
│  │  │     │  │  └─ page.tsx
│  │  │     │  ├─ spreadsheets/
│  │  │     │  │  └─ page.tsx
│  │  │     │  └─ review-queue/
│  │  │     │     └─ page.tsx
│  │  │     ├─ legal/
│  │  │     │  └─ reviews/
│  │  │     │     ├─ page.tsx
│  │  │     │     └─ [id]/
│  │  │     │        └─ page.tsx
│  │  │     ├─ coordinators/
│  │  │     │  └─ handovers/
│  │  │     │     ├─ page.tsx
│  │  │     │     └─ [id]/
│  │  │     │        └─ page.tsx
│  │  │     ├─ issues/
│  │  │     │  ├─ page.tsx
│  │  │     │  └─ [id]/
│  │  │     │     └─ page.tsx
│  │  │     ├─ reports/
│  │  │     │  ├─ recruitment/
│  │  │     │  │  └─ page.tsx
│  │  │     │  ├─ legal/
│  │  │     │  │  └─ page.tsx
│  │  │     │  ├─ coordinators/
│  │  │     │  │  └─ page.tsx
│  │  │     │  └─ management/
│  │  │     │     └─ page.tsx
│  │  │     └─ settings/
│  │  │        ├─ users/
│  │  │        │  └─ page.tsx
│  │  │        ├─ pipeline/
│  │  │        │  └─ page.tsx
│  │  │        ├─ document-types/
│  │  │        │  └─ page.tsx
│  │  │        └─ import-rules/
│  │  │           └─ page.tsx
│  ├─ components/
│  ├─ features/
│  ├─ hooks/
│  ├─ lib/
│  ├─ types/
│  └─ styles/
├─ public/
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ postcss.config.js
└─ tailwind.config.ts
apps/api
apps/api/
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ config/
│  ├─ common/
│  ├─ prisma/
│  ├─ auth/
│  ├─ users/
│  ├─ candidates/
│  ├─ candidate-identifiers/
│  ├─ offers/
│  ├─ conversations/
│  ├─ conversation-intake/
│  ├─ documents/
│  ├─ document-intake/
│  ├─ extraction/
│  ├─ matching/
│  ├─ pipeline/
│  ├─ tasks/
│  ├─ activities/
│  ├─ legal-review/
│  ├─ coordinator-handover/
│  ├─ issues/
│  ├─ spreadsheet-imports/
│  ├─ reports/
│  ├─ storage/
│  ├─ audit/
│  ├─ health/
│  └─ queues/
├─ test/
├─ package.json
├─ tsconfig.json
└─ nest-cli.json
apps/worker
apps/worker/
├─ src/
│  ├─ main.ts
│  ├─ worker.module.ts
│  ├─ queues/
│  │  ├─ conversation-intake.processor.ts
│  │  ├─ conversation-extraction.processor.ts
│  │  ├─ candidate-matching.processor.ts
│  │  ├─ document-intake.processor.ts
│  │  ├─ document-ocr.processor.ts
│  │  ├─ document-classification.processor.ts
│  │  ├─ document-extraction.processor.ts
│  │  ├─ spreadsheet-parse.processor.ts
│  │  └─ spreadsheet-commit.processor.ts
│  ├─ services/
│  │  ├─ filename-parser.service.ts
│  │  ├─ text-normalizer.service.ts
│  │  ├─ extraction-engine.service.ts
│  │  ├─ matching-engine.service.ts
│  │  ├─ spreadsheet-parser.service.ts
│  │  └─ ocr.service.ts
│  └─ shared/
├─ package.json
└─ tsconfig.json

3. Shared packages
packages/ui
Shared UI components for the frontend.
packages/ui/
├─ src/
│  ├─ button.tsx
│  ├─ card.tsx
│  ├─ badge.tsx
│  ├─ section-card.tsx
│  ├─ status-badge.tsx
│  ├─ confidence-badge.tsx
│  ├─ empty-state.tsx
│  └─ index.ts
├─ package.json
└─ tsconfig.json
packages/types
Shared TS types between web and api where useful.
packages/types/
├─ src/
│  ├─ auth.ts
│  ├─ candidate.ts
│  ├─ conversation.ts
│  ├─ document.ts
│  ├─ review.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json
packages/validation
Shared schemas and helpers.
packages/validation/
├─ src/
│  ├─ candidate.ts
│  ├─ identifiers.ts
│  ├─ upload.ts
│  ├─ common.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json
packages/config
Shared constants/config.
packages/config/
├─ src/
│  ├─ statuses.ts
│  ├─ document-types.ts
│  ├─ queues.ts
│  ├─ roles.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json
packages/prompts
Prompt templates for extraction/summarization.
packages/prompts/
├─ src/
│  ├─ conversation-summary.ts
│  ├─ document-extraction.ts
│  ├─ legal-summary.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json

4. Root package.json
Recommended scripts:
{
 "name": "ori-cruit-hub",
 "private": true,
 "packageManager": "pnpm@10",
 "scripts": {
   "dev": "turbo run dev",
   "build": "turbo run build",
   "lint": "turbo run lint",
   "test": "turbo run test",
   "format": "turbo run format",
   "db:generate": "prisma generate --schema=./prisma/schema.prisma",
   "db:migrate": "prisma migrate dev --schema=./prisma/schema.prisma",
   "db:deploy": "prisma migrate deploy --schema=./prisma/schema.prisma",
   "db:seed": "tsx prisma/seed.ts",
   "docker:up": "docker compose up -d",
   "docker:down": "docker compose down",
   "docker:prod": "docker compose -f docker-compose.prod.yml up -d --build"
 },
 "devDependencies": {
   "prisma": "^6.0.0",
   "turbo": "^2.0.0",
   "tsx": "^4.0.0",
   "typescript": "^5.0.0"
 }
}

5. pnpm-workspace.yaml
packages:
 - "apps/*"
 - "packages/*"

6. turbo.json
{
 "$schema": "https://turbo.build/schema.json",
 "tasks": {
   "dev": {
     "cache": false,
     "persistent": true
   },
   "build": {
     "dependsOn": ["^build"],
     "outputs": [".next/**", "dist/**"]
   },
   "lint": {
     "dependsOn": ["^lint"]
   },
   "test": {
     "dependsOn": ["^test"]
   },
   "format": {
     "cache": false
   }
 }
}

7. Environment blueprint
Root .env.example
# Core
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ori_cruit_hub

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=change_me_super_secret
JWT_EXPIRES_IN=7d

# API
API_PORT=4000
API_BASE_URL=http://localhost:4000

# Web
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_CONVERSATIONS=candidate-conversations
MINIO_BUCKET_DOCUMENTS=candidate-documents
MINIO_BUCKET_SPREADSHEETS=spreadsheet-imports
MINIO_BUCKET_EXPORTS=exports
MINIO_USE_SSL=false

# MinIO Console
MINIO_CONSOLE_PORT=9001

# OCR / AI placeholders
OCR_PROVIDER=local
LLM_PROVIDER=openai
OPENAI_API_KEY=

# Caddy / Domain
APP_DOMAIN=localhost
API_DOMAIN=localhost

8. Docker compose blueprint
Local docker-compose.yml
Services:
postgres
redis
minio
minio-init
api
worker
web
Suggested shape:
services:
 postgres:
   image: postgres:16
   environment:
     POSTGRES_DB: ori_cruit_hub
     POSTGRES_USER: postgres
     POSTGRES_PASSWORD: postgres
   ports:
     - "5432:5432"
   volumes:
     - pg_data:/var/lib/postgresql/data

 redis:
   image: redis:7
   ports:
     - "6379:6379"

 minio:
   image: minio/minio:latest
   command: server /data --console-address ":9001"
   environment:
     MINIO_ROOT_USER: minioadmin
     MINIO_ROOT_PASSWORD: minioadmin
   ports:
     - "9000:9000"
     - "9001:9001"
   volumes:
     - minio_data:/data

 minio-init:
   image: minio/mc:latest
   depends_on:
     - minio
   entrypoint: >
     /bin/sh -c "
     mc alias set local http://minio:9000 minioadmin minioadmin &&
     mc mb -p local/candidate-conversations || true &&
     mc mb -p local/candidate-documents || true &&
     mc mb -p local/spreadsheet-imports || true &&
     mc mb -p local/exports || true
     "

volumes:
 pg_data:
 minio_data:
For local dev, run web/api/worker either in Docker or locally from terminal.
My honest recommendation: DB/Redis/MinIO in Docker, apps locally during dev.

Production docker-compose.prod.yml
Services:
postgres
redis
minio
api
worker
web
caddy
Use named networks and restart policies.

9. Caddy blueprint
infra/caddy/Caddyfile
app.example.com {
 reverse_proxy web:3000
}

api.example.com {
 reverse_proxy api:4000
}
For local dev you may not need Caddy at all.
For VPS production:
app.yourdomain.com → web
api.yourdomain.com → api

10. Prisma scaffolding order
Inside prisma/schema.prisma, add models in this order:
User
Candidate
CandidateIdentifier
CandidateAlias
Offer
CandidateOfferInterest
CandidateConversation
CandidateDocument
CandidateDocumentVersion
ExtractionResult
MatchingDecision
CandidateStatusHistory
CandidateTask
CandidateActivity
LegalReview
CoordinatorHandover
CandidateIssue
SpreadsheetImport
SpreadsheetImportRow
AuditLog
That order avoids dumb migration friction.

11. API module scaffolding order
This is the smartest NestJS build order.
Phase 1
prisma
auth
users
candidates
candidate-identifiers
activities
pipeline
Phase 2
conversations
conversation-intake
matching
extraction
Phase 3
storage
documents
document-intake
Phase 4
tasks
legal-review
coordinator-handover
issues
Phase 5
spreadsheet-imports
reports
audit
health
That’s the right rhythm.

12. Frontend scaffolding order
Phase 1
app shell
sidebar
topbar
login page
dashboard skeleton
Phase 2
candidates list
candidate profile layout
status badge
timeline component
Phase 3
conversation intake page
conversation list/detail
matching panel
extraction panel
Phase 4
document intake page
document review page
preview panel
Phase 5
legal queue/detail
handover queue/detail
issues list/detail
Phase 6
spreadsheet import UI
review queue
reports
settings

13. Backend file-level blueprint
Example for candidates module:
apps/api/src/candidates/
├─ candidates.module.ts
├─ candidates.controller.ts
├─ candidates.service.ts
├─ dto/
│  ├─ create-candidate.dto.ts
│  ├─ update-candidate.dto.ts
│  ├─ candidate-query.dto.ts
│  └─ change-candidate-status.dto.ts
├─ mappers/
│  └─ candidate.mapper.ts
└─ policies/
  └─ candidate-access.policy.ts
Example for conversation-intake:
apps/api/src/conversation-intake/
├─ conversation-intake.module.ts
├─ conversation-intake.controller.ts
├─ conversation-intake.service.ts
├─ dto/
│  ├─ upload-conversation.dto.ts
│  └─ import-conversation-batch.dto.ts
└─ utils/
  └─ parse-conversation-filename.ts

14. Worker blueprint
Each processor should be narrow.
Example queue processors
conversation-intake.processor.ts
normalize raw conversation
queue extraction
queue matching
conversation-extraction.processor.ts
extract summary, intent, facts
candidate-matching.processor.ts
score candidate matches
create MatchingDecision
auto-link if threshold allows
document-ocr.processor.ts
OCR the file
save text to document version
document-classification.processor.ts
classify doc type from filename + OCR
document-extraction.processor.ts
extract fields
create ExtractionResult rows
spreadsheet-parse.processor.ts
parse workbook
create SpreadsheetImportRow records
spreadsheet-commit.processor.ts
apply approved actions

15. Seed blueprint
prisma/seed.ts should create:
Users
admin
recruiter
legal
coordinator
manager
Offers
3–5 sample offers
Candidates
5–10 realistic sample candidates
Conversations
3 sample imported .txt conversations
Documents
3–5 sample document records
Spreadsheet imports
1 sample import batch with rows
This makes local testing much smoother.

16. README blueprint
Your root README.md should include:
Sections
project overview
stack
repo structure
local prerequisites
env setup
run local infra
run db migration
seed database
run api
run worker
run web
docker production deploy
future roadmap
That README will save future-you.

17. First commands you should run
Once scaffolded:
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
During app-specific work, likely:
web on 3000
api on 4000
MinIO on 9000/9001
Postgres on 5432
Redis on 6379

18. Best dev workflow
My honest recommendation:
On your unrestricted machine
Develop locally with:
VS Code
apps running locally
infra in Docker
That means:
web local
api local
worker local
postgres/redis/minio in Docker
This is way less annoying than full-container dev at first.
On Hostinger VPS
Deploy:
postgres
redis
minio
api
worker
web
caddy
all in Docker Compose.

19. Build priorities inside the scaffold
Do not try to fill every page immediately.
After scaffolding, implement this in order:
Priority 1
Candidate CRUD + auth + app shell
Priority 2
Status transitions + timeline
Priority 3
Conversation .txt intake
Priority 4
Matching + extraction review
Priority 5
Document intake + OCR pipeline
Priority 6
Legal + handover
Priority 7
Spreadsheet imports
That order stays undefeated for your use case.

20. What not to overbuild in scaffold v1
Don’t waste early time on:
fancy chart engine
advanced notification center
dark mode obsession
public marketing website
perfect design system
mobile app
live chat
multilingual infra from day one unless needed immediately
Get the ops engine working first.
