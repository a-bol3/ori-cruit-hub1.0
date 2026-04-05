1. What ORI-CRUIT-HUB 1.0 should be
ORI-CRUIT-HUB should be a web app, not a desktop-first app.
Why:
Hostinger VPS is well suited to run a Dockerized web stack, and Hostinger documents that its Ubuntu 24.04 VPS Docker template comes with docker-ce and docker-compose preinstalled. Hostinger also offers Docker management features and full root access on VPS plans.
That means your best architecture is:
browser app for daily use
backend API
database
file storage
automation worker
AI services
optional WhatsApp/SMS/email integrations
Not a local-only tool.
2. The real goal
You do not want to automate everything.
You want to automate the parts that are:
repetitive
slow
error-prone
dependent on copy-paste
dangerous from a compliance perspective
The goal is for 80–90% of your workflow to become system-driven, while you only intervene in exceptions:
unclear documents
legal edge cases
candidate objections
special human situations
escalations with coordinators
That is the only sane setup.
3. What you need
Core infrastructure
You need:
A VPS on Hostinger
A domain or subdomain
Docker-based deployment
SSL
Database
Object/file storage
Email sending
Monitoring/logging
Backups
AI extraction layer
Integrations with HRappka + WhatsApp/SMS/email
Hostinger supports Ubuntu VPS, Docker deployment, and Docker project management, so your VPS can absolutely be the production base for this app.
Development environment on your unrestricted machine
On your other computer, install:
VS Code
Git
Node.js LTS
pnpm
Docker Desktop
PostgreSQL client tools
Postman or Insomnia
Python
a modern browser
optional: n8n locally for automation testing
That machine becomes your build lab.
Your work laptop becomes just an access terminal through the browser.
4. Recommended architecture
This is the version I’d build.
Frontend
Use:
Next.js
TypeScript
Tailwind
shadcn/ui
Why:
fast, clean, scalable, easy to deploy, and great for dashboard UX.
Backend
Use:
NestJS or FastAPI
My opinion:
For your use case, I’d pick NestJS if you want a long-term product with clean modules, RBAC, queues, and integrations.
I’d pick FastAPI only if you want faster MVP speed and more Python-native AI work.
For ORI-CRUIT-HUB, I lean NestJS.
Database
Use:
PostgreSQL
ORM
Use:
Prisma if NestJS
SQLModel / SQLAlchemy if FastAPI
File storage
Use one of these:
MinIO on the VPS for private S3-compatible storage
or Cloudflare R2 / AWS S3 if you want less storage ops headache
For sensitive ID files, I’d strongly favor:
encrypted private object storage
signed URLs
strict access policies
no casual public links
Background jobs
Use:
Redis
BullMQ if NestJS
This is mandatory for:
OCR jobs
parsing documents
reminders
syncing with HRappka
bulk exports
scheduled reports
Reverse proxy / SSL
Use:
Caddy or Traefik
On Hostinger, Docker + reverse proxy is a very natural fit. Their Docker stack and catalog are built around containerized deployment flows.
5. Core modules the app must have
This is the backbone.
A. Lead Intake Hub
This module ingests leads from:
website form
HRappka export/API
manual entry
email parsing
CSV import
later: ad lead connectors
It should:
deduplicate by phone/email/passport candidate match rules
assign source
assign recruiter
assign language
generate candidate ID
create timeline event automatically
B. Candidate 360 Profile
One screen per candidate.
Must include:
personal data
nationality
languages
contact channels
applied offers
legal status
work availability
accommodation status
payment proof status
coordinator assignment
document checklist
conversation summary
internal notes
task list
event history
This becomes your real command center.
C. Document Intelligence Module
This is one of the biggest wins.
It should:
upload passport, visa, karta pobytu, PESEL docs, payment screenshots, contracts
classify document type
OCR the content
extract fields
flag missing or inconsistent info
score confidence
mark “manual review needed” if uncertain
auto-fill structured fields when confidence is high
D. Conversation Assistant
This is not “full AI autopilot.”
This is a recruiter copilot.
It should:
summarize WhatsApp/email threads
suggest reply drafts in Spanish, English, or Polish
detect candidate intent
detect missing documents
detect next best action
generate follow-up reminders
build candidate-ready messages from templates
This is where you save crazy time.
E. Pipeline / Status Engine
Every candidate must move through a controlled workflow.
Example:
New lead
Contacted
Interested
Waiting for documents
Documents partially received
Ready for legal review
Legal reviewing
Approved
Rejected
Waiting for payment proof
Coordinator notified
Travel pending
Accommodation assigned
Closed
Support / issue case
Every status change should:
create a history event
notify the right person
unlock the next action
update reporting automatically
F. Legal Review Queue
This is critical.
Legal should not receive chaos.
Legal should receive a clean review package:
candidate summary
required docs
extracted fields
missing fields
flagged issues
prior notes
approval / reject / request-more-docs actions
G. Coordinator Handover Module
Once approved:
coordinator gets candidate packet
readiness date
housing date
location/project info
transport/accommodation needs
notes
No more scattered back-and-forth.
H. Issue / Post-Recruitment Case Module
Since these “not my job but it lands on me” issues keep happening, build a lightweight case module:
payroll issue
coordinator issue
rules/contract issue
housing issue
communication issue
That keeps these cases visible and separate from pure recruitment.
I. Reporting & BI
Dashboards for:
leads by source
conversion by recruiter
document completion rate
approval rate
legal bottlenecks
time-to-placement
pending coordinator handovers
missing-doc trends
nationality/language mix
workload per recruiter
6. Integrations you should plan from day one
HRappka
This matters a lot.
HRappka’s official knowledge base states that its API supports retrieving and sending recruitment data, pulling recruitment offers, and even sending candidate data from a custom recruitment form into HRappka. The documentation also references questionnaire answers and consent handling.
So your app should support two modes:
Mode 1: Export-sync mode
import HRappka Excel exports
normalize data
sync candidate states
Mode 2: API-sync mode
read jobs/offers from HRappka
push or update candidate data
sync statuses
sync questionnaire fields
sync consent metadata
This is huge because it means your app does not need to replace HRappka on day one.
It can sit on top of it and progressively become the better operating layer.
SMS
HRappka also documents SMS integrations and notes SMS can be sent from candidate/employee contact history and automation contexts in some cases.
That gives you two paths:
send SMS through HRappka if the company prefers it
or use your own SMS provider from ORI-CRUIT-HUB
WhatsApp
This is the hard truth:
Do not build on regular WhatsApp automation hacks.
WhatsApp’s Messaging Guidelines explicitly prohibit harmful automation patterns such as unofficial clients, bulk messaging, auto-messaging, auto-dialing, scraping, and adversarial abuse.
If you want proper automation, the correct route is the WhatsApp Business Platform, which WhatsApp presents as its enterprise API layer for lead generation, support, promotions, notifications, verification, and CRM-style integrations.
So your long-term plan should be:
Phase 1: recruiter-assist only for WhatsApp
Phase 2: official WhatsApp Business Platform integration if the business approves it
That’s the safe path.
7. AI stack I recommend
You asked for no limitations, so here’s the real stack.
For OCR and document extraction
Use:
OCRmyPDF + Tesseract for PDFs
PaddleOCR or EasyOCR for images
optional: Google Document AI / Azure Document Intelligence later if you want enterprise-grade extraction
For LLM tasks
Use one of these models behind your app:
OpenAI for best quality
Claude for long reasoning and doc analysis
local fallback only for basic offline experiments
Use AI for:
message draft generation
conversation summarization
missing-doc detection
candidate classification
offer matching
internal note generation
legal review prep summaries
For document rules
Do not rely only on AI.
Use:
deterministic regex
date validators
document-specific field validators
confidence thresholds
human review queues
That hybrid logic is the move.
8. Security and compliance: non-negotiable
You handle passport and immigration-related data. So this part is serious.
GDPR’s core principles include lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, storage limitation, and integrity/confidentiality. Recruitment guidance from the ICO also explicitly frames recruitment as personal-data processing that must be handled under data protection law.
So ORI-CRUIT-HUB must include:
role-based access control
audit log
encrypted secrets
HTTPS everywhere
signed file access
retention rules
soft delete + archive policy
consent tracking
document access logging
recruiter/legal/coordinator permission separation
no random local file dumping
This is not optional.
9. Recommended product phases
Phase 1 — Foundation MVP
Goal: replace the chaos
Build:
auth
roles
candidate database
offer database
document upload
status pipeline
notes/tasks/history
dashboards
CSV/Excel import
export views
HRappka import sync
AI summarizer
AI reply drafts
This alone will already change your life.
Phase 2 — Smart automation
Goal: reduce manual work hard
Build:
OCR + extraction
auto-link docs to candidates
missing-doc detection
reminder engine
legal queue
coordinator handover flow
scheduled reports
email parsing
duplicate detection
suggested next actions
Phase 3 — External communication engine
Goal: conversation control
Build:
official SMS gateway
email templates/sequences
WhatsApp Business Platform integration if approved
multilingual template library
delivery tracking
follow-up automation
Phase 4 — Full intelligence layer
Goal: become decision engine
Build:
source quality scoring
recruiter performance analytics
offer-to-candidate matching
bottleneck detection
forecast dashboards
operational alerts
compliance reports
AI case triage
10. What I would deploy on your Hostinger VPS
My recommended production stack:
Next.js frontend
NestJS API
PostgreSQL
Redis
MinIO
Caddy
Worker service
Optional n8n
Optional Metabase / Superset for analytics
Sentry / uptime monitoring
All inside Docker.
That’s clean, modern, and realistic for a Hostinger VPS environment that supports Dockerized projects and Ubuntu-based VPS deployments.
11. What you need from the business side
Even if you build it yourself, you still need a few company-level decisions:
access to HRappka API or at least reliable exports
approved data retention rules
definition of user roles
definition of official statuses
decision on who can see what
decision on whether WhatsApp Business Platform is allowed later
decision on which communication channels are official
agreement on “single source of truth”
Without that, the app works technically, but politically it gets messy.
12. My recommendation for version 1.0
Build ORI-CRUIT-HUB 1.0 as:
a browser-based recruitment operations system that sits above HRappka, centralizes candidate data, automates document handling, standardizes status changes, and gives you AI-assisted communication and reporting.
That is the smartest first move.
Not:
full HRappka replacement on day one
desktop app
WhatsApp automation hacks
“just a CRM”
“just an AI chatbot”
No.
Build the system around the actual operational pain.
13. Exact shopping list
You need:
Hostinger VPS
a domain/subdomain
unrestricted dev machine
VS Code
GitHub repo
Docker
Node.js + pnpm
PostgreSQL
Redis
MinIO
reverse proxy
email provider / SMTP
OpenAI or another LLM provider
OCR stack
HRappka API credentials or export process
later: SMS provider
later: official WhatsApp Business Platform path
14. What I would do first, in order
Define the data model
Define the recruitment statuses
Define the user roles
Define the candidate profile structure
Define the document types and required fields
Define HRappka sync strategy
Scaffold the monorepo
Build Phase 1 MVP
Deploy to Hostinger in Docker
Iterate with real recruiter usage data
That’s the move.
The next best step is for me to turn this into a full implementation blueprint for ORI-CRUIT-HUB 1.0 with:
folder structure
database schema
module map
route map
API contract
VPS deployment architecture
phased build roadmap
Before "full implementation blueprint for ORI-CRUIT-HUB 1.0" te explico la situacion con whatsapp: - si, no poseo, ni la empresa tiene planes de hacerlo, una cuenta whatsapp busineess. por lo que la estrategia seria copiar las conversaciones en un .txt, archivarlas en OneDrive folder (01_INBOX_TXT u otra carpeta de mi FOLGA_AUTOMATIZACION, que ya existe esta sub carpeta alli), correr un script de python que ya renombra los archivos automaticamente con formato [yyyymmdd-telephone-channel.txt] - como ejemplo [20260330-48796240947-wha.txt], y que el sistema se encargue de analizar la conversacion, extraer datos validos si existen y actualizar 'Base_Candidatos_Folga.xlsx' con info inicial. En otra carpeta archivo los documentos enviados por los candidatos desde whatsapp, solo que esta vez descargo los documentos en una carpeta, y el renombrado (siguiendo misma logica del caso anterior -'NameSurname-DocType-ext' por ejemplo 'Berenice-Maria-Hernandez-Ramirez-paszport3.pdf', se contemplan diferentes extensiones de imagenes y soportan diferentes versiones del mismo documento dado que pueden haber multiples paginas del mismo ... paszport1, ...paszport2, etc). Estos documentos se guardanrian en una carpeta automaticamente creada para ese candidato, y los archivos dentro de ella, o, todos los archivos se catalogan dentro de diferentes carpetas dedicadas a diferentes documentos, tal y como ya tengo en mi OneDrive creado. Luego la app compaginaria todos estos datos y completaria la informacion faltante, contrastando y correlacionando con el candidato en cuestion. Tampoco tengo autorizacion para usar APIs, aunque de momento. Podriamos preparar el terreno para una futura inclusion si dan el visto bueno por parte de la empresa, y de momento resolver con lo que tenemos. Que podemos hacer para incluir una estrategi similar, pero dentro de la app (o en OneDrive de no ser posible con la app o que requiera mayor dificultad y riesgo para ejecutar?) El resto de lo que propones me parece estupendo. Yo iria con Prisma, NestJS, MinIO on the VPS for private S3-compatible storage ya que tengo Hostinger VPS, BullMQ Please write in English language.
Yes — this can absolutely be built into ORI-CRUIT-HUB 1.0 without WhatsApp Business and without external APIs.
And honestly, this is the smartest workaround for your current reality.
You already have the raw ingredients of a solid system:
exported WhatsApp conversations as .txt
downloaded candidate documents
structured OneDrive folders
naming conventions
Excel base files
a future VPS where the real app can live
So instead of fighting for blocked APIs, we design the app around a file-ingestion workflow.
That means:
WhatsApp stays manual at the point of communication, but everything after that becomes systemized.
That is a very strong Phase 1 strategy.

The right model for your situation
You do not need direct WhatsApp integration right now.
You need this:
Input layer
You manually place:
conversation .txt files into OneDrive
downloaded candidate documents into watched folders
Processing layer
ORI-CRUIT-HUB reads those files, interprets them, links them to the right candidate, extracts useful data, and proposes updates.
Validation layer
You review only the uncertain or risky parts.
Output layer
The app updates:
candidate profile
document checklist
candidate status
recruitment notes
Excel export / sync layer
future HRappka-ready payloads
That is the move.

My recommendation: build a “File-to-Candidate Intelligence Engine”
This should be one of the core engines inside ORI-CRUIT-HUB.
I would structure it like this:
1. Inbox channels inside the app
The app should support these ingestion channels:
A. Conversation Inbox
For .txt files like:
20260330-48796240947-wha.txt
B. Document Inbox
For raw files downloaded from WhatsApp:
pdf
jpg
jpeg
png
webp
C. Manual Imports
For:
Excel
CSV
HRappka exports
legacy files

2. Two operating modes
You should design the app with both modes from day one.
Mode A — No-admin / no-API / current reality
This is your present setup.
You manually:
export/copy WhatsApp conversation to .txt
place it in OneDrive folder
save documents to OneDrive folder
Then the app:
detects new files
parses them
extracts candidate signals
matches candidate record
updates internal database
suggests missing fields
generates action items
Mode B — Future API mode
Later, if the company approves:
HRappka API
WhatsApp Business Platform
Outlook/Graph integration
document upload automation
So we design now in a way that keeps your system future-proof.
That means connectors must be modular.

3. Best strategy for your WhatsApp workaround
Your workaround is actually good.
I would formalize it like this:
Step 1 — Manual export of conversation
You save or paste the conversation into a .txt.
Step 2 — Naming normalization
Your Python renamer keeps this standard:
[yyyymmdd]-[phone]-[channel].txt
Example:
20260330-48796240947-wha.txt
Perfect. Keep it.
I would only standardize the channel codes:
wha = WhatsApp
sms = SMS
eml = email
call = call summary
web = website form intake
man = manual note
That gives the app a clean ingest format.
Step 3 — Conversation analysis
The app reads the .txt and extracts:
phone number
candidate name
nationality
language
gender if clearly stated
location / current country
interest level
offer/project mentioned
availability date
documents mentioned
legal status clues
payment mention
travel mention
accommodation mention
open questions
missing information
candidate intent
urgency
last recruiter action
last candidate action
recommended next action
Step 4 — Candidate matching
The app tries to match the conversation to:
existing phone number
exact candidate name
probable candidate via name + phone fragment
candidate created from Excel import
candidate already seen in another file
Step 5 — Confidence score
Every extraction should have confidence:
high confidence → auto-apply
medium confidence → suggest review
low confidence → leave as draft only
This is critical.
You do not want AI writing garbage directly into your database.

