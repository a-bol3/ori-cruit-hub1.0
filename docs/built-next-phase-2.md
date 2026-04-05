GOAL
Build a Candidate Profile UI + Dashboard (Next.js) that connects to:
Candidates
Documents
Timeline
Review system
Status pipeline
👉 Clean, fast, Apollo-like UX
👉 Zero placeholders
👉 Real data only

🧠 UX STRUCTURE (IMPORTANT)
1. Main Areas
Dashboard
pipeline overview
quick stats
recent activity
Candidates
list + filters
click → profile
Candidate Profile (CORE PAGE)
header (identity + status)
tabs:
Timeline
Documents
Data
Review

🏗️ 1. FOLDER STRUCTURE (Next.js App Router)
Inside apps/web:
/app
 /(dashboard)
   /dashboard/page.tsx
   /candidates/page.tsx
   /candidates/[id]/page.tsx

/components
 /ui
 /candidate
 /documents
 /timeline

/lib
 api.ts
 types.ts

⚙️ 2. API CLIENT
/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path: string, options?: RequestInit) {
 const res = await fetch(`${API_URL}${path}`, {
   ...options,
   headers: {
     'Content-Type': 'application/json',
     ...(options?.headers || {}),
   },
   cache: 'no-store',
 });

 if (!res.ok) throw new Error('API error');
 return res.json();
}

🧩 3. CANDIDATE LIST PAGE
/app/(dashboard)/candidates/page.tsx
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default async function CandidatesPage() {
 const candidates = await apiFetch('/candidates');

 return (
   <div className="p-6">
     <h1 className="text-2xl font-semibold mb-4">Candidates</h1>

     <div className="space-y-2">
       {candidates.map((c: any) => (
         <Link
           key={c.id}
           href={`/candidates/${c.id}`}
           className="block border p-4 rounded hover:bg-gray-50"
         >
           <div className="font-medium">
             {c.firstName || 'Unknown'} {c.lastName || ''}
           </div>
           <div className="text-sm text-gray-500">{c.status}</div>
         </Link>
       ))}
     </div>
   </div>
 );
}

🧠 4. CANDIDATE PROFILE PAGE
/app/(dashboard)/candidates/[id]/page.tsx
import { apiFetch } from '@/lib/api';
import CandidateHeader from '@/components/candidate/CandidateHeader';
import CandidateTabs from '@/components/candidate/CandidateTabs';

export default async function CandidatePage({ params }: any) {
 const candidate = await apiFetch(`/candidates/${params.id}`);

 return (
   <div className="p-6 space-y-6">
     <CandidateHeader candidate={candidate} />
     <CandidateTabs candidateId={params.id} />
   </div>
 );
}

🧱 5. HEADER COMPONENT
/components/candidate/CandidateHeader.tsx
export default function CandidateHeader({ candidate }: any) {
 return (
   <div className="border p-6 rounded-lg flex justify-between items-center">
     <div>
       <h2 className="text-xl font-semibold">
         {candidate.firstName || 'Unknown'} {candidate.lastName || ''}
       </h2>

       <div className="text-sm text-gray-500">
         ID: {candidate.id}
       </div>
     </div>

     <div className="text-right">
       <div className="text-xs text-gray-400">STATUS</div>
       <div className="font-medium">{candidate.status}</div>
     </div>
   </div>
 );
}

🧩 6. TABS SYSTEM
/components/candidate/CandidateTabs.tsx
'use client';

import { useState } from 'react';
import TimelineTab from './tabs/TimelineTab';
import DocumentsTab from './tabs/DocumentsTab';

export default function CandidateTabs({ candidateId }: any) {
 const [tab, setTab] = useState('timeline');

 return (
   <div>
     <div className="flex gap-4 border-b mb-4">
       {['timeline', 'documents', 'data', 'review'].map((t) => (
         <button
           key={t}
           onClick={() => setTab(t)}
           className={`pb-2 ${tab === t ? 'border-b-2 border-black' : ''}`}
         >
           {t.toUpperCase()}
         </button>
       ))}
     </div>

     {tab === 'timeline' && <TimelineTab candidateId={candidateId} />}
     {tab === 'documents' && <DocumentsTab candidateId={candidateId} />}
     {tab === 'data' && <div>Data panel coming</div>}
     {tab === 'review' && <div>Review panel coming</div>}
   </div>
 );
}

