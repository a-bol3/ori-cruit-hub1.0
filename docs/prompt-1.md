You are a senior full-stack architect and staff-level engineer.

Your task is to generate a complete production-ready monorepo for a web application called ORI-CRUIT-HUB 1.0.

## PRODUCT CONTEXT

ORI-CRUIT-HUB is a recruitment operations system for a staffing/recruitment workflow where recruiters manually communicate with candidates mostly through WhatsApp, SMS, calls, and email, but there is NO WhatsApp Business API and NO live messaging API integration for now.

Instead, the system must support a file-ingestion workflow:

1. Recruiter exports or pastes WhatsApp conversations into .txt files.
2. Conversation files are named with this pattern:
  [yyyymmdd]-[phone]-[channel].txt
  Example:
  20260330-48796240947-wha.txt

3. Recruiter downloads candidate documents manually from WhatsApp and stores them in folders.
4. Documents may follow naming conventions like:
  Phone-Name-Surname-DocumentType-Version.ext
  Example:
  48796240947-Berenice-Maria-Hernandez-Ramirez-Paszport-1.pdf

5. The app must ingest these files, analyze them, extract usable information, match them to candidates, and create structured operational workflows.

The app must support current operational reality:
- manual WhatsApp conversation exports as .txt
- manual document downloads
- OneDrive/local folders as staging/intake sources
- Excel imports for legacy candidate databases
- no official APIs for WhatsApp for now
- future readiness for APIs later

## CORE PRODUCT GOAL

The app must transform messy operational inputs into structured recruitment workflows:

- imported conversations
- imported documents
- spreadsheet imports
- candidate matching
- extraction review
- status pipeline
- legal review queue
- coordinator handover queue
- reporting

The system should automate 80-90% of repetitive operational work while keeping risky decisions review-based.

## REQUIRED STACK

Use this exact stack unless absolutely necessary otherwise:

### Monorepo
- Turborepo
- pnpm workspaces

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- TanStack Table

### Backend
- NestJS
- Prisma
- PostgreSQL

### Background jobs
- Redis
- BullMQ

### File storage
- MinIO (S3-compatible private object storage)

### Infra / deployment
- Docker
- Docker Compose
- Caddy reverse proxy

### Auth
- JWT auth with role-based access control

## REQUIRED ROLES

Implement these roles:
- ADMIN
- RECRUITER
- LEGAL
- COORDINATOR
- MANAGER
- VIEWER

## REQUIRED CORE ENTITIES

Implement Prisma schema and corresponding backend modules for:

- User
- Candidate
- CandidateIdentifier
- CandidateAlias
- Offer
- CandidateOfferInterest
- CandidateConversation
- CandidateDocument
- CandidateDocumentVersion
- ExtractionResult
- MatchingDecision
- CandidateStatusHistory
- CandidateTask
- CandidateActivity
- LegalReview
- CoordinatorHandover
- CandidateIssue
- SpreadsheetImport
- SpreadsheetImportRow
- AuditLog

## REQUIRED ENUMS

Include enums for:
- UserRole
- SourceChannel
- CandidateStatus
- IdentifierType
- DocumentType
- DocumentReviewStatus
- ExtractionReviewStatus
- MatchType
- MatchResolutionStatus
- TaskStatus
- TaskType
- IssueType
- IssueStatus
- LegalReviewStatus
- HandoverStatus
- SpreadsheetImportStatus
- SpreadsheetImportType
- SourceEntityType

## REQUIRED CANDIDATE PIPELINE

Implement this candidate pipeline:

- NEW_LEAD
- CONTACT_PENDING
- CONTACTED
- INTERESTED
- NOT_INTERESTED
- WAITING_FOR_DOCUMENTS
- PARTIAL_DOCUMENTS
- READY_FOR_LEGAL_REVIEW
- LEGAL_REVIEW_IN_PROGRESS
- LEGAL_MORE_INFO_REQUIRED
- LEGAL_APPROVED
- LEGAL_REJECTED
- WAITING_PAYMENT_PROOF
- PAYMENT_PROOF_RECEIVED
- COORDINATOR_HANDOVER_PENDING
- COORDINATOR_NOTIFIED
- TRAVEL_PENDING
- ACCOMMODATION_PENDING
- PLACED
- POST_PLACEMENT_ISSUE
- CLOSED

## BUSINESS RULES

### File ingestion
The app must treat files as first-class operational inputs.