4. Document workflow strategy
You described two possible paths:
candidate-specific folder
document-type folders
Both are valid, but for the app I strongly recommend this hybrid logic:
Recommended physical storage
In the real app:
store the final files in object storage or structured archive
keep metadata in PostgreSQL
let the app decide how they are viewed
Recommended import logic for now
Since you already use OneDrive, keep your current folder strategy for ingestion.
Example:
02_DOCUMENTOS/2_Clasificados/PASAPORTE/
02_DOCUMENTOS/2_Clasificados/VISA/
02_DOCUMENTOS/2_Clasificados/KP/
02_DOCUMENTOS/2_Clasificados/PAGOS/
This is fine for the import stage.
Then ORI-CRUIT-HUB should:
read the filename
infer candidate
infer document type
generate version number
attach the file to candidate record
build a normalized internal document record
So even if files live in document-type folders on OneDrive, the app internally reconstructs a candidate-centric profile.
That gives you the best of both worlds.

5. Naming convention for documents
Your proposed naming strategy is good.
I would standardize it more aggressively:
Recommended filename pattern
Name-Surname-DocumentType-Version.ext
Example:
Berenice-Maria-Hernandez-Ramirez-Paszport-1.pdf
Berenice-Maria-Hernandez-Ramirez-Paszport-2.jpg
Berenice-Maria-Hernandez-Ramirez-Visa-1.png
Berenice-Maria-Hernandez-Ramirez-PaymentProof-1.jpg
Even better, if possible add a phone or candidate ID:
48796240947-Berenice-Maria-Hernandez-Ramirez-Paszport-1.pdf
That would massively reduce ambiguity.
My opinion:
phone number or internal candidate code should be in the filename whenever possible.
Because names alone will collide sooner or later.

6. How this should work inside the app
This is the clean app flow.
Module: Intake Processor
A. File Watcher / Upload Entry
The app should accept files from either:
direct drag-and-drop upload
manual upload button
watched sync folder process
batch folder ingestion
B. Parsing Engine
The backend reads:
filename
extension
folder path
timestamps
file hash
C. Candidate Resolver
It attempts candidate matching using:
phone
exact full name
normalized full name
similar name
prior linked conversation
Excel base records
D. Content Extractor
For .txt:
parse text
identify speaker pattern if possible
segment recruiter vs candidate
detect facts and intent
For documents:
OCR if image/PDF
classify document
extract fields
compare with current profile
E. Decision Engine
The system decides:
auto-link
suggest-link
unresolved item
duplicate document
newer version
missing pages
mismatch alert
F. Review Queue
You review only:
unresolved candidate match
low-confidence extraction
conflicting data
unreadable file
suspicious document mismatch

7. What to do with OneDrive
Yes, you can include OneDrive in the strategy.
But here’s the real distinction:
Option 1 — OneDrive as staging area
Best for Phase 1.
You keep using OneDrive folders exactly as you do now.
Then ORI-CRUIT-HUB imports from that structure.
This is safer and easier.
Option 2 — OneDrive as semi-permanent archive
Possible, but not ideal long term.
Because eventually you want:
app-level access control
audit logs
version tracking
cleaner data model
less dependency on file chaos
Option 3 — App storage becomes the source of truth
Best long term.
OneDrive becomes optional or backup/export only.
Files live in MinIO.
The app controls all metadata.
My recommendation:
Phase 1
Use OneDrive as staging + operational fallback.
Phase 2
Move toward MinIO as source of truth.

8. Best architecture for your chosen stack
Since you want:
Prisma
NestJS
MinIO
BullMQ
That is exactly the correct stack for this.
Proposed architecture
Frontend
Next.js
TypeScript
Tailwind
shadcn/ui
Backend
NestJS
Database
PostgreSQL + Prisma
Queue
Redis + BullMQ
Storage
MinIO
AI
LLM provider for summaries and extraction logic
OCR layer for docs/images
Workers
Separate worker processes for:
conversation parsing
document OCR
document classification
candidate matching
Excel sync/export
report generation
This is very strong.

9. Key modules to add because of your WhatsApp workaround
Before the full blueprint, these modules are now mandatory.
A. Conversation Import Module
Handles:
.txt upload
validation
filename parsing
text parsing
candidate matching
summary generation
extracted fields
next-step suggestions
B. Document Import Module
Handles:
bulk upload
folder upload
classification
OCR
field extraction
page grouping
versioning
candidate linking
C. Candidate Resolution Engine
This becomes one of the most important pieces in the entire app.
Because your data enters from messy sources.
It must support:
exact matching
fuzzy matching
alias matching
phone normalization
duplicate prevention
manual resolution queue
D. Excel Sync Engine
Since your company still works heavily with Excel, the app must not ignore that reality.
It should:
import Base_Candidatos_Folga.xlsx
compare rows to internal database
suggest updates
export structured sheets for different teams
avoid duplicate manual rewriting
E. Review Dashboard
A dashboard just for exceptions:
unresolved files
ambiguous candidate matches
low-confidence extractions
missing required docs
status conflicts
coordinator handover pending
That dashboard will save you stupid amounts of time.

10. Data strategy: what gets auto-written vs suggested
This part matters a lot.
Do not auto-write everything.
Safe to auto-write
Usually:
file metadata
upload time
source channel
normalized phone
detected document type
generated summary
internal tags
extracted low-risk notes
Suggest-only until reviewed
Usually:
passport number
visa number
PESEL
karta pobytu number
legal status
work eligibility
payment confirmation status
final approval flags
coordinator assignment
travel date if uncertain
That balance keeps the system useful without becoming dangerous.

11. Folder strategy I recommend right now
Given your current setup, I’d use this:
OneDrive folders as ingestion zones
Conversations
/FOLGA_AUTOMATIZACIÓN/01_INBOX_TXT/
Raw attachments
/FOLGA_AUTOMATIZACIÓN/02_INBOX_EMAIL_ATTACHMENTS/
Classified documents
/FOLGA_AUTOMATIZACIÓN/02_DOCUMENTOS/2_Clasificados/
Subfolders:
PASAPORTE
VISA
KP
PAGOS
SIGNATURES
OTROS
This is already decent.
Then the app imports and normalizes everything into its own internal structure.
That means:
don’t overcomplicate OneDrive now.
Use it as the intake rail.

12. How to execute this technically
You asked whether this should happen in the app or in OneDrive.
My answer:
Best setup
Use OneDrive for intake
and
use the app for intelligence + normalization + decisions
So:
OneDrive is not the brain
OneDrive is the drop zone
ORI-CRUIT-HUB is the brain
That is the clean design.

13. Two implementation routes
Route A — App-only import flow
You manually upload files into ORI-CRUIT-HUB.
Pros:
simpler architecture
less dependency on OneDrive sync weirdness
easier audit trail
Cons:
more manual clicking
Route B — OneDrive-assisted ingestion flow
You drop files in your current OneDrive folders, then a sync/import service processes them.
Pros:
fits your current habit
minimal behavioral change
easier transition
Cons:
more moving parts
file sync edge cases
watcher/import complexity
My recommendation
Start with Route B for transition, then later add Route A inside the app.
That gives you adoption speed without losing long-term product quality.

14. What I would build first because of this new info
Before the full blueprint, I would slightly change priorities.
Updated build priority
Phase 1A
auth
candidate core
Excel import
conversation .txt import
candidate matching
AI extraction from .txt
review queue
activity timeline
Phase 1B
document import
OCR
document classification
versioning
document checklist
profile enrichment from docs
Phase 1C
status pipeline
legal review queue
coordinator handover
exports/reports
That is a much smarter order for your real workflow.

15. Strong opinion on the product direction
You should not try to fake live WhatsApp automation.
That path is messy, fragile, risky, and not worth it.
Instead, ORI-CRUIT-HUB should become:
the post-conversation operating system
Meaning:
you still communicate manually,
but the app turns messy chats and files into clean operational data.
That is already enough to transform your work.
And later, if the company approves APIs, you plug them in.

16. Final answer to your main question
Yes — we can absolutely include this strategy inside the app.
The correct approach is:
use OneDrive folders as ingestion points
use NestJS + Prisma + BullMQ + MinIO as the core backend architecture
build a conversation parser
build a document classifier
build a candidate matching engine
build a review queue
build a controlled write-back strategy to avoid bad auto-updates
keep the architecture modular so future APIs can be added later
So the app will work now under current restrictions, and still be ready for future API-based automation.
That’s exactly the kind of foundation you want.
Next step: I can now turn all of this into the full implementation blueprint for ORI-CRUIT-HUB 1.0, including:
full architecture
folder structure
database schema
Prisma entity map
module map
ingestion pipeline design
review queue logic
deployment plan for Hostinger VPS
phased roadmap from MVP to production
alright. proceed Please write in English language.
Excellent. Let’s turn this into a real implementation blueprint for ORI-CRUIT-HUB 1.0.
This version is built for your actual reality:
no WhatsApp Business
no direct APIs for now
manual .txt export of conversations
manual download of candidate documents
OneDrive as current operational intake zone
unrestricted personal machine for development
Hostinger VPS for deployment
future-ready architecture for APIs later
The big idea is simple:
ORI-CRUIT-HUB becomes the system that converts messy files, chats, and documents into structured recruitment operations.

1. Product vision
Product role
ORI-CRUIT-HUB is not just a CRM.
It is a Recruitment Operations System built for high-friction workflows where:
candidates arrive from multiple sources
communication is fragmented
documents come in messy formats
Excel is duplicated everywhere
legal review depends on manual handoffs
coordinator communication is inconsistent
status changes are scattered across tools
Core mission
Reduce repetitive manual work by turning these inputs:
WhatsApp .txt
candidate documents
Excel sheets
manual notes
email exports
HRappka exports
into these outputs:
structured candidate profiles
document checklists
status pipelines
legal review packages
coordinator handover packages
automatic reports
next-step suggestions

2. Strategic product scope for version 1.0
What version 1.0 must do
ORI-CRUIT-HUB 1.0 should cover these 7 jobs:
1. Intake
Accept imported conversations, documents, and spreadsheets.
2. Candidate resolution
Identify whether the candidate already exists or should be created.
3. Data extraction
Extract names, phone numbers, nationality, document clues, legal clues, dates, and offer-related details.
4. Document handling
Classify, version, link, and review candidate documents.
5. Workflow orchestration
Move candidates through a defined recruitment pipeline.
6. Internal handoff
Support legal review and coordinator handover.
7. Reporting
Provide live dashboards and exports without rewriting data into five spreadsheets.

3. Tech stack
This is the stack I recommend for the real product.
Frontend
Next.js
TypeScript
TailwindCSS
shadcn/ui
React Hook Form
Zod
Backend
NestJS
Prisma
PostgreSQL
Background processing
Redis
BullMQ
Storage
MinIO on your Hostinger VPS for private S3-compatible storage
AI / extraction layer
LLM provider for text understanding and summaries
OCR engine for documents and images
deterministic parsers for fields like phone, passport-like IDs, dates, filenames
Deployment
Docker
Docker Compose
Caddy reverse proxy
Hostinger VPS Ubuntu

4. System architecture
Think of the system as 6 layers.
Layer 1 — Input layer
Handles raw incoming material:
.txt conversations
PDFs
images
Excel files
CSV files
manual form entries
Layer 2 — Ingestion layer
Processes raw files:
detects source
parses filename
hashes file
stores metadata
places work in queues
Layer 3 — Intelligence layer
Makes sense of content:
conversation parser
OCR
document classifier
candidate matching engine
extraction engine
confidence scoring
Layer 4 — Operations layer
Runs the business workflow:
candidate profile
pipeline statuses
legal queue
coordinator queue
issues/cases
reminders
Layer 5 — Reporting layer
Creates dashboards and exports:
recruiter activity
status distribution
missing docs
approval rates
pending reviews
time-to-placement
Layer 6 — Integration layer
For present and future:
Excel import/export
HRappka import/export
later API integrations
later messaging integrations

5. High-level module map
These are the core modules.
A. Auth & Roles
Manages:
login
recruiter roles
legal roles
coordinator roles
admin roles
audit access
B. Candidate Core
Manages:
candidate profile
candidate identifiers
phone numbers
language
nationality
current recruitment stage
history timeline
C. Conversation Intake
Manages:
.txt upload/import
filename parsing
content parsing
AI summary
signal extraction
candidate match suggestions
D. Document Intake
Manages:
PDF/image upload/import
OCR
document classification
candidate association
versioning
document validity workflow
E. Candidate Matching Engine
Manages:
exact match by phone
name normalization
fuzzy match
duplicate warnings
candidate merge suggestions
F. Recruitment Pipeline
Manages:
candidate statuses
transitions
required actions
blockers
automatic task creation
G. Legal Review
Manages:
candidate review package
missing document flags
approve / reject / request-more-docs
legal note trail
H. Coordinator Handover
Manages:
readiness
project details
arrival timing
accommodation
coordinator notifications
I. Issues / Cases
Manages:
payment issue
accommodation issue
rule/contract issue
communication issue
post-placement support case
J. Excel Sync
Manages:
import Base_Candidatos_Folga.xlsx
compare against internal records
detect differences
generate clean exports
K. Reporting & BI
Manages:
dashboards
snapshots
summary reports
exports for HR / recruitment / legal / coordinators / management

6. Folder structure for the codebase
I recommend a monorepo.
ori-cruit-hub/
├─ apps/
│  ├─ web/                      # Next.js frontend
│  ├─ api/                      # NestJS backend
│  └─ worker/                   # BullMQ workers
├─ packages/
│  ├─ ui/                       # Shared UI components
│  ├─ config/                   # Shared configs
│  ├─ types/                    # Shared TS types
│  ├─ validation/               # Zod schemas / validators
│  └─ prompts/                  # AI prompt templates
├─ infra/
│  ├─ docker/
│  ├─ caddy/
│  ├─ postgres/
│  ├─ minio/
│  └─ scripts/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ workflows/
│  ├─ api-contracts/
│  └─ deployment/
├─ .env.example
├─ docker-compose.yml
├─ docker-compose.prod.yml
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json

7. Frontend route map
These are the main routes I would build.
Public
/login
/forgot-password
Private app
/app
/app/dashboard

/app/candidates
/app/candidates/new
/app/candidates/[id]
/app/candidates/[id]/documents
/app/candidates/[id]/conversations
/app/candidates/[id]/timeline
/app/candidates/[id]/issues

/app/intake
/app/intake/conversations
/app/intake/documents
/app/intake/spreadsheets
/app/intake/review-queue

/app/legal
/app/legal/review-queue
/app/legal/review/[id]

/app/coordinators
/app/coordinators/handover-queue
/app/coordinators/handover/[id]

/app/issues
/app/issues/[id]

/app/reports
/app/reports/recruitment
/app/reports/legal
/app/reports/coordinators
/app/reports/management

/app/settings
/app/settings/users
/app/settings/roles
/app/settings/pipeline
/app/settings/document-types
/app/settings/import-rules
/app/settings/export-templates

8. Backend module structure
For NestJS, I’d structure it like this:
apps/api/src/
├─ main.ts
├─ app.module.ts
├─ common/
│  ├─ guards/
│  ├─ interceptors/
│  ├─ filters/
│  ├─ decorators/
│  ├─ utils/
│  └─ constants/
├─ prisma/
│  ├─ prisma.module.ts
│  └─ prisma.service.ts
├─ auth/
├─ users/
├─ roles/
├─ candidates/
├─ candidate-identifiers/
├─ conversations/
├─ conversation-intake/
├─ documents/
├─ document-intake/
├─ extraction/
├─ matching/
├─ pipeline/
├─ legal-review/
├─ coordinator-handover/
├─ issues/
├─ activities/
├─ tasks/
├─ spreadsheets/
├─ imports/
├─ exports/
├─ reports/
├─ storage/
├─ ai/
├─ audit/
└─ health/