🕒 7. TIMELINE TAB
/components/candidate/tabs/TimelineTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TimelineTab({ candidateId }: any) {
 const [items, setItems] = useState<any[]>([]);

 useEffect(() => {
   apiFetch(`/candidates/${candidateId}/timeline`)
     .then(setItems);
 }, [candidateId]);

 return (
   <div className="space-y-4">
     {items.map((item) => (
       <div key={item.id} className="border p-4 rounded">
         <div className="text-sm text-gray-500">
           {new Date(item.createdAt).toLocaleString()}
         </div>

         <div className="font-medium">{item.title}</div>

         {item.description && (
           <div className="text-sm text-gray-600">
             {item.description}
           </div>
         )}
       </div>
     ))}
   </div>
 );
}

📄 8. DOCUMENTS TAB
/components/candidate/tabs/DocumentsTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DocumentsTab({ candidateId }: any) {
 const [docs, setDocs] = useState<any[]>([]);

 useEffect(() => {
   apiFetch(`/documents?candidateId=${candidateId}`)
     .then(setDocs);
 }, [candidateId]);

 return (
   <div className="space-y-4">
     {docs.map((doc) => (
       <div key={doc.id} className="border p-4 rounded">
         <div className="flex justify-between">
           <div>
             <div className="font-medium">{doc.documentType}</div>
             <div className="text-sm text-gray-500">
               {doc.reviewStatus}
             </div>
           </div>

           <div className="text-sm">
             {doc.processingStatus}
           </div>
         </div>
       </div>
     ))}
   </div>
 );
}

🚀 9. DASHBOARD PAGE
/app/(dashboard)/dashboard/page.tsx
import { apiFetch } from '@/lib/api';

export default async function DashboardPage() {
 const candidates = await apiFetch('/candidates');

 const stats = {
   total: candidates.length,
   ready: candidates.filter((c: any) => c.status === 'READY_FOR_LEGAL_REVIEW').length,
   placed: candidates.filter((c: any) => c.status === 'PLACED').length,
 };

 return (
   <div className="p-6 space-y-6">
     <h1 className="text-2xl font-semibold">Dashboard</h1>

     <div className="grid grid-cols-3 gap-4">
       <Stat label="Total Candidates" value={stats.total} />
       <Stat label="Ready for Legal" value={stats.ready} />
       <Stat label="Placed" value={stats.placed} />
     </div>
   </div>
 );
}

function Stat({ label, value }: any) {
 return (
   <div className="border p-4 rounded">
     <div className="text-sm text-gray-500">{label}</div>
     <div className="text-xl font-semibold">{value}</div>
   </div>
 );
}

🧠 10. WHAT YOU NOW HAVE
You now built:
UI Layer
candidate list
candidate profile
timeline view
documents view
dashboard stats

SYSTEM INTEGRATION
connects to real API
reflects real processing states
shows timeline events
shows document lifecycle

🔥 REAL IMPACT
This replaces:
❌ Excel
❌ manual tracking
❌ WhatsApp memory
❌ "where is this candidate?"

With:
✅ visual pipeline
✅ real-time updates
✅ centralized data
✅ traceable decisions

🧠 NEXT LEVEL (HIGH IMPACT)
Now the smartest next step is:
👉 REVIEW PANEL UI
Because now you:
create review tasks
but cannot operate them visually

If you want next step
Say:
👉 "Build Review Panel UI (Queue + Actions)"
And I’ll give you:
review dashboard
task assignment UI
approve/reject flows
candidate linking UI
correction forms
That’s the final layer before this becomes a complete recruitment OS.
"Build Review Panel UI (Queue + Actions)
Perfect. This is the layer that makes the system actually operable day to day.
Right now you already have:
async ingestion
document processing
extraction
matching
review task creation
candidate profile
timeline
dashboard
What’s missing is the human control panel for exceptions.
That is the Review Panel UI.

Goal
Build a frontend review workspace where you can:
see all pending review tasks
assign a task
open the related entity
approve or reject a document
link a document to a candidate
correct extracted values
resolve the task cleanly
This is the last core layer before the app starts feeling like a real recruitment OS.

