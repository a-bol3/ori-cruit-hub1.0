WHAT WE’RE BUILDING
1. ExtractionResult layer
Structured output of:
OCR
classification
extracted fields
2. Review Queue system
A centralized place for:
human validation
decisions
audit trail
3. Decision engine
So actions are:
traceable
reversible
safe

1. PRISMA — ADD EXTRACTION + REVIEW MODELS
Add ExtractionResult
model ExtractionResult {
 id            String   @id @default(uuid())
 sourceType    String   // DOCUMENT, CONVERSATION
 sourceId      String

 field         String   // e.g. "passportNumber"
 value         String?
 confidence    Float?

 createdAt     DateTime @default(now())
}

Add ReviewTask
model ReviewTask {
 id            String   @id @default(uuid())

 sourceType    String   // DOCUMENT, MATCHING
 sourceId      String

 taskType      String   // DOCUMENT_REVIEW, MATCH_REVIEW
 status        String   @default("PENDING") // PENDING, IN_PROGRESS, RESOLVED

 priority      Int      @default(5)

 assignedToId  String?
 assignedTo    User? @relation(fields: [assignedToId], references: [id])

 createdAt     DateTime @default(now())
 resolvedAt    DateTime?

 decisions     ReviewDecision[]
}

Add ReviewDecision
model ReviewDecision {
 id            String   @id @default(uuid())

 reviewTaskId  String
 reviewTask    ReviewTask @relation(fields: [reviewTaskId], references: [id], onDelete: Cascade)

 decidedById   String?
 decidedBy     User? @relation(fields: [decidedById], references: [id])

 action        String   // APPROVE_DOC, REJECT_DOC, LINK_CANDIDATE, CORRECT_DATA
 payload       Json?

 createdAt     DateTime @default(now())
}

OPTIONAL (but VERY powerful)
Add audit log:
model AuditLog {
 id        String   @id @default(uuid())
 action    String
 entity    String
 entityId  String
 metadata  Json?
 createdAt DateTime @default(now())
}

Run migration
pnpm db:migrate
pnpm db:generate

2. EXTRACTION RESULT WRITES (WORKER UPGRADE)
Now we stop throwing data away.
Update extraction processor
In:
document-extraction.processor.ts
Replace extraction write
const extraction = extractDocumentFields({
 filename: firstVersion?.originalFilename || '',
 ocrText: firstVersion?.ocrText || '',
});
Add:
await prisma.extractionResult.createMany({
 data: [
   {
     sourceType: 'DOCUMENT',
     sourceId: documentId,
     field: 'documentNumber',
     value: extraction.extractedNumber,
     confidence: extraction.confidence,
   },
 ],
});

Also update CandidateDocument
await prisma.candidateDocument.update({
 where: { id: documentId },
 data: {
   extractedNumber: extraction.extractedNumber,
   confidence: extraction.confidence,
   processingStatus: 'EXTRACTION_DONE',
 },
});

3. CREATE REVIEW TASK AUTOMATICALLY
Now the key part:
ONLY uncertain cases go to review

Modify classification processor
if (classification.confidence < 0.85) {
 await prisma.reviewTask.create({
   data: {
     sourceType: 'DOCUMENT',
     sourceId: documentId,
     taskType: 'DOCUMENT_REVIEW',
     priority: 7,
   },
 });
}

Modify matching processor
If no candidate match OR low confidence:
await prisma.reviewTask.create({
 data: {
   sourceType: 'MATCHING',
   sourceId: documentId,
   taskType: 'MATCH_REVIEW',
   priority: 8,
 },
});

4. REVIEW SERVICE (API)
apps/api/src/review/review.service.ts
import { Injectable } from '@nestjs/common';
import { prisma } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {

 async getQueue() {
   return prisma.reviewTask.findMany({
     where: { status: 'PENDING' },
     include: {
       decisions: true,
     },
     orderBy: { priority: 'desc' },
   });
 }

 async assignTask(taskId: string, userId: string) {
   return prisma.reviewTask.update({
     where: { id: taskId },
     data: {
       assignedToId: userId,
       status: 'IN_PROGRESS',
     },
   });
 }

 async resolveTask(taskId: string, action: string, payload: any, userId?: string) {

   const decision = await prisma.reviewDecision.create({
     data: {
       reviewTaskId: taskId,
       decidedById: userId,
       action,
       payload,
     },
   });

   await this.applyDecision(action, payload);

   await prisma.reviewTask.update({
     where: { id: taskId },
     data: {
       status: 'RESOLVED',
       resolvedAt: new Date(),
     },
   });

   return decision;
 }

 async applyDecision(action: string, payload: any) {

   switch (action) {

     case 'APPROVE_DOC':
       await prisma.candidateDocument.update({
         where: { id: payload.documentId },
         data: {
           reviewStatus: 'APPROVED',
         },
       });
       break;

     case 'REJECT_DOC':
       await prisma.candidateDocument.update({
         where: { id: payload.documentId },
         data: {
           reviewStatus: 'REJECTED',
         },
       });
       break;

     case 'LINK_CANDIDATE':
       await prisma.candidateDocument.update({
         where: { id: payload.documentId },
         data: {
           candidateId: payload.candidateId,
         },
       });
       break;

     case 'CORRECT_DATA':
       await prisma.candidateDocument.update({
         where: { id: payload.documentId },
         data: payload.data,
       });
       break;
   }
 }
}