9. Database entity map
This is the core data model.
Core entities
User
Internal system user.
Role
Admin, recruiter, legal, coordinator, manager.
Candidate
Main person record.
CandidateIdentifier
Stores normalized identifiers:
phone
email
passport number
PESEL
karta pobytu
visa number
CandidateAlias
Alternate names, spelling variants.
CandidateConversation
Stores imported .txt conversations and summaries.
CandidateDocument
Stores linked documents and metadata.
CandidateDocumentVersion
Supports multiple versions/pages for a document.
CandidateStatusHistory
Tracks all pipeline changes.
CandidateTask
Manual or automatic tasks.
CandidateActivity
Timeline events.
LegalReview
One review package per review cycle.
CoordinatorHandover
One handoff package per coordinator phase.
CandidateIssue
Post-recruitment or exceptional case.
Offer
Job offer / project / vacancy.
CandidateOfferInterest
Links candidate to offer(s).
SpreadsheetImport
Tracks imported Excel or CSV files.
SpreadsheetImportRow
Raw import row tracking and mapping.
ExtractionResult
Stores extracted facts and confidence scores.
MatchingDecision
Stores candidate match results and ambiguity states.
AuditLog
Stores sensitive actions and access events.

10. Prisma entity blueprint
Not full code yet — just the real shape.
Candidate
Fields:
id
internalCode
firstName
middleName
lastName
fullNameNormalized
gender
birthDate
nationality
currentCountry
city
preferredLanguage
secondaryLanguage
polishLevel
englishLevel
spanishLevel
phonePrimary
phoneSecondary
email
source
sourceDetails
status
availabilityDate
arrivalDate
accommodationDate
coordinatorAssignedId
recruiterAssignedId
notesInternal
createdAt
updatedAt
CandidateIdentifier
Fields:
id
candidateId
type
valueRaw
valueNormalized
isVerified
source
confidence
createdAt
Types:
PHONE
EMAIL
PESEL
PASSPORT
VISA
KARTA_POBYTU
OTHER
CandidateConversation
Fields:
id
candidateId
originalFilename
filePath
sourceChannel
phoneFromFilename
conversationDate
rawText
parsedText
aiSummary
recruiterSummary
candidateIntent
nextActionSuggestion
confidence
importBatchId
createdAt
CandidateDocument
Fields:
id
candidateId
documentType
status
source
extractedName
extractedNumber
issuingCountry
expiryDate
issueDate
isReadable
requiresReview
confidence
createdAt
updatedAt
CandidateDocumentVersion
Fields:
id
candidateDocumentId
fileName
objectKey
mimeType
extension
versionNumber
pageNumber
fileHash
fileSize
ocrText
createdAt
ExtractionResult
Fields:
id
sourceType
sourceId
entityType
fieldName
extractedValue
normalizedValue
confidence
method
reviewStatus
createdAt
MatchingDecision
Fields:
id
sourceType
sourceId
candidateId
matchType
confidence
resolutionStatus
notes
createdAt

11. Recruitment pipeline design
This needs to be explicit and controlled.
I recommend this default pipeline:
NEW_LEAD
CONTACT_PENDING
CONTACTED
INTERESTED
NOT_INTERESTED
WAITING_FOR_DOCUMENTS
PARTIAL_DOCUMENTS
READY_FOR_LEGAL_REVIEW
LEGAL_REVIEW_IN_PROGRESS
LEGAL_MORE_INFO_REQUIRED
LEGAL_APPROVED
LEGAL_REJECTED
WAITING_PAYMENT_PROOF
PAYMENT_PROOF_RECEIVED
COORDINATOR_HANDOVER_PENDING
COORDINATOR_NOTIFIED
TRAVEL_PENDING
ACCOMMODATION_PENDING
PLACED
POST_PLACEMENT_ISSUE
CLOSED
Every status should define:
who can apply it
required fields
blocking conditions
automatic task creation
notification rules

12. Conversation ingestion workflow
This is your WhatsApp workaround translated into product logic.
Input
A .txt file enters via:
manual upload
import folder sync
batch import
Example:
20260330-48796240947-wha.txt
Pipeline
Step 1
Validate file type and parse filename.
Extract:
date
phone
channel
Step 2
Create raw import record.
Step 3
Send to queue:
conversation parsing job
Step 4
Normalize text:
encoding cleanup
line breaks
timestamps
duplicated headers removed
Step 5
Run extraction engine:
probable name
nationality
language
documents mentioned
travel mention
payment mention
offer mention
availability mention
unanswered questions
candidate intent
urgency
Step 6
Run candidate matching engine.
Step 7
Create:
conversation record
activity timeline event
extraction results
suggested candidate update draft
Step 8
If confidence is high:
auto-link conversation to candidate
If medium:
flag review queue
If low:
unresolved import queue

13. Document ingestion workflow
Input
Files from:
OneDrive staging folder
manual upload
batch upload
Pipeline
Step 1
Read filename and path.
Step 2
Generate file hash.
Step 3
Store file in MinIO.
Step 4
Create raw document import record.
Step 5
Run classifier:
PASSPORT
VISA
KP
PAYMENT_PROOF
SIGNATURE
OTHER
Step 6
Run OCR.
Step 7
Run extraction:
candidate name
document number
issuing country
dates
whether image is readable
whether multiple pages are likely
Step 8
Match to candidate:
filename clues
phone in name if present
OCR name
previously linked conversation
existing candidate identifiers
Step 9
Link or suggest link.
Step 10
Update candidate checklist and review queue.

14. Candidate matching engine
This is one of the most important components.
It should use weighted matching.
Matching priority
High-trust matches
exact phone number
exact passport number
exact PESEL
exact visa number
exact email
Medium-trust matches
exact normalized full name
full name + nationality
full name + phone fragment
name from conversation + name from OCR
Low-trust matches
fuzzy similarity of names
same surname + similar phone
same offer + same language + similar name
Output
matched candidate
candidate creation suggestion
possible duplicates
merge suggestion
unresolved state
Confidence
Use score bands:
0.90–1.00 auto-link
0.70–0.89 review suggested
below 0.70 unresolved

15. Review queue design
This dashboard is a must.
Queue types
Conversation review
For:
low-confidence extraction
unmatched candidate
unclear intent
conflicting details
Document review
For:
unreadable file
mismatched name
unclear document type
possible duplicate
missing page sequence
uncertain expiry
Candidate merge review
For:
likely duplicates
multiple similar profiles
Legal review blockers
For:
missing required docs
inconsistent identifiers
Coordinator blockers
For:
approved but missing availability
approved but no project/housing assignment

16. Excel strategy
Your company is still Excel-heavy, so the app must play nice with it.
Imports
The system should import:
Base_Candidatos_Folga.xlsx
Leady_2026.xlsx
future sheets
Import engine responsibilities
detect column mappings
normalize names
normalize phone numbers
compare against existing candidates
flag duplicates
show preview before commit
log row-by-row results
Export engine responsibilities
Generate different exports for:
HR
recruitment
legal
coordinators
management
Instead of keeping separate truth sources, exports should be:
views of the same system data
That is the key shift.

17. OneDrive strategy
Use OneDrive now, but don’t let it own the system.
Phase 1
OneDrive is the intake rail:
01_INBOX_TXT
02_DOCUMENTOS/...
raw file drop zones
Phase 2
MinIO becomes the authoritative storage:
documents stored centrally in app storage
OneDrive optional for fallback/export/archive
System principle
OneDrive is staging. ORI-CRUIT-HUB is source of truth.

18. Storage design
MinIO buckets
I’d use something like:
candidate-conversations
candidate-documents
spreadsheet-imports
exports
audit-archives
Object path example
candidate-documents/{candidateId}/{documentType}/{documentId}/v{versionNumber}-p{pageNumber}.pdf
Access policy
no public files
signed URLs for temporary access
audit log for document opens/downloads
role-based permissions

19. Security model
Since you handle sensitive personal documents, security must be strict.
Must-have controls
role-based access control
encrypted environment secrets
signed file access
audit logging
password reset flow
forced HTTPS
sensitive data masking in UI where needed
action logs for edits to legal fields
data retention settings
export permission control
Example roles
Admin
Full access
Recruiter
Can manage candidate intake and candidate communication records
Legal
Can view and review legal documents and legal fields
Coordinator
Can view approved handover information
Manager
Can view dashboards and reports

20. AI usage policy inside the product
AI should assist, not blindly decide.
Good uses
conversation summaries
next-action suggestions
document classification support
extraction drafts
translation assistance
message draft suggestions
note condensation
report summarization
Bad uses
auto-final legal approval
auto-final rejection
auto-writing critical identity numbers without confidence and traceability
replacing human review on unclear documents
Rule
Every AI output should be stored with:
source
model
prompt version
confidence
review state

21. Background jobs
Use BullMQ queues like this:
conversation-intake
document-intake
ocr-processing
field-extraction
candidate-matching
spreadsheet-import
export-generation
report-snapshots
reminders-and-tasks
This keeps heavy processes off the main request cycle.

22. API contract draft
Here is the first clean pass.
Auth
POST /auth/login
POST /auth/logout
GET /auth/me
Candidates
GET /candidates
POST /candidates
GET /candidates/:id
PATCH /candidates/:id
GET /candidates/:id/timeline
POST /candidates/:id/status
POST /candidates/:id/merge
Conversations
POST /intake/conversations/upload
POST /intake/conversations/import-batch
GET /conversations
GET /conversations/:id
POST /conversations/:id/reprocess
POST /conversations/:id/link-candidate
Documents
POST /intake/documents/upload
POST /intake/documents/import-batch
GET /documents
GET /documents/:id
POST /documents/:id/reprocess
POST /documents/:id/link-candidate
PATCH /documents/:id/review
Spreadsheet imports
POST /imports/spreadsheets/upload
GET /imports/spreadsheets
GET /imports/spreadsheets/:id
POST /imports/spreadsheets/:id/commit
Review queues
GET /review/conversations
GET /review/documents
GET /review/matches
GET /review/legal-blockers
Legal
GET /legal/reviews
POST /legal/reviews
GET /legal/reviews/:id
PATCH /legal/reviews/:id
POST /legal/reviews/:id/approve
POST /legal/reviews/:id/reject
POST /legal/reviews/:id/request-info
Coordinator
GET /handover
POST /handover/:candidateId/create
PATCH /handover/:id
POST /handover/:id/complete
Reports
GET /reports/dashboard
GET /reports/recruitment
GET /reports/legal
GET /reports/coordinators
POST /exports/generate

23. UI screens to build first
MVP screens
Login
Dashboard
Candidate list
Candidate profile
Conversation import page
Conversation review queue
Document import page
Document review queue
Spreadsheet import page
Legal review queue
Coordinator handover queue
Reports overview
These 12 screens are enough for a strong first release.

24. Deployment architecture on Hostinger VPS
Containers
web — Next.js
api — NestJS
worker — BullMQ worker
postgres
redis
minio
caddy
Domain idea
app.yourdomain.com → frontend
api.yourdomain.com → backend
MinIO internal only if possible
Production flow
GitHub repo
CI/CD optional at first
deploy via Docker Compose
environment secrets on VPS
scheduled database backups
scheduled MinIO backup snapshots

25. Build phases
Phase 0 — Product definition
You define:
statuses
document types
required fields
roles
spreadsheet column mapping rules
review rules
Phase 1 — Core foundation
Build:
auth
roles
candidate core
candidate timeline
dashboard skeleton
PostgreSQL + Prisma
MinIO setup
BullMQ setup
Phase 2 — Conversation intelligence
Build:
.txt ingestion
filename parser
conversation parser
candidate matching
AI summary
review queue
Phase 3 — Document intelligence
Build:
document upload/import
OCR
classification
candidate link
versioning
document review queue
Phase 4 — Operational workflow
Build:
status engine
legal review
coordinator handover
issues/cases
tasks/reminders
Phase 5 — Spreadsheet intelligence
Build:
Excel import engine
mapping UI
diff/merge flow
export templates
Phase 6 — Reporting and hardening
Build:
dashboards
summary reports
audit trails
permissions hardening
deployment polish
backup/restore
error monitoring

26. What you need to prepare before coding
You need these business definitions first.
A. Status dictionary
Exact list of statuses and what each one means.
B. Document dictionary
For each doc type:
internal code
display name
required?
required for whom?
can it have multiple pages?
does it expire?
which fields matter?
C. Field dictionary
Which candidate fields matter most:
full name
nationality
birth date
passport number
visa number
PESEL
KP number
phone
email
travel date
accommodation date
project
coordinator
D. Spreadsheet mapping
For each existing Excel:
sheet names
columns
meaning
trusted columns vs messy columns
E. Naming rules
Finalize naming rules for:
conversation files
documents
duplicates
versions

27. Strong recommendation on implementation order
Do not start with beautiful dashboards.
Start with the ugly but high-value backbone:
candidate schema
file import engine
matching engine
review queue
status engine
That is the real product.
Everything else becomes easier after that.

28. My recommended development order for you personally
Since you want to build it yourself, here’s the smartest path:
First sprint
scaffold monorepo
setup Next.js + NestJS + Prisma
setup PostgreSQL
setup auth
create candidate schema
create candidate list/profile UI
Second sprint
build conversation upload/import
build filename parser
store raw .txt
display parsed conversation
create review queue
Third sprint
build matching engine
build extracted facts panel
build suggested updates flow
build timeline activity feed
Fourth sprint
build document upload/import
integrate OCR
build document classification
build document review queue
Fifth sprint
build legal review
build coordinator handover
build pipeline status engine
Sixth sprint
build spreadsheet import/export
build reporting
deploy production on Hostinger

29. What ORI-CRUIT-HUB 1.0 should NOT try to do yet
Do not try to include all this in v1:
full WhatsApp live integration
advanced mobile app
automated calling
massive multilingual chatbot
total HRappka replacement
advanced BI suite
browser extension
voice transcription stack
public candidate portal
That’s future work.
Version 1.0 should dominate the manual chaos first.

30. Final strategic conclusion
ORI-CRUIT-HUB 1.0 should be built as a file-ingestion-driven recruitment operations platform.
Its core differentiator is this:
it turns manual WhatsApp and document workflows into structured candidate operations without needing official messaging APIs.
That is exactly why this product makes sense.
You are not blocked by the lack of WhatsApp Business.
You are simply choosing a better architecture for your current constraints.

31. Immediate next step
Before writing code, we should do one thing next:
define the full data model and the business dictionaries.
That means I should now prepare for you:
the full Prisma schema draft
the status dictionary
the document-type dictionary
the candidate field map
the first MVP sprint plan
That is the correct next move.
ok. continue Please write in English language.
Perfect. We’ll continue with the core product definition layer for ORI-CRUIT-HUB 1.0.
This is the part that makes the app buildable for real:
Prisma schema draft
status dictionary
document-type dictionary
candidate field map
MVP sprint plan
This is where the product stops being an idea and starts becoming an executable system.

1. Prisma schema draft — product-level model
This is not yet the final code file, but it is close enough to guide implementation cleanly.
1.1 Main principles
The schema should follow these rules:
one candidate = one central entity
every important fact must be traceable to a source
imported files must remain auditable
extracted data must be reviewable
high-risk fields must not be blindly overwritten
workflow actions must create history