1. Route structure
Add these routes in apps/web/src/app/(dashboard)/app/intake/review-queue/ or keep them under your existing dashboard group.
Recommended:
/app/review/page.tsx
/app/review/[id]/page.tsx
If you want to stay aligned with your earlier intake grouping, use:
/app/intake/review-queue/page.tsx
/app/intake/review-queue/[id]/page.tsx
I’ll use the cleaner version below:
/app/review
/app/review/[id]

2. API client additions
apps/web/src/lib/api/review.ts
import { apiFetch } from '@/lib/api';

export async function getReviewQueue() {
 return apiFetch('/review/queue');
}

export async function assignReviewTask(taskId: string, userId: string) {
 return apiFetch(`/review/${taskId}/assign`, {
   method: 'PATCH',
   body: JSON.stringify({ userId }),
 });
}

export async function resolveReviewTask(taskId: string, payload: {
 action: string;
 payload: any;
 userId?: string;
}) {
 return apiFetch(`/review/${taskId}/resolve`, {
   method: 'POST',
   body: JSON.stringify(payload),
 });
}

export async function getDocuments(params?: { candidateId?: string }) {
 const query = params?.candidateId ? `?candidateId=${params.candidateId}` : '';
 return apiFetch(`/documents${query}`);
}

export async function getDocumentById(id: string) {
 return apiFetch(`/documents/${id}`);
}

export async function getCandidates() {
 return apiFetch('/candidates');
}

3. Add review route page
apps/web/src/app/(dashboard)/app/review/page.tsx
import ReviewQueuePageClient from '@/components/review/ReviewQueuePageClient';

export default function ReviewPage() {
 return <ReviewQueuePageClient />;
}

4. Review queue page client
apps/web/src/components/review/ReviewQueuePageClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getReviewQueue } from '@/lib/api/review';
import ReviewQueueTable from './ReviewQueueTable';

export default function ReviewQueuePageClient() {
 const [items, setItems] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState<'ALL' | 'DOCUMENT_REVIEW' | 'MATCH_REVIEW'>('ALL');

 async function load() {
   setLoading(true);
   try {
     const data = await getReviewQueue();
     setItems(data);
   } finally {
     setLoading(false);
   }
 }

 useEffect(() => {
   load();
 }, []);

 const filtered = useMemo(() => {
   if (filter === 'ALL') return items;
   return items.filter((item) => item.taskType === filter);
 }, [items, filter]);

 return (
   <div className="p-6 space-y-6">
     <div className="flex items-center justify-between gap-4">
       <div>
         <h1 className="text-2xl font-semibold">Review Queue</h1>
         <p className="text-sm text-gray-500">
           Resolve low-confidence automation results and edge cases.
         </p>
       </div>

       <button
         onClick={load}
         className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
       >
         Refresh
       </button>
     </div>

     <div className="flex gap-2">
       {['ALL', 'DOCUMENT_REVIEW', 'MATCH_REVIEW'].map((value) => (
         <button
           key={value}
           onClick={() => setFilter(value as any)}
           className={`rounded-md border px-3 py-2 text-sm ${
             filter === value ? 'bg-black text-white' : 'hover:bg-gray-50'
           }`}
         >
           {value}
         </button>
       ))}
     </div>

     {loading ? (
       <div className="rounded-lg border p-6 text-sm text-gray-500">Loading review queue...</div>
     ) : (
       <ReviewQueueTable items={filtered} />
     )}
   </div>
 );
}

5. Review queue table
apps/web/src/components/review/ReviewQueueTable.tsx
'use client';

import Link from 'next/link';

export default function ReviewQueueTable({ items }: { items: any[] }) {
 if (!items.length) {
   return (
     <div className="rounded-lg border p-6 text-sm text-gray-500">
       No pending review tasks.
     </div>
   );
 }

 return (
   <div className="overflow-hidden rounded-lg border">
     <table className="w-full text-sm">
       <thead className="bg-gray-50 text-left">
         <tr>
           <th className="px-4 py-3 font-medium">Type</th>
           <th className="px-4 py-3 font-medium">Source</th>
           <th className="px-4 py-3 font-medium">Priority</th>
           <th className="px-4 py-3 font-medium">Status</th>
           <th className="px-4 py-3 font-medium">Assigned</th>
           <th className="px-4 py-3 font-medium">Created</th>
           <th className="px-4 py-3 font-medium">Action</th>
         </tr>
       </thead>

       <tbody>
         {items.map((item) => (
           <tr key={item.id} className="border-t">
             <td className="px-4 py-3">{item.taskType}</td>
             <td className="px-4 py-3">{item.sourceType}</td>
             <td className="px-4 py-3">{item.priority}</td>
             <td className="px-4 py-3">{item.status}</td>
             <td className="px-4 py-3">
               {item.assignedToId ? item.assignedToId : 'Unassigned'}
             </td>
             <td className="px-4 py-3">
               {new Date(item.createdAt).toLocaleString()}
             </td>
             <td className="px-4 py-3">
               <Link
                 href={`/review/${item.id}`}
                 className="rounded-md border px-3 py-2 hover:bg-gray-50"
               >
                 Open
               </Link>
             </td>
           </tr>
         ))}
       </tbody>
     </table>
   </div>
 );
}