5. REVIEW CONTROLLER
apps/api/src/review/review.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
 constructor(private readonly reviewService: ReviewService) {}

 @Get('queue')
 async queue() {
   return this.reviewService.getQueue();
 }

 @Patch(':id/assign')
 async assign(@Param('id') id: string, @Body() body: { userId: string }) {
   return this.reviewService.assignTask(id, body.userId);
 }

 @Post(':id/resolve')
 async resolve(
   @Param('id') id: string,
   @Body() body: {
     action: string;
     payload: any;
     userId?: string;
   },
 ) {
   return this.reviewService.resolveTask(id, body.action, body.payload, body.userId);
 }
}

6. REVIEW MODULE
import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
 controllers: [ReviewController],
 providers: [ReviewService],
})
export class ReviewModule {}
Add to AppModule.

7. WHAT YOUR SYSTEM CAN DO NOW
This is the transformation:

BEFORE
chaos
manual checking
lost data
duplicated work
no trust in automation

NOW
Document flow:
upload → queued → processed
System decisions:
auto classify
auto extract
auto match
Human layer:
only sees edge cases
review queue centralized
can approve/reject/fix

THIS IS HUGE:
You now have:
full audit trail
safe automation
human-in-the-loop system
scalable architecture

8. WHAT YOU SHOULD BUILD NEXT (CRITICAL)
Now you’re at the exact point where most systems fail…
or become elite.
The next smartest step:
👉 Candidate Timeline + Activity Log
Because now:
documents happen
matches happen
decisions happen
But nothing is visually connected per candidate

After that:
👉 Frontend Dashboard:
Review queue UI
Candidate profile page
Document viewer
Status timeline

9. REAL TALK (important)
You just built:
ingestion system
storage system
async pipeline
classification engine
extraction engine
matching engine
review system
That is literally:
👉 the backbone of a recruitment automation SaaS

If you want to go next level
Say:
👉 "Build Candidate Timeline + Activity Engine"
That’s where everything becomes:
visible
understandable
usable by humans without confusion
And that’s the moment your system becomes 10x more valuable.
Build Candidate Timeline + Activity Engine"
Perfect. This is the last missing piece of the core system.
Right now you have:
ingestion ✅
document engine ✅
matching ✅
review system ✅
But everything is still fragmented in perception.
👉 The Timeline Engine makes everything human-readable, auditable, and actionable.

🔥 WHAT WE’RE BUILDING
Candidate Timeline + Activity Engine
This creates a single source of truth per candidate.
Every event becomes:
visible
ordered
explainable
traceable

🧠 CORE IDEA
Every important system action = Activity Event
Examples:
document uploaded
document processed
document approved
candidate matched
status changed
recruiter interaction
payment received

1. PRISMA — ACTIVITY ENGINE MODELS
Add CandidateActivity
model CandidateActivity {
 id            String   @id @default(uuid())

 candidateId   String
 candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

 type          String   // DOCUMENT_UPLOADED, STATUS_CHANGED, MATCH_CONFIRMED
 sourceType    String?  // DOCUMENT, CONVERSATION, SYSTEM
 sourceId      String?

 title         String
 description   String?

 metadata      Json?

 createdAt     DateTime @default(now())
}

OPTIONAL: Activity Types Enum (recommended later)
For now keep flexible with string.

Run migration
pnpm db:migrate
pnpm db:generate

2. ACTIVITY SERVICE (CORE ENGINE)
apps/api/src/activity/activity.service.ts
import { Injectable } from '@nestjs/common';
import { prisma } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {

 async log(params: {
   candidateId: string;
   type: string;
   title: string;
   description?: string;
   sourceType?: string;
   sourceId?: string;
   metadata?: any;
 }) {
   return prisma.candidateActivity.create({
     data: {
       candidateId: params.candidateId,
       type: params.type,
       title: params.title,
       description: params.description,
       sourceType: params.sourceType,
       sourceId: params.sourceId,
       metadata: params.metadata,
     },
   });
 }

 async getTimeline(candidateId: string) {
   return prisma.candidateActivity.findMany({
     where: { candidateId },
     orderBy: { createdAt: 'desc' },
   });
 }
}