1.2 Core enums
These are the enums I would define first.
UserRole
ADMIN
RECRUITER
LEGAL
COORDINATOR
MANAGER
VIEWER
SourceChannel
WHATSAPP
SMS
EMAIL
CALL
WEB_FORM
EXCEL_IMPORT
HRAPPKA_IMPORT
MANUAL
OTHER
CandidateStatus
NEW_LEAD
CONTACT_PENDING
CONTACTED
INTERESTED
NOT_INTERESTED
WAITING_FOR_DOCUMENTS
PARTIAL_DOCUMENTS
READY_FOR_LEGAL_REVIEW
LEGAL_REVIEW_IN_PROGRESS
LEGAL_MORE_INFO_REQUIRED
LEGAL_APPROVED
LEGAL_REJECTED
WAITING_PAYMENT_PROOF
PAYMENT_PROOF_RECEIVED
COORDINATOR_HANDOVER_PENDING
COORDINATOR_NOTIFIED
TRAVEL_PENDING
ACCOMMODATION_PENDING
PLACED
POST_PLACEMENT_ISSUE
CLOSED
IdentifierType
PHONE
EMAIL
PASSPORT
PESEL
KARTA_POBYTU
VISA
OTHER
DocumentType
PASSPORT
VISA
KARTA_POBYTU
PESEL_CONFIRMATION
PAYMENT_PROOF
SIGNATURE
CONTRACT
PHOTO
CV
RESIDENCE_DOC
WORK_PERMIT_DOC
OTHER
DocumentReviewStatus
PENDING
AUTO_CLASSIFIED
NEEDS_REVIEW
APPROVED
REJECTED
UNREADABLE
DUPLICATE
MISMATCHED
ExtractionReviewStatus
PENDING
AUTO_ACCEPTED
NEEDS_REVIEW
CONFIRMED
REJECTED
MatchType
EXACT
PROBABLE
POSSIBLE
UNMATCHED
DUPLICATE_RISK
MatchResolutionStatus
AUTO_LINKED
REVIEW_REQUIRED
CONFIRMED
REJECTED
NEW_CANDIDATE_CREATED
MERGED
TaskStatus
OPEN
IN_PROGRESS
DONE
CANCELLED
TaskType
REQUEST_DOCUMENT
FOLLOW_UP
LEGAL_REVIEW
COORDINATOR_HANDOVER
VERIFY_DATA
CHECK_PAYMENT
MANUAL_REVIEW
OTHER
IssueType
PAYMENT
ACCOMMODATION
COORDINATOR
COMMUNICATION
CONTRACT
LEGAL
OTHER
IssueStatus
OPEN
IN_PROGRESS
RESOLVED
CLOSED

2. Main data models
2.1 User
Represents internal employees using the system.
Fields
id
email
passwordHash
firstName
lastName
role
isActive
createdAt
updatedAt
Why it matters
You need clean role boundaries from day one.

2.2 Candidate
This is the central entity of the whole system.
Fields
id
internalCode
firstName
middleName
lastName
secondLastName
fullNameNormalized
gender
birthDate
nationality
currentCountry
currentCity
primaryLanguage
secondaryLanguage
polishLevel
englishLevel
spanishLevel
phonePrimary
phoneSecondary
email
sourceChannel
sourceLabel
status
availabilityDate
travelDate
accommodationDate
notesInternal
recruiterAssignedId
coordinatorAssignedId
createdAt
updatedAt
Why it matters
This becomes the single candidate truth record.

2.3 CandidateIdentifier
Stores all identifiers linked to a candidate.
Fields
id
candidateId
type
valueRaw
valueNormalized
isVerified
sourceChannel
confidence
createdAt
Why it matters
A candidate may have:
several phones
changing email
passport
PESEL
visa number
KP number
This table avoids stuffing everything into the candidate row.

2.4 CandidateAlias
Useful for spelling variations.
Fields
id
candidateId
aliasRaw
aliasNormalized
source
createdAt
Why it matters
Names from WhatsApp and documents often don’t match perfectly.

2.5 Offer
Represents a job/project.
Fields
id
code
title
department
location
country
employmentType
languageRequirements
salaryRange
isActive
description
createdAt
updatedAt
Why it matters
You need to track which offer the candidate is discussing or joining.

2.6 CandidateOfferInterest
Links candidates with offers.
Fields
id
candidateId
offerId
interestLevel
source
notes
createdAt
Why it matters
A candidate may be linked to several offers over time.

2.7 CandidateConversation
Stores imported chat files.
Fields
id
candidateId nullable
originalFilename
fileHash
sourceChannel
phoneFromFilename
dateFromFilename
rawText
normalizedText
aiSummary
candidateIntent
nextActionSuggestion
extractionConfidence
importBatchId nullable
createdAt
updatedAt
Why it matters
This is the core of your WhatsApp-to-operations strategy.

2.8 CandidateDocument
Represents the logical document entity.
Fields
id
candidateId nullable
documentType
reviewStatus
extractedName
extractedNumber
issuingCountry
issueDate
expiryDate
requiresReview
isReadable
confidence
notes
createdAt
updatedAt
Why it matters
One document may have:
multiple pages
multiple versions
multiple files
This record represents the document as a whole.

2.9 CandidateDocumentVersion
Stores each actual uploaded file/page/version.
Fields
id
candidateDocumentId
originalFilename
objectKey
mimeType
extension
versionNumber
pageNumber
fileHash
fileSize
ocrText
sourcePath
createdAt
Why it matters
This is how you support:
passport page 1
passport page 2
new upload of same passport
image and PDF variants

2.10 ExtractionResult
Stores extracted field candidates from conversations or documents.
Fields
id
sourceType
sourceId
entityType
fieldName
extractedValue
normalizedValue
confidence
method
reviewStatus
createdAt
reviewedAt nullable
reviewedById nullable
Why it matters
You need a traceable extraction layer, not silent overwrites.

2.11 MatchingDecision
Stores match logic results.
Fields
id
sourceType
sourceId
candidateId nullable
matchType
confidence
resolutionStatus
notes
createdAt
resolvedAt nullable
resolvedById nullable
Why it matters
This becomes your anti-chaos mechanism for ambiguous data.

2.12 CandidateStatusHistory
Tracks every status movement.
Fields
id
candidateId
fromStatus nullable
toStatus
changedById
reason
createdAt
Why it matters
You always want to know:
who changed what
when
why

2.13 CandidateTask
Stores next actions.
Fields
id
candidateId
type
title
description
assignedToId nullable
dueDate nullable
status
autoGenerated
createdAt
updatedAt
Why it matters
The app should create work, not just store data.

2.14 CandidateActivity
The timeline table.
Fields
id
candidateId
activityType
title
description
sourceType nullable
sourceId nullable
createdById nullable
createdAt
Why it matters
Every important event should land in the timeline.

2.15 LegalReview
Stores a legal review package.
Fields
id
candidateId
status
assignedToId nullable
summary
missingItems
notes
startedAt nullable
completedAt nullable
createdAt
Why it matters
You need a structured legal queue, not random notes.

2.16 CoordinatorHandover
Stores readiness handoff.
Fields
id
candidateId
coordinatorId nullable
projectName
accommodationAddress
travelDate
arrivalDate
status
notes
createdAt
updatedAt
Why it matters
This is the final operational bridge before placement.

2.17 CandidateIssue
Stores post-placement or exception cases.
Fields
id
candidateId
type
title
description
status
assignedToId nullable
createdAt
updatedAt
Why it matters
These issues already land on you. The system should absorb them.

2.18 SpreadsheetImport
Tracks uploaded spreadsheet batches.
Fields
id
originalFilename
fileHash
importedById
importType
status
summary
createdAt
Why it matters
Every Excel import must be auditable.

2.19 SpreadsheetImportRow
Stores parsed rows before commit.
Fields
id
spreadsheetImportId
rowNumber
rawJson
parsedJson
candidateId nullable
actionSuggested
actionResolved
createdAt
Why it matters
This gives you preview-before-commit power.

2.20 AuditLog
Stores sensitive access and changes.
Fields
id
actorId nullable
entityType
entityId
action
metadataJson
createdAt
Why it matters
Sensitive data without audit trail is a bad idea.

3. Entity relationships
Here is the clean relationship logic.
Candidate relations
A candidate has many:
identifiers
aliases
conversations
documents
status history entries
tasks
activities
issues
offer interests
legal reviews
coordinator handovers
Document relations
A candidate document has many:
versions
extraction results
matching decisions if needed
Conversation relations
A conversation has:
optional candidate link
many extraction results
one or more matching decisions
Spreadsheet import relations
A spreadsheet import has many:
spreadsheet rows
That’s the core backbone.

4. Status dictionary
Now let’s define the operational meaning of each candidate status.
This is critical because the workflow must not be vague.
4.1 NEW_LEAD
Meaning:
Candidate exists in the system but has not been contacted yet.
Entry sources:
web form
Excel import
HRappka import
manual creation
Required minimum:
at least one identifier: phone or email
Next typical actions:
assign recruiter
first contact

4.2 CONTACT_PENDING
Meaning:
Candidate is ready for outreach but no successful first interaction yet.
Used when:
recruiter intends to contact
follow-up needed
Next actions:
send message
call
mark response outcome

4.3 CONTACTED
Meaning:
A first contact attempt or conversation happened.
Minimum condition:
at least one conversation/activity logged
Next actions:
classify interest
gather details

4.4 INTERESTED
Meaning:
Candidate confirmed interest in at least one offer/process.
Minimum condition:
positive intent detected or manually confirmed
Next actions:
request documents
confirm availability
link offer

4.5 NOT_INTERESTED
Meaning:
Candidate explicitly declined.
Next actions:
archive or keep for future offers

4.6 WAITING_FOR_DOCUMENTS
Meaning:
Candidate is interested but required documents have not yet arrived.
Next actions:
send checklist
follow up

4.7 PARTIAL_DOCUMENTS
Meaning:
Some documents arrived, but not all required docs are present.
Next actions:
request missing items
review current files

4.8 READY_FOR_LEGAL_REVIEW
Meaning:
Minimum required document package is complete enough for legal.
Blocking rules:
required docs present
candidate linked confidently
no unresolved identity conflict

4.9 LEGAL_REVIEW_IN_PROGRESS
Meaning:
Legal is actively reviewing the case.

4.10 LEGAL_MORE_INFO_REQUIRED
Meaning:
Legal needs more data/documents.
Next actions:
create recruiter task
request missing info from candidate

4.11 LEGAL_APPROVED
Meaning:
Candidate passed legal review.
Next actions:
coordinator handover
payment step if applicable

4.12 LEGAL_REJECTED
Meaning:
Candidate is not legally eligible or was rejected in legal workflow.
Next actions:
internal note
candidate notification if applicable

4.13 WAITING_PAYMENT_PROOF
Meaning:
Payment confirmation required but not yet received.

4.14 PAYMENT_PROOF_RECEIVED
Meaning:
Payment evidence uploaded and ready or confirmed.

4.15 COORDINATOR_HANDOVER_PENDING
Meaning:
Candidate is approved and ready to be handed to coordinator.

4.16 COORDINATOR_NOTIFIED
Meaning:
Coordinator has received operational handover.

4.17 TRAVEL_PENDING
Meaning:
Candidate is approved and awaiting travel-related action.

4.18 ACCOMMODATION_PENDING
Meaning:
Travel or arrival is known, but accommodation step is still pending.

4.19 PLACED
Meaning:
Candidate reached the final operational placement stage.

4.20 POST_PLACEMENT_ISSUE
Meaning:
Candidate is placed, but a support/problem case exists.

4.21 CLOSED
Meaning:
Case is complete and inactive.

5. Status transition logic
Do not allow random jumps.
Use controlled transitions.
Example flow
NEW_LEAD
→ CONTACT_PENDING
→ CONTACTED
→ INTERESTED
→ WAITING_FOR_DOCUMENTS
→ PARTIAL_DOCUMENTS
→ READY_FOR_LEGAL_REVIEW
→ LEGAL_REVIEW_IN_PROGRESS
→ LEGAL_APPROVED
→ WAITING_PAYMENT_PROOF
→ PAYMENT_PROOF_RECEIVED
→ COORDINATOR_HANDOVER_PENDING
→ COORDINATOR_NOTIFIED
→ TRAVEL_PENDING
→ ACCOMMODATION_PENDING
→ PLACED
→ CLOSED
Alternative branches
CONTACTED → NOT_INTERESTED
LEGAL_REVIEW_IN_PROGRESS → LEGAL_MORE_INFO_REQUIRED
LEGAL_REVIEW_IN_PROGRESS → LEGAL_REJECTED
PLACED → POST_PLACEMENT_ISSUE
POST_PLACEMENT_ISSUE → CLOSED
This should be stored in configuration, not hardcoded everywhere.

6. Document-type dictionary
This should be explicit inside the app.
Each document type should define:
code
label
required or optional
does it expire
can it have multiple pages
can it have multiple versions
which fields to extract
who reviews it

6.1 PASSPORT
Code: PASSPORT
Purpose:
Main identity document.
Extract:
full name
passport number
nationality
birth date
issue date if visible
expiry date if visible
Rules:
multi-page allowed
multiple versions allowed
usually required
legal review relevant

6.2 VISA
Code: VISA
Purpose:
Travel/legal entry document.
Extract:
visa number
issuing country
issue date
expiry date
name if visible
Rules:
multi-page possible
legal review relevant
expiry critical

6.3 KARTA_POBYTU
Code: KARTA_POBYTU
Purpose:
Residence permit / stay authorization.
Extract:
card number
name
expiry date
issue date
Rules:
legal review relevant
expiry critical

6.4 PESEL_CONFIRMATION
Code: PESEL_CONFIRMATION
Purpose:
PESEL-related documentation.
Extract:
PESEL
name
date if present
Rules:
legal review relevant
may be optional depending on case

6.5 PAYMENT_PROOF
Code: PAYMENT_PROOF
Purpose:
Payment evidence for permit-related or operational step.
Extract:
amount if readable
transaction date
reference number if readable
sender/receiver clues
Rules:
may have screenshots
sometimes low OCR quality
often recruiter review first

6.6 SIGNATURE
Code: SIGNATURE
Purpose:
Signed pages, signed forms, signed acknowledgments.
Extract:
signed yes/no
name if visible
date if visible
Rules:
often visual/manual review needed

6.7 CONTRACT
Code: CONTRACT
Purpose:
Agreement or candidate contract document.
Extract:
candidate name
date
version clues
Rules:
legal/ops relevance
may be long PDF

6.8 CV
Code: CV
Purpose:
Resume or experience file.
Extract:
work experience
studies
language skills
candidate name
phone/email
Rules:
useful for enrichment
not always legal-critical

6.9 PHOTO
Code: PHOTO
Purpose:
Simple personal/reference photo if needed.
Rules:
mostly metadata only
low extraction importance

6.10 RESIDENCE_DOC
Code: RESIDENCE_DOC
Purpose:
Generic residence evidence if not clearly KP/VISA.
Rules:
classifier may first place docs here before manual refinement

6.11 WORK_PERMIT_DOC
Code: WORK_PERMIT_DOC
Purpose:
Any permit-related legal paper.
Rules:
legal review relevant
document extraction useful

6.12 OTHER
Code: OTHER
Purpose:
Fallback bucket.
Rules:
always needs classification review if operationally relevant

7. Candidate field map
Now let’s define the candidate profile structure.
This should be divided into logical sections.

7.1 Identity fields
firstName
middleName
lastName
secondLastName
fullNameNormalized
gender
birthDate
nationality
7.2 Contact fields
phonePrimary
phoneSecondary
email
preferredChannel
primaryLanguage
secondaryLanguage
7.3 Language fields
spanishLevel
englishLevel
polishLevel
7.4 Location fields
currentCountry
currentCity
currentAddress optional later
7.5 Legal / document fields
These should mostly be derived from identifiers/docs and not blindly stored as flat editable text.
passportNumber
visaNumber
pesel
kartaPobytuNumber
workPermitReference optional later
7.6 Recruitment fields
sourceChannel
sourceLabel
recruiterAssignedId
currentStatus
availabilityDate
interestedOffer
notesInternal
7.7 Operational fields
coordinatorAssignedId
travelDate
arrivalDate
accommodationDate
projectName
housingStatus optional later
7.8 Meta fields
createdAt
updatedAt
lastConversationAt
lastDocumentAt
completenessScore optional later
riskFlags optional later

8. Field source-of-truth strategy
This is very important.
Not every field should be directly editable without trace.
Best approach
Candidate table stores current accepted value
Example:
nationality = Colombia
ExtractionResult stores proposed values from sources
Example:
from passport OCR → Colombia, confidence 0.96
from chat text → “I’m from Colombia”, confidence 0.82
Review logic decides whether to update candidate accepted value
This is the correct architecture.

9. MVP sprint plan
Now let’s turn this into an execution plan.
I’d split the MVP into 6 practical sprints.

Sprint 1 — Foundation and auth
Goal:
Get the base platform running.
Build
monorepo setup
Next.js app
NestJS API
PostgreSQL + Prisma
Redis
auth
role system
base layout UI
user entity
candidate entity basic CRUD
Deliverable
You can log in and see/create/edit candidates.