#### Conversation ingestion
- Accept .txt uploads
- Parse filename for date, phone, and channel
- Normalize text
- Store raw and normalized text
- Create AI/extraction summaries
- Create matching decisions
- Auto-link only when confidence is high

#### Document ingestion
- Accept PDF and image uploads
- Hash files
- Store files in MinIO
- Create logical document record + document versions
- OCR documents
- Classify document type
- Extract fields like name, number, issue/expiry dates, issuing country
- Match candidate using filename clues, OCR, and identifiers

#### Spreadsheet ingestion
- Upload Excel files
- Parse rows
- Preview before commit
- Suggest candidate linkage
- Create/update candidates only after resolution or confirmed commit

### Safety / review logic
- Never blindly overwrite high-risk identity/legal fields
- Store extracted values separately in ExtractionResult
- Use MatchingDecision to manage auto-link vs review states
- Use confidence thresholds
- Maintain full auditability

## REQUIRED MATCHING LOGIC

Implement a matching engine with weighted logic using:
- exact phone
- exact email
- exact passport/PESEL/visa/KP
- exact normalized full name
- name + nationality
- name + phone fragments
- fuzzy name matching

Confidence thresholds:
- >= 0.90 auto-link
- 0.70–0.89 review required
- < 0.70 unresolved

Make thresholds configurable.

## REQUIRED BACKEND MODULES

Generate NestJS modules for:

- auth
- users
- candidates
- candidate-identifiers
- offers
- conversations
- conversation-intake
- documents
- document-intake
- extraction
- matching
- pipeline
- tasks
- activities
- legal-review
- coordinator-handover
- issues
- spreadsheet-imports
- reports
- storage
- audit
- health
- queues

## REQUIRED API ENDPOINTS

Generate clean controllers, DTOs, services, and modules for:

### Auth
- POST /auth/login
- GET /auth/me

### Users
- GET /users
- POST /users
- PATCH /users/:id

### Candidates
- GET /candidates
- POST /candidates
- GET /candidates/:id
- PATCH /candidates/:id
- POST /candidates/:id/status
- GET /candidates/:id/timeline
- GET /candidates/:id/tasks
- POST /candidates/:id/tasks
- GET /candidates/:id/issues
- POST /candidates/:id/issues

### Candidate identifiers
- POST /candidates/:id/identifiers
- PATCH /identifiers/:id

### Conversations
- POST /intake/conversations/upload
- POST /intake/conversations/import-batch
- GET /conversations
- GET /conversations/:id
- POST /conversations/:id/reprocess
- POST /conversations/:id/link-candidate
- POST /conversations/:id/create-candidate

### Documents
- POST /intake/documents/upload
- POST /intake/documents/import-batch
- GET /documents
- GET /documents/:id
- PATCH /documents/:id/review
- POST /documents/:id/link-candidate
- POST /documents/:id/reprocess

### Extractions
- GET /extractions
- POST /extractions/:id/confirm
- POST /extractions/:id/reject

### Matches
- GET /matches
- POST /matches/:id/confirm
- POST /matches/:id/reject
- POST /matches/:id/create-candidate

### Legal reviews
- GET /legal-reviews
- POST /legal-reviews
- GET /legal-reviews/:id
- PATCH /legal-reviews/:id
- POST /legal-reviews/:id/start
- POST /legal-reviews/:id/request-info
- POST /legal-reviews/:id/approve
- POST /legal-reviews/:id/reject

### Coordinator handovers
- GET /handovers
- POST /handovers
- PATCH /handovers/:id
- POST /handovers/:id/notify
- POST /handovers/:id/complete

### Issues
- GET /issues
- POST /issues
- PATCH /issues/:id
- POST /issues/:id/resolve
- POST /issues/:id/close

### Spreadsheet imports
- POST /spreadsheet-imports/upload
- GET /spreadsheet-imports
- GET /spreadsheet-imports/:id
- GET /spreadsheet-imports/:id/rows
- POST /spreadsheet-imports/:id/commit
- POST /spreadsheet-import-rows/:id/link-candidate
- POST /spreadsheet-import-rows/:id/create-candidate
- PATCH /spreadsheet-import-rows/:id

### Reports
- GET /reports/dashboard
- GET /reports/recruitment
- GET /reports/legal
- GET /reports/coordinators
- GET /reports/management
- POST /reports/exports

### Audit
- GET /audit-logs

### Health
- GET /health/live
- GET /health/ready