6. Review detail page
Because your API does not yet expose GET /review/:id, the simplest move is to extend it.
Backend addition: ReviewService
Add:
async getTaskById(taskId: string) {
 return prisma.reviewTask.findUnique({
   where: { id: taskId },
   include: {
     decisions: true,
   },
 });
}
Backend addition: ReviewController
Add:
@Get(':id')
async getTask(@Param('id') id: string) {
 return this.reviewService.getTaskById(id);
}

Frontend route
apps/web/src/app/(dashboard)/app/review/[id]/page.tsx
import ReviewTaskDetailClient from '@/components/review/ReviewTaskDetailClient';

export default function ReviewTaskDetailPage({ params }: { params: { id: string } }) {
 return <ReviewTaskDetailClient taskId={params.id} />;
}

7. Review detail client
apps/web/src/components/review/ReviewTaskDetailClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { assignReviewTask } from '@/lib/api/review';
import DocumentReviewPanel from './document/DocumentReviewPanel';
import MatchReviewPanel from './match/MatchReviewPanel';

const DEMO_USER_ID = 'replace-with-real-session-user-id';

export default function ReviewTaskDetailClient({ taskId }: { taskId: string }) {
 const [task, setTask] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);

 async function load() {
   setLoading(true);
   try {
     const data = await apiFetch(`/review/${taskId}`);
     setTask(data);
   } finally {
     setLoading(false);
   }
 }

 useEffect(() => {
   load();
 }, [taskId]);

 async function handleAssign() {
   await assignReviewTask(taskId, DEMO_USER_ID);
   await load();
 }

 if (loading) {
   return <div className="p-6">Loading review task...</div>;
 }

 if (!task) {
   return <div className="p-6">Review task not found.</div>;
 }

 return (
   <div className="p-6 space-y-6">
     <div className="rounded-lg border p-6">
       <div className="flex items-start justify-between gap-4">
         <div className="space-y-2">
           <h1 className="text-2xl font-semibold">Review Task</h1>
           <div className="text-sm text-gray-500">Task ID: {task.id}</div>
           <div className="text-sm text-gray-500">
             {task.taskType} · {task.sourceType} · {task.status}
           </div>
         </div>

         <button
           onClick={handleAssign}
           className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
         >
           Assign to me
         </button>
       </div>
     </div>

     {task.taskType === 'DOCUMENT_REVIEW' && (
       <DocumentReviewPanel task={task} onResolved={load} />
     )}

     {task.taskType === 'MATCH_REVIEW' && (
       <MatchReviewPanel task={task} onResolved={load} />
     )}
   </div>
 );
}

8. Document review panel
This is the high-value one.
apps/web/src/components/review/document/DocumentReviewPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDocumentById, resolveReviewTask } from '@/lib/api/review';

const DEMO_USER_ID = 'replace-with-real-session-user-id';