Sprint 2 — Candidate timeline and status engine
Goal:
Make candidates operational.
Build
CandidateStatus enum
CandidateStatusHistory
CandidateActivity
CandidateTask
status transition logic
candidate timeline UI
candidate details page
Deliverable
You can move a candidate through workflow and see the full history.

Sprint 3 — Conversation intake
Goal:
Turn .txt chat files into usable data.
Build
conversation upload/import endpoint
filename parser
raw storage
normalized text viewer
candidate match engine v1
ExtractionResult for conversations
review queue for unmatched or low-confidence items
Deliverable
You upload .txt conversations and the app proposes candidate linkage and extracted facts.

Sprint 4 — Document intake
Goal:
Handle files and document structure.
Build
document upload/import
MinIO storage
file hashing
document entity + versions
OCR pipeline
classifier v1
document review queue
Deliverable
You upload/download docs, classify them, link them to candidates, and review extracted details.

Sprint 5 — Legal and coordinator flows
Goal:
Turn data into real operations.
Build
LegalReview module
CoordinatorHandover module
workflow blockers
required document checks
task generation for missing information
Deliverable
You can move candidate cases into legal review and handover without chaos.

Sprint 6 — Spreadsheet import/export
Goal:
Connect with current company reality.
Build
spreadsheet upload/import
row preview
mapping rules
duplicate detection
export templates for teams
management summary page
Deliverable
You stop duplicating data manually across Excel files.

10. Suggested priorities inside the sprints
If you want the smartest build order, focus on this exact sequence:
candidate schema
status history
timeline
conversation import
matching engine
extraction result layer
document upload
document versioning
legal review
spreadsheet sync
That is the backbone.

11. Recommended review rules
To avoid bad automation, use this policy.
Auto-accept allowed
phone from filename
source channel
conversation date from filename
file metadata
document hash
obvious duplicate detection
Needs review
full candidate match if not exact
name from OCR
nationality if extracted from weak source
passport number
visa number
PESEL
KP number
payment proof interpretation
legal eligibility clues
This gives you useful automation without dangerous blind writes.

12. Suggested first real Prisma implementation order
When you actually start writing schema.prisma, I would create models in this order:
User
Candidate
CandidateIdentifier
CandidateStatusHistory
CandidateActivity
CandidateTask
CandidateConversation
ExtractionResult
MatchingDecision
CandidateDocument
CandidateDocumentVersion
LegalReview
CoordinatorHandover
CandidateIssue
Offer
CandidateOfferInterest
SpreadsheetImport
SpreadsheetImportRow
AuditLog
That order will reduce friction during development.

13. What we should define next
The next layer after this should be one of these two:
Option A — Prisma schema file draft
I write the first near-production schema.prisma structure for you.
Option B — API contract + DTO map
I define the concrete NestJS module endpoints, request bodies, and response shapes.
The smartest next move is Option A first:
the actual Prisma schema draft.
That will give you a concrete base to start coding immediately.
go with the smarter option then Please write in English language.
Perfect. We go with the smarter move:
ORI-CRUIT-HUB 1.0 — first Prisma schema draft
This is the foundational schema for:
NestJS
Prisma
PostgreSQL
MinIO-backed file storage
BullMQ processing
file-ingestion workflow
future API integrations later
It is designed for your real use case:
WhatsApp .txt imports
document ingestion
candidate matching
review queues
legal flow
coordinator handover
Excel imports
auditability

1. First schema.prisma draft
generator client {
 provider = "prisma-client-js"
}

datasource db {
 provider = "postgresql"
 url      = env("DATABASE_URL")
}

enum UserRole {
 ADMIN
 RECRUITER
 LEGAL
 COORDINATOR
 MANAGER
 VIEWER
}

enum SourceChannel {
 WHATSAPP
 SMS
 EMAIL
 CALL
 WEB_FORM
 EXCEL_IMPORT
 HRAPPKA_IMPORT
 MANUAL
 OTHER
}

enum CandidateStatus {
 NEW_LEAD
 CONTACT_PENDING
 CONTACTED
 INTERESTED
 NOT_INTERESTED
 WAITING_FOR_DOCUMENTS
 PARTIAL_DOCUMENTS
 READY_FOR_LEGAL_REVIEW
 LEGAL_REVIEW_IN_PROGRESS
 LEGAL_MORE_INFO_REQUIRED
 LEGAL_APPROVED
 LEGAL_REJECTED
 WAITING_PAYMENT_PROOF
 PAYMENT_PROOF_RECEIVED
 COORDINATOR_HANDOVER_PENDING
 COORDINATOR_NOTIFIED
 TRAVEL_PENDING
 ACCOMMODATION_PENDING
 PLACED
 POST_PLACEMENT_ISSUE
 CLOSED
}

enum IdentifierType {
 PHONE
 EMAIL
 PASSPORT
 PESEL
 KARTA_POBYTU
 VISA
 OTHER
}

enum DocumentType {
 PASSPORT
 VISA
 KARTA_POBYTU
 PESEL_CONFIRMATION
 PAYMENT_PROOF
 SIGNATURE
 CONTRACT
 PHOTO
 CV
 RESIDENCE_DOC
 WORK_PERMIT_DOC
 OTHER
}

enum DocumentReviewStatus {
 PENDING
 AUTO_CLASSIFIED
 NEEDS_REVIEW
 APPROVED
 REJECTED
 UNREADABLE
 DUPLICATE
 MISMATCHED
}

enum ExtractionReviewStatus {
 PENDING
 AUTO_ACCEPTED
 NEEDS_REVIEW
 CONFIRMED
 REJECTED
}

enum MatchType {
 EXACT
 PROBABLE
 POSSIBLE
 UNMATCHED
 DUPLICATE_RISK
}

enum MatchResolutionStatus {
 AUTO_LINKED
 REVIEW_REQUIRED
 CONFIRMED
 REJECTED
 NEW_CANDIDATE_CREATED
 MERGED
}

enum TaskStatus {
 OPEN
 IN_PROGRESS
 DONE
 CANCELLED
}

enum TaskType {
 REQUEST_DOCUMENT
 FOLLOW_UP
 LEGAL_REVIEW
 COORDINATOR_HANDOVER
 VERIFY_DATA
 CHECK_PAYMENT
 MANUAL_REVIEW
 OTHER
}

enum IssueType {
 PAYMENT
 ACCOMMODATION
 COORDINATOR
 COMMUNICATION
 CONTRACT
 LEGAL
 OTHER
}

enum IssueStatus {
 OPEN
 IN_PROGRESS
 RESOLVED
 CLOSED
}

enum LegalReviewStatus {
 PENDING
 IN_PROGRESS
 MORE_INFO_REQUIRED
 APPROVED
 REJECTED
 CANCELLED
}

enum HandoverStatus {
 PENDING
 READY
 NOTIFIED
 IN_PROGRESS
 COMPLETED
 BLOCKED
 CANCELLED
}

enum SpreadsheetImportStatus {
 UPLOADED
 PARSED
 REVIEW_REQUIRED
 READY_TO_COMMIT
 COMMITTED
 FAILED
}

enum SpreadsheetImportType {
 BASE_CANDIDATOS
 LEADY
 HRAPPKA_EXPORT
 OTHER
}

enum SourceEntityType {
 CONVERSATION
 DOCUMENT
 SPREADSHEET_ROW
 MANUAL
}

model User {
 id               String                  @id @default(cuid())
 email            String                  @unique
 passwordHash     String
 firstName        String
 lastName         String
 role             UserRole
 isActive         Boolean                 @default(true)
 createdAt        DateTime                @default(now())
 updatedAt        DateTime                @updatedAt

 recruitedCandidates Candidate[]          @relation("RecruiterAssignedCandidates")
 coordinatedCandidates Candidate[]        @relation("CoordinatorAssignedCandidates")

 assignedTasks    CandidateTask[]         @relation("TaskAssignedTo")
 createdActivities CandidateActivity[]    @relation("ActivityCreatedBy")
 changedStatuses  CandidateStatusHistory[]@relation("StatusChangedBy")
 reviewedExtractions ExtractionResult[]   @relation("ExtractionReviewedBy")
 resolvedMatches  MatchingDecision[]      @relation("MatchingResolvedBy")
 legalReviewsAssigned LegalReview[]       @relation("LegalAssignedTo")
 handoversAssigned CoordinatorHandover[]  @relation("HandoverAssignedTo")
 issuesAssigned   CandidateIssue[]        @relation("IssueAssignedTo")
 spreadsheetImports SpreadsheetImport[]   @relation("SpreadsheetImportedBy")
 auditLogs        AuditLog[]              @relation("AuditActor")
}

model Candidate {
 id                    String                  @id @default(cuid())
 internalCode          String                  @unique
 firstName             String?
 middleName            String?
 lastName              String?
 secondLastName        String?
 fullNameNormalized    String?
 gender                String?
 birthDate             DateTime?
 nationality           String?
 currentCountry        String?
 currentCity           String?
 primaryLanguage       String?
 secondaryLanguage     String?
 polishLevel           String?
 englishLevel          String?
 spanishLevel          String?
 phonePrimary          String?
 phoneSecondary        String?
 email                 String?
 sourceChannel         SourceChannel?
 sourceLabel           String?
 status                CandidateStatus        @default(NEW_LEAD)
 availabilityDate      DateTime?
 travelDate            DateTime?
 arrivalDate           DateTime?
 accommodationDate     DateTime?
 notesInternal         String?
 recruiterAssignedId   String?
 coordinatorAssignedId String?
 createdAt             DateTime               @default(now())
 updatedAt             DateTime               @updatedAt

 recruiterAssigned     User?                  @relation("RecruiterAssignedCandidates", fields: [recruiterAssignedId], references: [id], onDelete: SetNull)
 coordinatorAssigned   User?                  @relation("CoordinatorAssignedCandidates", fields: [coordinatorAssignedId], references: [id], onDelete: SetNull)

 identifiers           CandidateIdentifier[]
 aliases               CandidateAlias[]
 offerInterests        CandidateOfferInterest[]
 conversations         CandidateConversation[]
 documents             CandidateDocument[]
 statusHistory         CandidateStatusHistory[]
 tasks                 CandidateTask[]
 activities            CandidateActivity[]
 legalReviews          LegalReview[]
 handovers             CoordinatorHandover[]
 issues                CandidateIssue[]
 spreadsheetRows       SpreadsheetImportRow[]
 matchDecisions        MatchingDecision[]

 @@index([status])
 @@index([fullNameNormalized])
 @@index([phonePrimary])
 @@index([email])
 @@index([recruiterAssignedId])
 @@index([coordinatorAssignedId])
}

model CandidateIdentifier {
 id              String          @id @default(cuid())
 candidateId     String
 type            IdentifierType
 valueRaw        String
 valueNormalized String?
 isVerified      Boolean         @default(false)
 sourceChannel   SourceChannel?
 confidence      Float?
 createdAt       DateTime        @default(now())

 candidate        Candidate       @relation(fields: [candidateId], references: [id], onDelete: Cascade)

 @@index([candidateId])
 @@index([type])
 @@index([valueNormalized])
 @@unique([type, valueNormalized], map: "candidate_identifier_type_value_normalized_unique")
}

model CandidateAlias {
 id              String    @id @default(cuid())
 candidateId     String
 aliasRaw        String
 aliasNormalized String?
 source          String?
 createdAt       DateTime  @default(now())

 candidate       Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

 @@index([candidateId])
 @@index([aliasNormalized])
}

model Offer {
 id                   String                  @id @default(cuid())
 code                 String?                 @unique
 title                String
 department           String?
 location             String?
 country              String?
 employmentType       String?
 languageRequirements String?
 salaryRange          String?
 isActive             Boolean                 @default(true)
 description          String?
 createdAt            DateTime                @default(now())
 updatedAt            DateTime                @updatedAt

 candidateInterests   CandidateOfferInterest[]

 @@index([title])
 @@index([isActive])
}

model CandidateOfferInterest {
 id            String    @id @default(cuid())
 candidateId   String
 offerId       String
 interestLevel String?
 source        String?
 notes         String?
 createdAt     DateTime  @default(now())

 candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 offer         Offer     @relation(fields: [offerId], references: [id], onDelete: Cascade)

 @@index([candidateId])
 @@index([offerId])
 @@unique([candidateId, offerId], map: "candidate_offer_interest_unique")
}

model CandidateConversation {
 id                    String        @id @default(cuid())
 candidateId           String?
 originalFilename      String
 fileHash              String        @unique
 sourceChannel         SourceChannel
 phoneFromFilename     String?
 dateFromFilename      DateTime?
 rawText               String
 normalizedText        String?
 aiSummary             String?
 candidateIntent       String?
 nextActionSuggestion  String?
 extractionConfidence  Float?
 importBatchId         String?
 sourcePath            String?
 objectKey             String?
 createdAt             DateTime      @default(now())
 updatedAt             DateTime      @updatedAt

 candidate             Candidate?    @relation(fields: [candidateId], references: [id], onDelete: SetNull)
 extractionResults     ExtractionResult[]
 matchingDecisions     MatchingDecision[]
 activities            CandidateActivity[]

 @@index([candidateId])
 @@index([sourceChannel])
 @@index([phoneFromFilename])
 @@index([dateFromFilename])
}

model CandidateDocument {
 id                String                 @id @default(cuid())
 candidateId       String?
 documentType      DocumentType
 reviewStatus      DocumentReviewStatus   @default(PENDING)
 extractedName     String?
 extractedNumber   String?
 issuingCountry    String?
 issueDate         DateTime?
 expiryDate        DateTime?
 requiresReview    Boolean                @default(false)
 isReadable        Boolean?
 confidence        Float?
 notes             String?
 createdAt         DateTime               @default(now())
 updatedAt         DateTime               @updatedAt

 candidate         Candidate?             @relation(fields: [candidateId], references: [id], onDelete: SetNull)
 versions          CandidateDocumentVersion[]
 extractionResults ExtractionResult[]
 matchingDecisions MatchingDecision[]
 activities        CandidateActivity[]

 @@index([candidateId])
 @@index([documentType])
 @@index([reviewStatus])
 @@index([expiryDate])
}

model CandidateDocumentVersion {
 id                  String             @id @default(cuid())
 candidateDocumentId String
 originalFilename    String
 objectKey           String
 mimeType            String?
 extension           String?
 versionNumber       Int                @default(1)
 pageNumber          Int?
 fileHash            String             @unique
 fileSize            Int?
 ocrText             String?
 sourcePath          String?
 createdAt           DateTime           @default(now())

 candidateDocument   CandidateDocument  @relation(fields: [candidateDocumentId], references: [id], onDelete: Cascade)

 @@index([candidateDocumentId])
 @@index([versionNumber])
 @@index([pageNumber])
}