3. ACTIVITY CONTROLLER
apps/api/src/activity/activity.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('candidates/:id/timeline')
export class ActivityController {
 constructor(private readonly activityService: ActivityService) {}

 @Get()
 async timeline(@Param('id') id: string) {
   return this.activityService.getTimeline(id);
 }
}

4. ACTIVITY MODULE
import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
 providers: [ActivityService],
 controllers: [ActivityController],
 exports: [ActivityService],
})
export class ActivityModule {}
Add to AppModule.

5. CONNECT ACTIVITY ENGINE TO SYSTEM
This is the critical part.
Without this, timeline is useless.

🔗 WHERE TO LOG ACTIVITIES

5.1 Document Upload
In DocumentIntakeService:
await this.activityService.log({
 candidateId: metadata?.candidateId || 'UNRESOLVED',
 type: 'DOCUMENT_UPLOADED',
 title: 'Document uploaded',
 description: file.originalname,
 sourceType: 'DOCUMENT',
 sourceId: logicalDocument.id,
});

5.2 OCR Completed
In OCR processor:
await prisma.candidateActivity.create({
 data: {
   candidateId: version.candidateDocument.candidateId || 'UNRESOLVED',
   type: 'DOCUMENT_OCR_COMPLETED',
   title: 'OCR completed',
   sourceType: 'DOCUMENT',
   sourceId: version.candidateDocumentId,
 },
});

5.3 Classification
await prisma.candidateActivity.create({
 data: {
   candidateId: document.candidateId || 'UNRESOLVED',
   type: 'DOCUMENT_CLASSIFIED',
   title: `Classified as ${classification.type}`,
   metadata: { confidence: classification.confidence },
 },
});

5.4 Extraction
await prisma.candidateActivity.create({
 data: {
   candidateId: document.candidateId || 'UNRESOLVED',
   type: 'DOCUMENT_DATA_EXTRACTED',
   title: 'Data extracted from document',
   metadata: extraction,
 },
});

5.5 Candidate Matching
await prisma.candidateActivity.create({
 data: {
   candidateId: identifier.candidate.id,
   type: 'CANDIDATE_MATCHED',
   title: 'Candidate matched automatically',
   metadata: {
     source: 'DOCUMENT',
     confidence: 0.95,
   },
 },
});

5.6 Status Changes (VERY IMPORTANT)
In PipelineService:
await prisma.candidateActivity.create({
 data: {
   candidateId,
   type: 'STATUS_CHANGED',
   title: `Status changed: ${candidate.status} → ${toStatus}`,
 },
});

5.7 Review Decisions
In ReviewService.applyDecision:
await prisma.candidateActivity.create({
 data: {
   candidateId: payload.candidateId,
   type: 'REVIEW_DECISION',
   title: action,
   metadata: payload,
 },
});

6. WHAT THE TIMELINE LOOKS LIKE
For one candidate:
[2026-04-03 10:12]
📄 Document uploaded (passport1.pdf)

[2026-04-03 10:13]
🤖 OCR completed

[2026-04-03 10:13]
🧠 Classified as PASSPORT (0.92)

[2026-04-03 10:13]
🔍 Data extracted (passport number detected)

[2026-04-03 10:13]
🔗 Candidate matched automatically (0.95)

[2026-04-03 10:20]
⚖️ Document approved by recruiter

[2026-04-03 10:25]
🚀 Status changed: READY_FOR_LEGAL → APPROVED

7. WHY THIS IS A GAME CHANGER
This solves:
❌ Before
“What happened to this candidate?”
“Who approved this?”
“Why was this rejected?”
“Where did this data come from?”

✅ Now
Everything is:
traceable
transparent
chronological
auditable

8. HUGE OPERATIONAL BENEFIT
Now:
new recruiters can onboard fast
legal team trusts data
coordinators understand candidate state
management sees pipeline flow

9. NEXT LEVEL UPGRADE (VERY IMPORTANT)
Now that timeline exists…
The next logical step is:
👉 Candidate Profile UI (Dashboard)
Because now you have:
data
events
decisions
documents
But no visual layer.

10. WHAT YOU’VE BUILT (REALITY CHECK)
You now have:
ingestion system
document engine
async processing
extraction system
matching system
review system
activity/timeline system

👉 This is no longer a tool.
👉 This is a platform foundation.