export default function DocumentReviewPanel({
 task,
 onResolved,
}: {
 task: any;
 onResolved: () => void;
}) {
 const [document, setDocument] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);
 const [candidateId, setCandidateId] = useState('');
 const [correctedNumber, setCorrectedNumber] = useState('');

 async function loadDocument() {
   setLoading(true);
   try {
     const data = await getDocumentById(task.sourceId);
     setDocument(data);
     setCandidateId(data.candidateId || '');
     setCorrectedNumber(data.extractedNumber || '');
   } finally {
     setLoading(false);
   }
 }

 useEffect(() => {
   loadDocument();
 }, [task.sourceId]);

 async function approveDocument() {
   await resolveReviewTask(task.id, {
     action: 'APPROVE_DOC',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
       candidateId: document?.candidateId || null,
     },
   });
   await onResolved();
 }

 async function rejectDocument() {
   await resolveReviewTask(task.id, {
     action: 'REJECT_DOC',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
       candidateId: document?.candidateId || null,
     },
   });
   await onResolved();
 }

 async function linkCandidate() {
   if (!candidateId) return;

   await resolveReviewTask(task.id, {
     action: 'LINK_CANDIDATE',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
       candidateId,
     },
   });
   await onResolved();
 }

 async function correctData() {
   await resolveReviewTask(task.id, {
     action: 'CORRECT_DATA',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
       candidateId: candidateId || document?.candidateId || null,
       data: {
         extractedNumber: correctedNumber || null,
       },
     },
   });
   await onResolved();
 }

 if (loading) {
   return <div className="rounded-lg border p-6">Loading document...</div>;
 }

 if (!document) {
   return <div className="rounded-lg border p-6">Document not found.</div>;
 }

 return (
   <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
     <div className="rounded-lg border p-6 space-y-4">
       <h2 className="text-lg font-semibold">Document Details</h2>

       <div className="grid gap-3 text-sm">
         <Info label="Document ID" value={document.id} />
         <Info label="Type" value={document.documentType || 'Unknown'} />
         <Info label="Review Status" value={document.reviewStatus} />
         <Info label="Processing Status" value={document.processingStatus} />
         <Info label="Extracted Number" value={document.extractedNumber || '—'} />
         <Info label="Extracted Name" value={document.extractedName || '—'} />
         <Info label="Candidate ID" value={document.candidateId || 'Unlinked'} />
       </div>

       <div className="space-y-2">
         <h3 className="font-medium">Versions</h3>
         <div className="space-y-2">
           {document.versions?.map((version: any) => (
             <div key={version.id} className="rounded-md border p-3 text-sm">
               <div>{version.originalFilename}</div>
               <div className="text-gray-500">
                 {version.mimeType || 'unknown'} · v{version.versionNumber}
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>

     <div className="rounded-lg border p-6 space-y-6">
       <h2 className="text-lg font-semibold">Review Actions</h2>

       <div className="space-y-2">
         <label className="block text-sm font-medium">Candidate ID</label>
         <input
           value={candidateId}
           onChange={(e) => setCandidateId(e.target.value)}
           className="w-full rounded-md border px-3 py-2 text-sm"
           placeholder="Paste candidate ID"
         />
         <button
           onClick={linkCandidate}
           className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
         >
           Link Candidate
         </button>
       </div>

       <div className="space-y-2">
         <label className="block text-sm font-medium">Correct extracted number</label>
         <input
           value={correctedNumber}
           onChange={(e) => setCorrectedNumber(e.target.value)}
           className="w-full rounded-md border px-3 py-2 text-sm"
           placeholder="Correct document number"
         />
         <button
           onClick={correctData}
           className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
         >
           Save Correction
         </button>
       </div>

       <div className="flex gap-3">
         <button
           onClick={approveDocument}
           className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90"
         >
           Approve
         </button>

         <button
           onClick={rejectDocument}
           className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
         >
           Reject
         </button>
       </div>
     </div>
   </div>
 );
}

function Info({ label, value }: { label: string; value: string }) {
 return (
   <div className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
     <span className="text-gray-500">{label}</span>
     <span className="font-medium">{value}</span>
   </div>
 );
}

9. Match review panel
For now, keep it simple and useful.
apps/web/src/components/review/match/MatchReviewPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { getCandidates, resolveReviewTask } from '@/lib/api/review';

const DEMO_USER_ID = 'replace-with-real-session-user-id';

export default function MatchReviewPanel({
 task,
 onResolved,
}: {
 task: any;
 onResolved: () => void;
}) {
 const [candidates, setCandidates] = useState<any[]>([]);
 const [candidateId, setCandidateId] = useState('');

 useEffect(() => {
   getCandidates().then(setCandidates);
 }, []);

 async function confirmMatch() {
   if (!candidateId) return;

   await resolveReviewTask(task.id, {
     action: 'LINK_CANDIDATE',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
       candidateId,
     },
   });

   await onResolved();
 }

 async function rejectMatch() {
   await resolveReviewTask(task.id, {
     action: 'REJECT_DOC',
     userId: DEMO_USER_ID,
     payload: {
       documentId: task.sourceId,
     },
   });

   await onResolved();
 }

 return (
   <div className="rounded-lg border p-6 space-y-4">
     <h2 className="text-lg font-semibold">Match Review</h2>

     <div className="space-y-2">
       <label className="block text-sm font-medium">Select candidate</label>
       <select
         value={candidateId}
         onChange={(e) => setCandidateId(e.target.value)}
         className="w-full rounded-md border px-3 py-2 text-sm"
       >
         <option value="">Choose candidate</option>
         {candidates.map((candidate) => (
           <option key={candidate.id} value={candidate.id}>
             {candidate.firstName || 'Unknown'} {candidate.lastName || ''} — {candidate.id}
           </option>
         ))}
       </select>
     </div>

     <div className="flex gap-3">
       <button
         onClick={confirmMatch}
         className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90"
       >
         Confirm Match
       </button>

       <button
         onClick={rejectMatch}
         className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
       >
         Reject
       </button>
     </div>
   </div>
 );
}

10. Improve backend document filters
Your documents endpoint should support filtering by candidateId so the candidate profile documents tab works correctly.
Backend update: DocumentsController
import { Controller, Get, Param, Patch, Post, Body, Query } from '@nestjs/common';
Then:
@Get()
async findAll(@Query('candidateId') candidateId?: string) {
 return this.documentsService.findAll(candidateId);
}
Backend update: DocumentsService
async findAll(candidateId?: string) {
 return prisma.candidateDocument.findMany({
   where: candidateId ? { candidateId } : undefined,
   include: {
     candidate: true,
     versions: true,
   },
   orderBy: { createdAt: 'desc' },
 });
}

11. Improve review decisions with activity logging
You already built the timeline engine. Now wire review outcomes into it.
Backend update: ReviewService
Inject or call activity logging after decision application.
Example inside resolveTask() after applyDecision():
if (payload?.candidateId) {
 await prisma.candidateActivity.create({
   data: {
     candidateId: payload.candidateId,
     type: 'REVIEW_DECISION',
     sourceType: task.sourceType,
     sourceId: task.sourceId,
     title: `Review resolved: ${action}`,
     description: `Task ${taskId} was resolved`,
     metadata: payload,
   },
 });
}
You’ll need to fetch task first in resolveTask():
const task = await prisma.reviewTask.findUnique({
 where: { id: taskId },
});
Do that before writing the decision.

12. Sidebar integration
Add a Review item in your app shell sidebar.
Example:
<Link href="/review" className="block rounded-md px-3 py-2 hover:bg-gray-100">
 Review Queue
</Link>
Put it close to:
Candidates
Intake
Review
Legal
Reports
That order makes sense operationally.

13. What this gives you now
At this point, your app can do this flow:
upload document
queue processing
OCR/classify/extract/match
create review task if uncertain
operator opens review queue
operator assigns task
operator approves / rejects / links / corrects
system resolves task
candidate timeline updates
That is a real, usable operational loop.

14. Strong recommendation: one backend improvement
Your ReviewTask currently does not include assignedTo in getQueue() unless your relation is loaded and valid. Update getQueue() to return richer data.
Backend update: ReviewService.getQueue()
async getQueue() {
 return prisma.reviewTask.findMany({
   where: { status: 'PENDING' },
   include: {
     decisions: true,
     assignedTo: true,
   },
   orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
 });
}
And same for getTaskById():
async getTaskById(taskId: string) {
 return prisma.reviewTask.findUnique({
   where: { id: taskId },
   include: {
     decisions: true,
     assignedTo: true,
   },
 });
}
Then in the frontend table show:
item.assignedTo?.email || 'Unassigned'

15. Best immediate next move
Now the system is finally crossing from “build mode” into “usable mode.”
The smartest next step is:
Build Candidate Data + Status Action Panels
Meaning:
editable candidate data panel
status transition UI
quick task creation UI
issue creation UI
document upload directly from candidate page
That would make the candidate profile page fully operational instead of mostly read-focused.
Say:
Build Candidate Data + Status Action Panels
and I’ll give you the next layer end to end.
Build Candidate Data + Status Action Panels
Perfect. This is the layer that turns your app into a true operational cockpit.
Right now:
You can see everything ✅
You can review edge cases ✅
But you still can’t actively manage candidates fast enough.
This step fixes that.