model ExtractionResult {
 id             String                 @id @default(cuid())
 sourceType     SourceEntityType
 sourceId       String
 entityType     String
 fieldName      String
 extractedValue String?
 normalizedValue String?
 confidence     Float?
 method         String?
 reviewStatus   ExtractionReviewStatus @default(PENDING)
 createdAt      DateTime               @default(now())
 reviewedAt     DateTime?
 reviewedById   String?

 reviewedBy     User?                  @relation("ExtractionReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)

 conversation   CandidateConversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
 conversationId String?

 document       CandidateDocument?     @relation(fields: [documentId], references: [id], onDelete: Cascade)
 documentId     String?

 spreadsheetRow SpreadsheetImportRow?  @relation(fields: [spreadsheetRowId], references: [id], onDelete: Cascade)
 spreadsheetRowId String?

 @@index([sourceType, sourceId])
 @@index([fieldName])
 @@index([reviewStatus])
 @@index([conversationId])
 @@index([documentId])
 @@index([spreadsheetRowId])
}

model MatchingDecision {
 id               String                 @id @default(cuid())
 sourceType       SourceEntityType
 sourceId         String
 candidateId      String?
 matchType        MatchType
 confidence       Float?
 resolutionStatus MatchResolutionStatus  @default(REVIEW_REQUIRED)
 notes            String?
 createdAt        DateTime               @default(now())
 resolvedAt       DateTime?
 resolvedById     String?

 resolvedBy       User?                  @relation("MatchingResolvedBy", fields: [resolvedById], references: [id], onDelete: SetNull)
 candidate        Candidate?             @relation(fields: [candidateId], references: [id], onDelete: SetNull)

 conversation     CandidateConversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
 conversationId   String?

 document         CandidateDocument?     @relation(fields: [documentId], references: [id], onDelete: Cascade)
 documentId       String?

 spreadsheetRow   SpreadsheetImportRow?  @relation(fields: [spreadsheetRowId], references: [id], onDelete: Cascade)
 spreadsheetRowId String?

 @@index([sourceType, sourceId])
 @@index([candidateId])
 @@index([resolutionStatus])
 @@index([conversationId])
 @@index([documentId])
 @@index([spreadsheetRowId])
}

model CandidateStatusHistory {
 id           String           @id @default(cuid())
 candidateId  String
 fromStatus   CandidateStatus?
 toStatus     CandidateStatus
 changedById  String
 reason       String?
 createdAt    DateTime         @default(now())

 candidate    Candidate         @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 changedBy    User              @relation("StatusChangedBy", fields: [changedById], references: [id], onDelete: Restrict)

 @@index([candidateId])
 @@index([toStatus])
 @@index([changedById])
 @@index([createdAt])
}

model CandidateTask {
 id            String      @id @default(cuid())
 candidateId   String
 type          TaskType
 title         String
 description   String?
 assignedToId  String?
 dueDate       DateTime?
 status        TaskStatus  @default(OPEN)
 autoGenerated Boolean     @default(false)
 createdAt     DateTime    @default(now())
 updatedAt     DateTime    @updatedAt

 candidate     Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 assignedTo    User?       @relation("TaskAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)

 @@index([candidateId])
 @@index([assignedToId])
 @@index([status])
 @@index([dueDate])
}

model CandidateActivity {
 id           String                 @id @default(cuid())
 candidateId  String
 activityType String
 title        String
 description  String?
 sourceType   SourceEntityType?
 sourceId     String?
 createdById  String?
 createdAt    DateTime               @default(now())

 candidate    Candidate              @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 createdBy    User?                  @relation("ActivityCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

 conversation CandidateConversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)
 conversationId String?

 document     CandidateDocument?     @relation(fields: [documentId], references: [id], onDelete: SetNull)
 documentId   String?

 @@index([candidateId])
 @@index([activityType])
 @@index([createdAt])
 @@index([conversationId])
 @@index([documentId])
}

model LegalReview {
 id            String            @id @default(cuid())
 candidateId   String
 status        LegalReviewStatus @default(PENDING)
 assignedToId  String?
 summary       String?
 missingItems  Json?
 notes         String?
 startedAt     DateTime?
 completedAt   DateTime?
 createdAt     DateTime          @default(now())
 updatedAt     DateTime          @updatedAt

 candidate     Candidate         @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 assignedTo    User?             @relation("LegalAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)

 @@index([candidateId])
 @@index([status])
 @@index([assignedToId])
}

model CoordinatorHandover {
 id                   String         @id @default(cuid())
 candidateId          String
 coordinatorId        String?
 projectName          String?
 accommodationAddress String?
 travelDate           DateTime?
 arrivalDate          DateTime?
 status               HandoverStatus @default(PENDING)
 notes                String?
 createdAt            DateTime       @default(now())
 updatedAt            DateTime       @updatedAt

 candidate            Candidate      @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 coordinator          User?          @relation("HandoverAssignedTo", fields: [coordinatorId], references: [id], onDelete: SetNull)

 @@index([candidateId])
 @@index([coordinatorId])
 @@index([status])
}

model CandidateIssue {
 id           String      @id @default(cuid())
 candidateId  String
 type         IssueType
 title        String
 description  String?
 status       IssueStatus @default(OPEN)
 assignedToId String?
 createdAt    DateTime    @default(now())
 updatedAt    DateTime    @updatedAt

 candidate    Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)
 assignedTo   User?       @relation("IssueAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)

 @@index([candidateId])
 @@index([type])
 @@index([status])
 @@index([assignedToId])
}

model SpreadsheetImport {
 id               String                 @id @default(cuid())
 originalFilename String
 fileHash         String                 @unique
 importedById     String
 importType       SpreadsheetImportType
 status           SpreadsheetImportStatus @default(UPLOADED)
 summary          String?
 objectKey        String?
 sourcePath       String?
 createdAt        DateTime               @default(now())
 updatedAt        DateTime               @updatedAt

 importedBy       User                   @relation("SpreadsheetImportedBy", fields: [importedById], references: [id], onDelete: Restrict)
 rows             SpreadsheetImportRow[]

 @@index([importedById])
 @@index([importType])
 @@index([status])
}

model SpreadsheetImportRow {
 id               String                 @id @default(cuid())
 spreadsheetImportId String
 rowNumber        Int
 rawJson          Json
 parsedJson       Json?
 candidateId      String?
 actionSuggested  String?
 actionResolved   String?
 createdAt        DateTime               @default(now())

 spreadsheetImport SpreadsheetImport     @relation(fields: [spreadsheetImportId], references: [id], onDelete: Cascade)
 candidate         Candidate?            @relation(fields: [candidateId], references: [id], onDelete: SetNull)
 extractionResults ExtractionResult[]
 matchingDecisions MatchingDecision[]

 @@index([spreadsheetImportId])
 @@index([rowNumber])
 @@index([candidateId])
}

model AuditLog {
 id           String    @id @default(cuid())
 actorId      String?
 entityType   String
 entityId     String
 action       String
 metadataJson Json?
 createdAt    DateTime  @default(now())

 actor        User?     @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

 @@index([actorId])
 @@index([entityType, entityId])
 @@index([action])
 @@index([createdAt])
}

2. Why this schema is the right first version
This is built around your actual operational pain.
It supports:
manual WhatsApp .txt import
document ingestion and versioning
candidate matching with confidence
review-first automation
status tracking
legal review
coordinator handover
Excel import
audit trail
It avoids:
fake live WhatsApp automation
hard dependency on APIs you do not have
dangerous blind overwrites
spreadsheet chaos as source of truth

3. Key design choices explained
A. Candidate is the central truth
Everything revolves around the candidate.
That is correct because your real work is not “documents” or “messages” in isolation.
It is:
person → process → documents → approval → placement

B. CandidateIdentifier is separate
This is very important.
A candidate can have:
more than one phone
different phone formatting
passport number
visa number
PESEL
karta pobytu number
If you store all that only in the main Candidate table, the model gets ugly fast.
This separate table gives you:
flexible identifiers
matching power
verification logic
future deduplication

C. CandidateConversation is first-class
This is the backbone of your WhatsApp workaround.
Each .txt file becomes a real entity with:
filename
phone clue
date clue
raw text
normalized text
AI summary
intent
next action
matching results
That is exactly what your workflow needs.

D. CandidateDocument + CandidateDocumentVersion
This split is the correct move.
Because a single logical document may have:
multiple pages
multiple images
multiple resubmissions
different formats
Example:
passport page 1 jpg
passport page 2 jpg
passport full pdf later
One document, many versions/pages.
That is why this structure is clean.

E. ExtractionResult and MatchingDecision
These two tables are gold.
They let you separate:
what the system thinks
from
what the system accepts as truth
That is the difference between a usable automation app and a dangerous one.

F. SpreadsheetImport and SpreadsheetImportRow
You still live in Excel reality today.
So the schema respects that instead of pretending Excel doesn’t exist.
This lets you:
import a file
inspect parsed rows
suggest actions
resolve before commit
Very important for safe migration from chaos to structure.

4. What I would slightly improve in version 2 of the schema
This first draft is strong enough to build on, but later I would probably add:
Optional later additions
DocumentRequirementRule
StatusTransitionRule
ImportBatch
Notification
Reminder
CandidateMergeHistory
ConsentRecord
PipelineStageConfig
Country
Language
RecruitmentSource
DocumentFieldValue
For now, this first schema is better because it is still practical and not overengineered.

5. What you should do with this schema next
The smartest next move is:
Step 1
Use this as the base schema.prisma
Step 2
Generate the first migration
Step 3
Seed:
users
roles
a few offers
a few sample candidates
sample statuses
Step 4
Build the first modules against this schema:
auth
candidates
candidate timeline
conversation import
document import
That’s the right sequence.

6. Things I would adjust before first migration
Before you run the first real migration, I’d review these 6 points with you:
1. internalCode format
Example:
FOLGA-2026-000001
OCH-000001
We should define the exact format.
2. language fields
Right now they are simple strings like:
spanishLevel
englishLevel
polishLevel
Later we may want enums or a shared scale:
NONE
BASIC
INTERMEDIATE
ADVANCED
NATIVE
3. gender
Could remain free text or become enum later.
4. missingItems in LegalReview
Currently Json, which is good for speed.
Later we may normalize it.
5. activityType
Currently string for flexibility.
Later we may enum it.
6. actionSuggested / actionResolved in spreadsheet rows
Good enough now, but could become enums later.
This is a smart MVP tradeoff.

7. My honest verdict on this schema
This is a good V1 production-oriented Prisma foundation.
Not toy-level.
Not overcomplicated.
Not fake-enterprise fluff.
It is actually aligned with:
your operational mess
your ingestion workflow
your legal sensitivity
your future API plans
your Hostinger VPS deployment path
So yes — this is the right base.

8. Best next step
Now that the schema foundation exists, the smartest next move is:
NestJS module map + API DTO contract
Meaning I define:
which NestJS modules to create first
the endpoint structure
DTOs for candidate, conversation, document, status, and spreadsheet flows
service responsibilities
queue responsibilities
That will let you start building the backend in a clean order.
If you want, I’ll continue directly with the NestJS backend blueprint for ORI-CRUIT-HUB 1.0.
ok. continue then Please write in English language.
Perfect. Let’s continue with the NestJS backend blueprint for ORI-CRUIT-HUB 1.0.
This will give you the real backend execution map:
module structure
endpoint map
DTO plan
service responsibilities
queue responsibilities
processing flow
recommended implementation order
This is the layer that turns the Prisma schema into an actual working product.

1. Backend architecture goal
The backend should do 5 things well:
expose clean APIs for the frontend
handle file-driven ingestion
process heavy tasks asynchronously
keep sensitive data auditable
stay modular for future integrations
So the backend should be split into:
core domain modules
intake modules
workflow modules
support modules
processing/worker modules

2. Recommended NestJS app structure
apps/api/src
src/
├─ main.ts
├─ app.module.ts
├─ config/
│  ├─ env.validation.ts
│  ├─ app.config.ts
│  ├─ storage.config.ts
│  └─ queue.config.ts
├─ common/
│  ├─ decorators/
│  ├─ guards/
│  ├─ interceptors/
│  ├─ filters/
│  ├─ pipes/
│  ├─ dto/
│  ├─ utils/
│  └─ constants/
├─ prisma/
│  ├─ prisma.module.ts
│  └─ prisma.service.ts
├─ auth/
├─ users/
├─ candidates/
├─ candidate-identifiers/
├─ offers/
├─ conversations/
├─ conversation-intake/
├─ documents/
├─ document-intake/
├─ extraction/
├─ matching/
├─ pipeline/
├─ tasks/
├─ activities/
├─ legal-review/
├─ coordinator-handover/
├─ issues/
├─ spreadsheet-imports/
├─ reports/
├─ storage/
├─ audit/
├─ health/
└─ queues/
This keeps the app clean and future-proof.

3. Backend module map
Here’s the practical role of each module.
3.1 auth
Handles:
login
session/JWT issuing
auth guards
current user resolution
Main responsibilities
validate credentials
return auth token/session data
enforce role access

3.2 users
Handles:
internal user CRUD
role assignment
activation/deactivation
Main responsibilities
create recruiter/legal/coordinator/admin users
list users by role
support assignment workflows

3.3 candidates
This is the heart of the app.
Handles:
candidate CRUD
candidate profile
candidate search/filter
candidate details
candidate merge entrypoint later
Main responsibilities
create candidate
update candidate accepted values
fetch candidate timeline summary
list candidates by status / recruiter / missing docs

3.4 candidate-identifiers
Handles:
phone numbers
emails
passport/PESEL/VISA/KP identifiers
Main responsibilities
normalize identifiers
attach identifiers
verify uniqueness conflicts
support matching

3.5 offers
Handles:
job/project offer records
assigning candidate interest to offers

3.6 conversations
Handles:
stored conversation records
fetching details
manual edits to reviewed summaries
conversation-to-candidate linkage

3.7 conversation-intake
Handles:
upload/import of .txt
filename parsing
import validation
queue dispatch for processing
This should be separated from conversations because intake and management are different jobs.

3.8 documents
Handles:
document record retrieval
document review
candidate document listing
metadata correction
document linkage

3.9 document-intake
Handles:
document uploads
batch import
file hashing
MinIO storage
OCR queue dispatch
classification queue dispatch

3.10 extraction
Handles:
extracted fields from conversation/document/spreadsheet sources
review and confirmation of extracted values

3.11 matching
Handles:
candidate matching logic
confidence scoring
candidate creation suggestion
duplicate-risk logic
match review actions

3.12 pipeline
Handles:
status transition rules
status changes
workflow blockers
auto-created tasks after transitions

3.13 tasks
Handles:
candidate tasks
due dates
assignees
completion workflow

3.14 activities
Handles:
timeline events
system-generated operational history

3.15 legal-review
Handles:
legal queue
approval / rejection / request-more-info
missing item review
legal summary notes

3.16 coordinator-handover
Handles:
coordinator queue
operational readiness package
travel/accommodation handoff state

3.17 issues
Handles:
post-placement issues
payment / accommodation / contract / communication cases

3.18 spreadsheet-imports
Handles:
Excel/CSV imports
row parsing
preview-before-commit
suggested candidate links
import resolution

3.19 reports
Handles:
aggregated dashboard queries
export generation requests
KPI summaries

3.20 storage
Handles:
MinIO integration
signed URLs
object upload paths
object deletion rules

3.21 audit
Handles:
sensitive action logging
entity change logs
document access logs

3.22 health
Handles:
health checks
readiness checks
DB/Redis/MinIO status

3.23 queues
Shared queue helpers, names, and producer abstractions.

4. Recommended controller/service layout
For most modules, use this pattern:
module/
├─ module.module.ts
├─ module.controller.ts
├─ module.service.ts
├─ dto/
├─ types/
├─ utils/
└─ policies/
For heavier modules, add sub-services:
candidates/
├─ candidates.controller.ts
├─ candidates.service.ts
├─ candidates.query.service.ts
├─ candidates.command.service.ts
├─ dto/
└─ policies/
Use this split only when the module grows. Don’t overcomplicate too early.

5. API contract blueprint
Now the important part: the actual API map.

5.1 Auth endpoints
POST /auth/login
Purpose:
Authenticate user.
Request DTO
{
 email: string;
 password: string;
}
Response
{
 accessToken: string;
 user: {
   id: string;
   email: string;
   firstName: string;
   lastName: string;
   role: string;
 };
}

GET /auth/me
Purpose:
Return current user.

5.2 Users endpoints
GET /users
Filterable by role / active state
POST /users
Create user
PATCH /users/:id
Update user
POST /users/:id/activate
POST /users/:id/deactivate

5.3 Candidate endpoints
GET /candidates
Filters:
status
recruiterAssignedId
coordinatorAssignedId
nationality
primaryLanguage
search query
missingDocs flag
legalBlocked flag
Query DTO
{
 page?: number;
 pageSize?: number;
 search?: string;
 status?: CandidateStatus;
 recruiterAssignedId?: string;
 coordinatorAssignedId?: string;
}

POST /candidates
Create candidate manually.
DTO
{
 firstName?: string;
 middleName?: string;
 lastName?: string;
 secondLastName?: string;
 phonePrimary?: string;
 email?: string;
 nationality?: string;
 currentCountry?: string;
 primaryLanguage?: string;
 sourceChannel?: SourceChannel;
 sourceLabel?: string;
 recruiterAssignedId?: string;
}

GET /candidates/:id
Return full profile:
candidate
identifiers
status history
tasks
recent conversations
recent documents
legal summary
coordinator summary
issues summary

PATCH /candidates/:id
Update accepted candidate fields.
DTO
{
 firstName?: string;
 middleName?: string;
 lastName?: string;
 secondLastName?: string;
 gender?: string;
 birthDate?: string;
 nationality?: string;
 currentCountry?: string;
 currentCity?: string;
 primaryLanguage?: string;
 secondaryLanguage?: string;
 polishLevel?: string;
 englishLevel?: string;
 spanishLevel?: string;
 phonePrimary?: string;
 phoneSecondary?: string;
 email?: string;
 availabilityDate?: string;
 travelDate?: string;
 arrivalDate?: string;
 accommodationDate?: string;
 recruiterAssignedId?: string;
 coordinatorAssignedId?: string;
 notesInternal?: string;
}

POST /candidates/:id/status
Change status.
DTO
{
 toStatus: CandidateStatus;
 reason?: string;
}
This endpoint must:
validate allowed transition
create status history
create activity
optionally auto-create tasks

GET /candidates/:id/timeline
Return timeline feed.
GET /candidates/:id/tasks
POST /candidates/:id/tasks
GET /candidates/:id/issues
POST /candidates/:id/issues

5.4 Candidate identifier endpoints
POST /candidates/:id/identifiers
Attach identifier.
DTO
{
 type: IdentifierType;
 valueRaw: string;
 isVerified?: boolean;
 sourceChannel?: SourceChannel;
 confidence?: number;
}

PATCH /identifiers/:id
Update verification state or value.

5.5 Conversation intake endpoints
POST /intake/conversations/upload
Upload single .txt.
Use multipart.
Metadata DTO
{
 sourcePath?: string;
}
This endpoint should:
validate extension
compute hash
store file/object if needed
create CandidateConversation record
enqueue parse job

POST /intake/conversations/import-batch
For multiple files.
DTO
{
 items: Array<{
   originalFilename: string;
   rawText: string;
   sourcePath?: string;
 }>;
}
Useful later for sync scripts or batch imports.

5.6 Conversation management endpoints
GET /conversations
Filters:
unresolved only
by candidate
by date
by source channel
GET /conversations/:id
Returns:
raw/normalized text
summary
extracted facts
matching decisions
linked candidate

POST /conversations/:id/reprocess
Re-run parsing pipeline.

POST /conversations/:id/link-candidate
Manually link conversation.
DTO
{
 candidateId: string;
}
Should also create:
activity
resolved matching decision if needed

POST /conversations/:id/create-candidate
Create new candidate from conversation extraction.
DTO
{
 firstName?: string;
 lastName?: string;
 phonePrimary?: string;
 nationality?: string;
 primaryLanguage?: string;
}

5.7 Document intake endpoints
POST /intake/documents/upload
Upload one or many files.
Use multipart.
Metadata DTO
{
 sourcePath?: string;
 candidateId?: string;
 hintedDocumentType?: DocumentType;
}
This should:
hash file
store in MinIO
create document/version record
enqueue OCR/classification/matching jobs

POST /intake/documents/import-batch
For scripted bulk imports later.

5.8 Document management endpoints
GET /documents
Filters:
candidateId
reviewStatus
documentType
expiresBefore
unresolvedOnly

GET /documents/:id
Returns:
logical doc
versions
extraction results
matching decisions
linked candidate
OCR text summary

PATCH /documents/:id/review
Review document.
DTO
{
 reviewStatus?: DocumentReviewStatus;
 documentType?: DocumentType;
 extractedName?: string;
 extractedNumber?: string;
 issuingCountry?: string;
 issueDate?: string;
 expiryDate?: string;
 requiresReview?: boolean;
 isReadable?: boolean;
 notes?: string;
}

POST /documents/:id/link-candidate
DTO
{
 candidateId: string;
}

POST /documents/:id/reprocess
Re-run OCR/classification pipeline.

5.9 Extraction endpoints
GET /extractions
Filters:
sourceType
reviewStatus
fieldName
candidateId maybe via joins

POST /extractions/:id/confirm
Confirm extracted value.
DTO
{
 applyToCandidate?: boolean;
}

POST /extractions/:id/reject
Reject extracted value.

This module is very important because it controls what becomes accepted truth.

5.10 Matching endpoints
GET /matches
Filters:
unresolved
duplicate risk
source type
POST /matches/:id/confirm
DTO
{
 candidateId: string;
}
POST /matches/:id/reject
POST /matches/:id/create-candidate
Create a new candidate from match context.

5.11 Pipeline endpoints
GET /pipeline/statuses
Return available statuses.
GET /pipeline/transitions
Optional helper endpoint for frontend.
POST /pipeline/candidates/:candidateId/transition
Same logic as candidate status change, but can remain separate if you prefer cleaner domain boundaries.
My opinion:
You can keep status change under /candidates/:id/status and use pipeline only for rule helpers.

5.12 Task endpoints
GET /tasks
Filters:
assignedToId
dueDate
status
type
POST /tasks
PATCH /tasks/:id
POST /tasks/:id/complete

5.13 Legal review endpoints
GET /legal-reviews
Filters:
status
assignedToId
candidateId
POST /legal-reviews
DTO
{
 candidateId: string;
 assignedToId?: string;
 summary?: string;
 missingItems?: any;
 notes?: string;
}

GET /legal-reviews/:id
PATCH /legal-reviews/:id
Update summary, missing items, notes, assignee.
POST /legal-reviews/:id/start
POST /legal-reviews/:id/request-info
POST /legal-reviews/:id/approve
POST /legal-reviews/:id/reject
These should also create:
candidate activity
status transition if appropriate
tasks if more info is required

5.14 Coordinator handover endpoints
GET /handovers
Filters:
status
coordinatorId
candidateId
POST /handovers
DTO
{
 candidateId: string;
 coordinatorId?: string;
 projectName?: string;
 accommodationAddress?: string;
 travelDate?: string;
 arrivalDate?: string;
 notes?: string;
}
PATCH /handovers/:id
POST /handovers/:id/notify
POST /handovers/:id/complete

5.15 Issues endpoints
GET /issues
POST /issues
PATCH /issues/:id
POST /issues/:id/resolve
POST /issues/:id/close

5.16 Spreadsheet import endpoints
POST /spreadsheet-imports/upload
Use multipart.
Should:
save original file
create SpreadsheetImport
enqueue parse job

GET /spreadsheet-imports
GET /spreadsheet-imports/:id
GET /spreadsheet-imports/:id/rows
POST /spreadsheet-imports/:id/commit
This is important.
Commit should:
process reviewed rows
create or update candidates
log all actions
produce summary results

POST /spreadsheet-import-rows/:id/link-candidate
POST /spreadsheet-import-rows/:id/create-candidate
PATCH /spreadsheet-import-rows/:id

5.17 Reports endpoints
GET /reports/dashboard
High-level counts:
new leads
waiting docs
legal queue
coordinator queue
placed
open issues
GET /reports/recruitment
GET /reports/legal
GET /reports/coordinators
GET /reports/management
POST /reports/exports
Request export generation.

5.18 Audit endpoints
GET /audit-logs
Restricted to admin/manager.
Filters:
entityType
entityId
actorId
action
date range

5.19 Health endpoints
GET /health/live
GET /health/ready
ready should check:
database
Redis
MinIO

6. DTO folder structure
Recommended structure:
candidates/dto/
├─ create-candidate.dto.ts
├─ update-candidate.dto.ts
├─ candidate-query.dto.ts
├─ change-candidate-status.dto.ts
├─ create-candidate-identifier.dto.ts
├─ create-candidate-task.dto.ts
└─ create-candidate-issue.dto.ts
Same idea for each major module.
Use:
class-validator
class-transformer
And keep DTOs very explicit. No vague “catch-all” payloads.

7. Service responsibility split
A big mistake would be putting everything in one huge service. Don’t do that.
Here’s the clean split.

7.1 CandidatesService
Handles:
create/update/get/list candidates
core candidate profile logic
Do not put matching or extraction logic here.

7.2 CandidateStatusService
Handles:
validating transitions
writing status history
triggering task/activity side effects
Could live inside pipeline or candidates.
I’d place it in pipeline.

7.3 ConversationsService
Handles:
retrieve conversation records
manual linking
display logic helpers

7.4 ConversationIntakeService
Handles:
validating uploads
creating raw records
pushing jobs to queues

7.5 DocumentsService
Handles:
read/update/review document records
link documents to candidates

7.6 DocumentIntakeService
Handles:
file uploads
object storage pathing
queue dispatch

7.7 ExtractionService
Handles:
create extraction results
confirm/reject extracted values
optional candidate update application

7.8 MatchingService
Handles:
score candidates against incoming source
create matching decisions
resolve match decisions
This is one of the most important services in the whole app.

7.9 SpreadsheetImportsService
Handles:
upload import file
parse results
list rows
commit chosen rows

7.10 LegalReviewService
Handles:
open review
assign review
approve/reject/request-info
side effects into candidate workflow

7.11 CoordinatorHandoverService
Handles:
create handover
update handover
notify / complete handover

7.12 AuditService
Handles:
append structured audit events
This should be callable from everywhere.

8. Queue and worker blueprint
Now the really important part for your ingestion-heavy app.
Use BullMQ queues for anything expensive or multi-step.

8.1 Recommended queues
conversation-intake
conversation-extraction
candidate-matching
document-intake
document-ocr
document-classification
document-extraction
spreadsheet-parse
spreadsheet-commit
report-exports
activity-side-effects
You do not need all from day one, but this is the right target structure.

8.2 Conversation queue flow
Queue: conversation-intake
Job payload:
{
 conversationId: string;
}
Worker steps
fetch conversation record
parse filename clues
normalize text
save normalized text
enqueue extraction job
enqueue matching job

Queue: conversation-extraction
Job payload:
{
 conversationId: string;
}
Worker steps
fetch normalized text
run extraction pipeline
create ExtractionResult rows
compute summary / intent / next action
update CandidateConversation

Queue: candidate-matching
Job payload:
{
 sourceType: "CONVERSATION" | "DOCUMENT" | "SPREADSHEET_ROW";
 sourceId: string;
}
Worker steps
gather identifiers/signals
compute candidate score matches
create MatchingDecision
optionally auto-link if confidence threshold reached
create activity if linked

8.3 Document queue flow
Queue: document-intake
Job payload:
{
 documentId: string;
 versionId: string;
}
Worker steps
validate object exists
enqueue OCR
enqueue classification
enqueue matching when signals are ready

Queue: document-ocr
Job payload:
{
 versionId: string;
}
Worker steps
fetch file from storage
run OCR
save OCR text to CandidateDocumentVersion
enqueue extraction/classification

Queue: document-classification
Job payload:
{
 documentId: string;
}
Worker steps
inspect filename
inspect OCR text
infer type/confidence
update document type/review flags

Queue: document-extraction
Job payload:
{
 documentId: string;
}
Worker steps
inspect OCR text
extract number/name/date/country clues
create ExtractionResult rows
update CandidateDocument
enqueue matching

8.4 Spreadsheet queue flow
Queue: spreadsheet-parse
Job payload:
{
 spreadsheetImportId: string;
}
Worker steps
read workbook
map rows
create SpreadsheetImportRow
create preliminary extraction/matching suggestions

Queue: spreadsheet-commit
Job payload:
{
 spreadsheetImportId: string;
 initiatedById: string;
}
Worker steps
process approved rows
create/update candidates
link identifiers
create summary
write audit logs

9. Matching engine logic blueprint
This deserves its own clean service.
Input signals by source type
Conversation
phone from filename
detected name in text
nationality clues
language clues
email clues
Document
filename name
phone if included
OCR name
OCR identifier number
issuing country
Spreadsheet row
full name
phone
email
project
source notes

Matching score example
You can tune later, but start simple.
High-weight
exact phone: +0.70
exact passport/PESEL/VISA: +0.90
exact email: +0.80
Medium-weight
exact normalized full name: +0.40
full name + nationality: +0.55
full name + current country: +0.50
Low-weight
fuzzy name similarity: +0.15 to +0.35
same offer + similar name: +0.20

Thresholds
>= 0.90 auto-link
0.70–0.89 review required
< 0.70 unresolved
Keep this configurable later.

10. Status transition service blueprint
This should not be raw controller logic.
Create a dedicated service, something like:
PipelineService
Responsibilities
validate transition
check blockers
write status history
create activity
trigger side effects
Example blockers
READY_FOR_LEGAL_REVIEW only if:
candidate linked
minimum required docs present
no unresolved identity mismatch
COORDINATOR_HANDOVER_PENDING only if:
legal approved
PLACED only if:
coordinator handover exists
travel/accommodation relevant data acceptable

11. Storage service blueprint
Use one storage abstraction service.
StorageService
Methods:
uploadObject
deleteObject
getSignedUrl
buildDocumentObjectKey
buildConversationObjectKey
Example object key patterns
conversations/{year}/{month}/{conversationId}.txt
documents/{candidateId-or-unresolved}/{documentType}/{documentId}/v{version}-p{page}.{ext}
spreadsheets/{year}/{month}/{spreadsheetImportId}.xlsx
exports/{year}/{month}/{exportId}.xlsx
That structure is clean and scalable.

12. Audit logging strategy
You need this from day one.
Audit events to write for:
login
candidate creation
candidate update
status transition
manual candidate link
document review change
extraction confirm/reject
legal approval/rejection
spreadsheet commit
file access for sensitive docs
Use a small helper method everywhere so logging doesn’t become painful.

13. Validation and normalization helpers
Create reusable utilities early.
Important helpers
phone normalization
name normalization
filename parsing
date parsing from filenames/text
hash calculation
extension validation
document type hint inference
These small helpers will save you massive pain later.

14. Suggested backend implementation order
This is the smartest order.
Phase 1
Prisma setup
auth
users
candidates
candidate identifiers
activities
pipeline basic status change
Phase 2
conversations
conversation intake
matching basic
extraction basic
review queue endpoints
Phase 3
storage
documents
document intake
OCR/extraction/classification pipeline hooks
Phase 4
legal review
coordinator handover
tasks
issues
Phase 5
spreadsheet imports
reports
audit hardening
health/readiness
export generation
That is the right path.

15. Worker app structure
For apps/worker, use something like:
apps/worker/src/
├─ main.ts
├─ worker.module.ts
├─ queues/
│  ├─ conversation-intake.processor.ts
│  ├─ conversation-extraction.processor.ts
│  ├─ candidate-matching.processor.ts
│  ├─ document-intake.processor.ts
│  ├─ document-ocr.processor.ts
│  ├─ document-classification.processor.ts
│  ├─ document-extraction.processor.ts
│  ├─ spreadsheet-parse.processor.ts
│  └─ spreadsheet-commit.processor.ts
├─ services/
│  ├─ text-normalizer.service.ts
│  ├─ filename-parser.service.ts
│  ├─ ocr.service.ts
│  ├─ extraction-engine.service.ts
│  ├─ matching-engine.service.ts
│  └─ spreadsheet-parser.service.ts
└─ shared/
Keep worker logic separate from API request logic.

16. Review queue API concept
You will need this very early.
I’d expose a unified review endpoint too.
GET /review-queue
Filters:
type: conversation | document | match | extraction | legal
status
assignedTo
candidateId
This makes the frontend easier.
Internally, it can aggregate from multiple tables.

17. MVP backend deliverables
A real MVP backend should be considered ready when it can do these 10 things:
authenticate users
create and update candidates
change candidate statuses with history
upload conversation .txt files
parse and store conversation summaries
suggest/make candidate matches
upload and store documents
create document review records
open legal and handover records
import spreadsheet files for preview and resolution
If it does those 10 things well, the backend is already valuable.

18. Strong opinion on code organization
Do not mix:
file upload logic
OCR logic
matching logic
candidate update logic
controller response formatting
in one service.
That becomes unmaintainable fast.
Keep boundaries clean:
intake receives
workers process
domain modules own accepted state
review modules control truth confirmation
That’s the architecture you want.

19. What should come next
Now the smartest next layer is the frontend app blueprint.
Meaning I define:
Next.js app structure
app routes and page hierarchy
layout system
main screens
candidate profile UI sections
review queue UI
upload flows
dashboard structure
That would complete the full high-level technical blueprint from database to backend to frontend.
Ok. Continue
Perfect. Let’s complete the blueprint with the frontend app architecture for ORI-CRUIT-HUB 1.0.
This is where the system becomes usable in real life.
The frontend must do one thing very well:
turn messy backend power into a calm, fast, operational workspace.
For your use case, the frontend should feel like:
a control center
an intake desk
a review station
a candidate cockpit
Not like a generic CRM.

1. Frontend goal
The frontend should optimize these daily actions:
find a candidate fast
understand their current state fast
review imported conversations fast
review imported documents fast
move the candidate forward fast
spot blockers fast
avoid opening five tools at once
So the UI should be built around:
lists
detail panels
review queues
status actions
quick summaries
low-friction updates

2. Recommended frontend stack
Use:
Next.js App Router
TypeScript
TailwindCSS
shadcn/ui
React Hook Form
Zod
TanStack Query
TanStack Table
Lucide icons
Optional later:
react-dropzone
recharts
framer-motion
My strong opinion:
For this app, keep the UI clean and operational first.
Do not overdesign the first version.

3. Frontend app structure
Recommended structure for apps/web:
apps/web/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  └─ forgot-password/
│  │  ├─ (dashboard)/
│  │  │  ├─ app/
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ candidates/
│  │  │  │  ├─ intake/
│  │  │  │  ├─ legal/
│  │  │  │  ├─ coordinators/
│  │  │  │  ├─ issues/
│  │  │  │  ├─ reports/
│  │  │  │  └─ settings/
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ candidates/
│  │  ├─ conversations/
│  │  ├─ documents/
│  │  ├─ intake/
│  │  ├─ legal/
│  │  ├─ coordinators/
│  │  ├─ issues/
│  │  ├─ reports/
│  │  ├─ forms/
│  │  ├─ tables/
│  │  └─ ui/
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ candidates/
│  │  ├─ conversations/
│  │  ├─ documents/
│  │  ├─ matching/
│  │  ├─ legal/
│  │  ├─ handover/
│  │  ├─ spreadsheet-imports/
│  │  └─ reports/
│  ├─ lib/
│  │  ├─ api/
│  │  ├─ auth/
│  │  ├─ utils/
│  │  ├─ formatters/
│  │  ├─ constants/
│  │  └─ validators/
│  ├─ hooks/
│  ├─ types/
│  └─ styles/
├─ public/
└─ package.json

4. Route map
This should be the first real route structure.
Auth routes
/login
/forgot-password
Main app routes
/app
/app/dashboard

/app/candidates
/app/candidates/new
/app/candidates/[id]

/app/intake
/app/intake/conversations
/app/intake/documents
/app/intake/spreadsheets
/app/intake/review-queue

/app/legal
/app/legal/reviews
/app/legal/reviews/[id]

/app/coordinators
/app/coordinators/handovers
/app/coordinators/handovers/[id]

/app/issues
/app/issues/[id]

/app/reports
/app/reports/recruitment
/app/reports/legal
/app/reports/coordinators
/app/reports/management

/app/settings
/app/settings/users
/app/settings/pipeline
/app/settings/document-types
/app/settings/import-rules
This is enough for a strong v1.

5. Main layout system
The UI should use one main dashboard shell.
App shell structure
left sidebar
top header
content area
optional right-side detail rail on some screens
Sidebar sections
Dashboard
Candidates
Intake
Legal
Coordinators
Issues
Reports
Settings
Header actions
global search
quick add candidate
upload menu
current user
notifications later

6. Core page blueprint
Now the important part: what each page should do.

6.1 Dashboard page
Route:
/app/dashboard
Purpose:
Provide the operational overview.
Main widgets
New leads
Waiting for documents
Ready for legal review
Legal blocked
Coordinator handover pending
Placed this week
Open issues
Secondary widgets
My tasks
My candidates needing follow-up
Recent imports
Unresolved review items
Visual style
This page should be:
lightweight
summary-first
not overloaded with charts
My opinion:
Use cards and small tables first. Fancy BI can come later.

6.2 Candidate list page
Route:
/app/candidates
Purpose:
This is one of the most used screens in the entire app.
Main UI areas
filter bar
candidate data table
bulk actions later
quick preview drawer later
Filters
search
status
recruiter
nationality
primary language
legal state
missing docs
coordinator state
Table columns
name
phone
nationality
language
current status
recruiter
last activity
missing docs indicator
legal indicator
coordinator indicator
Row click
Open candidate profile page.
This page must be fast and extremely usable.

6.3 Candidate profile page
Route:
/app/candidates/[id]
This is the most important page in the product.
The candidate profile should feel like a mission control screen.
Layout
Use a 3-zone layout:
Left column
Candidate overview and quick actions
Main column
Tabs or stacked sections
Right column
Tasks, blockers, and next steps

Candidate profile — section structure
A. Candidate header card
Show:
full name
nationality
phone
email
current status
recruiter
coordinator
main source
quick action buttons
Quick action buttons
change status
add note
add task
upload document
upload conversation
open legal review
create handover

B. Identity section
Show:
full name fields
birth date
nationality
current country
languages
identifiers summary

C. Recruitment section
Show:
source
interest/offer
availability date
recruiter notes
current pipeline stage

D. Documents section
Show:
required docs checklist
uploaded docs by type
review state
expiry warnings
unresolved docs
This section should make it obvious what is missing.

E. Conversations section
Show:
imported conversation records
summary
date
intent
next action suggestion
unresolved extraction flags

F. Legal section
Show:
legal review status
latest legal note
missing legal items
action buttons

G. Coordinator section
Show:
handover status
project
travel date
arrival date
accommodation data

H. Issues section
Show:
open issues
issue type
assignee
status

I. Timeline section
This is huge.
The timeline should show:
imports
status changes
document uploads
conversation imports
task creation/completion
legal actions
coordinator actions
This becomes your operational memory.

6.4 Intake home page
Route:
/app/intake
Purpose:
Entry point for file-driven workflows.
Cards
Upload conversations
Upload documents
Upload spreadsheets
Open review queue
Summary widgets
new conversation imports today
new document imports today
unresolved matches
unreadable docs
spreadsheet rows awaiting review
This page should feel like an intake control panel.

6.5 Conversation intake page
Route:
/app/intake/conversations
Purpose:
Upload or review imported .txt conversations.
Main UI
upload drop zone
batch import area
recent imports table
Table columns
filename
source channel
phone from filename
linked candidate
extraction confidence
review state
created at
Row actions
open detail
reprocess
link candidate
create candidate

6.6 Conversation detail screen
Can be a route or side drawer.
Show
raw text
normalized text
AI summary
detected intent
next action suggestion
extracted facts
matching decisions
candidate link status
Actions
confirm candidate link
create candidate
reject extraction
confirm extraction
create follow-up task
This screen must save you time, not bury you in noise.

6.7 Document intake page
Route:
/app/intake/documents
Purpose:
Upload and review imported document files.
Main UI
upload zone
batch uploader
recent documents table
Table columns
filename
candidate
document type
review status
readable?
extracted number
expiry date
created at
Row actions
open document review
link candidate
reprocess
mark reviewed

6.8 Document review screen
This is another critical page.
Layout
Left side:
file preview / image / PDF viewer
Right side:
document metadata
extracted fields
OCR text
review controls
candidate match suggestions
Actions
approve classification
change doc type
confirm candidate link
reject as unreadable
mark duplicate
confirm extracted number/date/name
This page should be optimized for speed.

6.9 Spreadsheet intake page
Route:
/app/intake/spreadsheets
Purpose:
Import Excel files safely.
Main UI
upload area
imported files list
import status
preview row counts
errors summary
Detail view
For one spreadsheet import:
row table
parsed values
candidate link suggestion
actions per row
commit selected rows
This will be one of the biggest operational wins later.

6.10 Unified review queue page
Route:
/app/intake/review-queue
This is one of the most important pages in the app.
It should aggregate:
unmatched conversations
low-confidence extractions
unresolved document links
unreadable docs
duplicate risks
spreadsheet row conflicts
Filters
queue type
priority
candidate
assignee
date
status
Table columns
type
title
candidate
reason
confidence
age
action
This page is where chaos gets cleaned up.

6.11 Legal review queue
Route:
/app/legal/reviews
Purpose:
Legal team should have a clean workflow.
Table columns
candidate
recruiter
status
missing items
documents count
created at
assigned to
Row click
Open legal review details.

6.12 Legal review detail page
Route:
/app/legal/reviews/[id]
Sections
candidate summary
linked identifiers
uploaded docs
missing docs
extracted legal signals
notes
legal decision actions
Actions
start review
request more info
approve
reject
This page should be sharp and minimal.

6.13 Coordinator handover queue
Route:
/app/coordinators/handovers
Purpose:
Operational handoff management.
Columns
candidate
coordinator
project
travel date
arrival date
accommodation status
handover status

6.14 Coordinator handover detail
Route:
/app/coordinators/handovers/[id]
Sections
candidate summary
legal approval indicator
project/housing/travel info
notes
handover status actions

6.15 Issues page
Route:
/app/issues
Purpose:
Manage support-like cases after or around placement.
Filters
type
status
assignee
candidate
Columns
issue title
candidate
type
status
assigned to
updated at

6.16 Reports pages
Routes:
/app/reports/recruitment
/app/reports/legal
/app/reports/coordinators
/app/reports/management
Keep reports practical.
Recruitment report
leads by source
candidate counts by status
recruiter workload
document completion rate
Legal report
queue volume
approval/rejection rate
more-info-required rate
review turnaround
Coordinator report
handover queue
pending arrival
pending housing
completed placements
Management report
end-to-end funnel
throughput
bottlenecks
open issue volume

7. Frontend component architecture
Use a modular component system.
Layout components
components/layout/
├─ app-shell.tsx
├─ sidebar.tsx
├─ topbar.tsx
├─ page-header.tsx
└─ section-card.tsx
Candidate components
components/candidates/
├─ candidate-table.tsx
├─ candidate-filters.tsx
├─ candidate-header-card.tsx
├─ candidate-identity-card.tsx
├─ candidate-recruitment-card.tsx
├─ candidate-documents-card.tsx
├─ candidate-conversations-card.tsx
├─ candidate-legal-card.tsx
├─ candidate-handover-card.tsx
├─ candidate-issues-card.tsx
├─ candidate-timeline.tsx
└─ change-status-dialog.tsx
Intake components
components/intake/
├─ upload-dropzone.tsx
├─ batch-import-card.tsx
├─ review-queue-table.tsx
├─ review-badge.tsx
└─ unresolved-alert.tsx
Conversation components
components/conversations/
├─ conversation-table.tsx
├─ conversation-detail.tsx
├─ conversation-summary-card.tsx
├─ extraction-list.tsx
└─ matching-panel.tsx
Document components
components/documents/
├─ document-table.tsx
├─ document-review-panel.tsx
├─ document-preview.tsx
├─ document-metadata-form.tsx
└─ document-version-list.tsx
Legal/handover/issues/reports components
Keep those separated the same way.

8. Frontend state strategy
Use a clean split.
Server state
Use TanStack Query for:
candidates
conversations
documents
imports
legal reviews
reports
Local UI state
Use:
React local state
forms
dialogs
drawers
filters
Do not overuse global state.
Only use a small client store if needed for:
auth session
persistent UI filters
theme/layout state

9. API client structure
Recommended structure:
lib/api/
├─ client.ts
├─ auth.ts
├─ candidates.ts
├─ conversations.ts
├─ documents.ts
├─ extractions.ts
├─ matches.ts
├─ legal-reviews.ts
├─ handovers.ts
├─ spreadsheet-imports.ts
├─ reports.ts
└─ users.ts
Each file should expose clear functions like:
getCandidates
getCandidateById
createCandidate
changeCandidateStatus
Keep them thin and explicit.

10. UX rules for this app
These rules matter a lot.
Rule 1
Always show the current status clearly.
Rule 2
Always show blockers clearly.
Rule 3
Never hide missing documents.
Rule 4
Never make the user open three screens to confirm one thing.
Rule 5
Put next actions near the data.
Rule 6
Use badges and counts aggressively, but not decorative nonsense.
Rule 7
The timeline must always tell the story.
That’s the UX philosophy.

11. Candidate profile UX pattern
This page deserves a stronger definition.
The candidate profile should answer these questions instantly:
Who is this person?
What stage are they in?
What is missing?
What happened recently?
What do I do next?
Is legal blocked?
Is coordinator waiting?
Are there open issues?
If the page fails at that, it fails at its job.
So I’d structure the top of the page like this:
Top summary row
candidate identity
status badge
source badge
completeness indicator
blocker badges
Main body
documents
conversations
legal
operations
issues
Right rail
tasks
next action
recent activity
quick action buttons
This layout is super strong for real ops.

12. Review queue UX pattern
The review queue should be designed like triage.
Priority groups
high: identity mismatch, unreadable key doc, unresolved candidate link
medium: low-confidence extraction, duplicate risk
low: metadata cleanup, optional enrichment
Row design
Each item should show:
what it is
why it needs review
who it affects
how urgent it is
what action is expected
Do not make the user read a paragraph to understand the problem.

13. Upload UX pattern
Uploads should feel simple.
For conversations
drag .txt
show parsed filename
show upload result
show processing state
show next: “Needs review” or “Linked automatically”
For documents
drag files
show file preview names
show candidate hint if detected
show processing state
show review queue result
This is where the app starts feeling magical.

14. Suggested design style
For this app, I’d go with:
clean white or very light gray background
strong contrast text
compact but breathable spacing
rounded cards, not overly soft
serious operational styling
status colors used carefully
clear tables with sticky headers
fast filtering experience
This should look premium, but also like a tool people trust with sensitive operations.
Think:
modern operations dashboard
not
social app
not
flashy startup landing page

15. Frontend MVP build order
This is the smartest order.
Sprint 1
app shell
login page
dashboard page skeleton
candidate list page
candidate detail page basic layout
Sprint 2
status change dialog
candidate timeline
task card
issue card
quick action buttons
Sprint 3
conversation upload page
conversation list
conversation detail drawer/page
extraction review panel
matching review panel
Sprint 4
document upload page
document list
document review page
document preview panel
Sprint 5
legal queue
legal detail page
coordinator queue
coordinator detail page
Sprint 6
spreadsheet import page
review queue page
reports pages
settings pages
That order maps perfectly to the backend plan.

16. Suggested feature folder structure
If you want the frontend to stay sane, organize it by feature.
Example:
features/candidates/
├─ api/
├─ components/
├─ hooks/
├─ schemas/
├─ types/
└─ utils/
Same idea for:
conversations
documents
legal
handover
spreadsheet imports
This scales better than one giant components dump.

17. Reusable UI primitives you should build early
Build these early and reuse them everywhere:
status badge
review badge
confidence badge
candidate header card
info row
empty state
file preview tile
import status card
timeline item
filter bar
data table wrapper
confirmation dialog
right-side drawer
upload dropzone
These will speed up the whole app.

18. Suggested dashboard widgets for v1
Keep it practical.
Top row
New Leads
Waiting Docs
Ready for Legal
Legal More Info Required
Handover Pending
Open Issues
Secondary row
My Open Tasks
Recent Conversation Imports
Recent Document Imports
Unresolved Review Items
Bottom
Candidate status distribution
Legal queue table
Upcoming travel/accommodation items later
That’s enough for v1.

19. Frontend mistakes to avoid
Very important.
Avoid:
giant modals for everything
putting all candidate data in one endless form
hiding key state inside nested tabs
making review actions too many clicks
mixing resolved and unresolved items without filters
using too many charts too early
designing for beauty over speed
The app should feel like:
clear, fast, decisive

20. Full blueprint status so far
At this point we already have:
product vision
strategic scope
backend stack
Prisma schema draft
NestJS backend blueprint
queue architecture
frontend architecture
screen map
UX logic
implementation order
So now we’re at the point where the next smartest move is no longer abstract planning.
Now we should turn this into an actual execution package.

21. Best next step
The smartest next move is:
full monorepo scaffolding blueprint
Meaning I prepare:
exact repo structure
package names
env files
Docker services
local dev commands
first setup sequence
what to code first file by file
That will take you from architecture to real implementation.
Or, even stronger:
Antigravity / VS Code superprompt
A complete build prompt that instructs the AI to generate:
monorepo
Prisma schema
NestJS modules
Next.js app shell
Docker setup
MinIO integration
BullMQ setup
first MVP screens and endpoints
That is probably the highest-leverage next move for you.
Provide the prompt first, then, full motores scaffolding blueprint
Absolutely. Below is the superprompt first, then the full monorepo scaffolding blueprint.

ORI-CRUIT-HUB 1.0 — Antigravity / VS Code Superprompt
Use this prompt to generate the project from zero in a serious, production-oriented way.
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