## REQUIRED WORKER / QUEUE SETUP

Generate a separate worker app using BullMQ with processors for:
- conversation-intake
- conversation-extraction
- candidate-matching
- document-intake
- document-ocr
- document-classification
- document-extraction
- spreadsheet-parse
- spreadsheet-commit

Implement queue producers and processors in a clean scalable way.

## REQUIRED STORAGE SERVICE

Implement MinIO integration with:
- uploadObject
- deleteObject
- getSignedUrl
- object key builders for conversations, documents, spreadsheets, exports

Use safe private buckets.

## REQUIRED FRONTEND ROUTES

Generate a Next.js dashboard app with these routes:

- /login
- /app/dashboard
- /app/candidates
- /app/candidates/new
- /app/candidates/[id]
- /app/intake
- /app/intake/conversations
- /app/intake/documents
- /app/intake/spreadsheets
- /app/intake/review-queue
- /app/legal/reviews
- /app/legal/reviews/[id]
- /app/coordinators/handovers
- /app/coordinators/handovers/[id]
- /app/issues
- /app/reports/recruitment
- /app/reports/legal
- /app/reports/coordinators
- /app/reports/management
- /app/settings/users
- /app/settings/pipeline
- /app/settings/document-types
- /app/settings/import-rules

## REQUIRED FRONTEND SCREENS

The frontend must include:

### Dashboard
- top KPI cards
- recent imports
- unresolved review items
- my tasks

### Candidate list
- filters
- table
- status indicators
- missing docs indicators

### Candidate profile
Must include sections for:
- candidate header
- identity
- recruitment
- documents
- conversations
- legal
- coordinator handover
- issues
- timeline
- quick actions

### Intake screens
- upload conversations
- upload documents
- upload spreadsheets
- review queue

### Review queue
Unified review queue for:
- unmatched conversations
- low-confidence extractions
- unresolved document links
- duplicate risks
- spreadsheet row conflicts

### Legal screens
- legal review queue
- legal review detail

### Coordinator screens
- handover queue
- handover detail

### Reports screens
- recruitment
- legal
- coordinators
- management

## REQUIRED UI/UX RULES

- clean operational dashboard style
- serious enterprise UX
- no flashy decorative clutter
- optimize for speed and clarity
- always show current status clearly
- always show blockers clearly
- always expose missing documents
- provide fast actions near relevant data
- timeline must tell the operational story

## CODE QUALITY REQUIREMENTS

- generate complete files, not snippets
- production-grade TypeScript
- strong typing
- clear separation of concerns
- DTO validation with class-validator
- Zod where appropriate on frontend
- reusable utilities for:
 - phone normalization
 - name normalization
 - filename parsing
 - date parsing
 - hash calculation
 - document type inference
- keep services focused
- no giant god services
- no placeholder fake architecture
- no pseudo-code unless unavoidable
- where implementation is not fully possible, create robust scaffolding with TODO markers and interfaces

## INFRA REQUIREMENTS

Generate:
- docker-compose.yml for local dev
- docker-compose.prod.yml for production
- Caddy config
- .env.example
- MinIO service
- PostgreSQL service
- Redis service
- API service
- worker service
- web service

## SEEDING REQUIREMENTS

Generate seed scripts for:
- admin user
- recruiter user
- legal user
- coordinator user
- manager user
- a few offers
- a few sample candidates
- a few sample conversations/documents/imports for testing

## OUTPUT REQUIREMENTS

I want the full repo structure and the actual codebase, not a summary.

Generate:
1. monorepo structure
2. package.json files
3. Turborepo config
4. pnpm workspace config
5. Prisma schema
6. NestJS app
7. worker app
8. Next.js app
9. shared packages
10. Docker files
11. env examples
12. seed scripts
13. base UI
14. base API integrations
15. comments where helpful, but keep the code clean

## IMPORTANT IMPLEMENTATION PRIORITY

Build in this order:
1. monorepo foundation
2. Prisma schema
3. NestJS auth/users/candidates/pipeline
4. Next.js app shell and candidate pages
5. conversation intake flow
6. document intake flow
7. matching/extraction review
8. legal/coordinator modules
9. spreadsheet import flow
10. reports and polish

## FINAL INSTRUCTION

Generate the repository as if it is intended to be cloned, installed, run locally, and then deployed to a Hostinger VPS with Docker.

Do not give me vague guidance. Build the full scaffold and files.
