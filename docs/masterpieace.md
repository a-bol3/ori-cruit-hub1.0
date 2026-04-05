This is where your platform becomes adaptable per company instead of rigid.

You’re now building the layer that turns ORI-CRUIT-HUB into:

👉 a configurable AI operating system (not a fixed tool)

🧠 GOAL

Each organization can define:

how their pipeline works
what documents are required
how AI behaves
how follow-ups run
how assignments work
how automation behaves

👉 without touching code

🧱 1. SYSTEM OVERVIEW
WorkspaceSettings + Config Tables
        ↓
Config Service (resolver)
        ↓
Used by:
- AI Engine
- Workflow Engine
- API logic
- UI behavior
🧩 2. CORE MODULE
/src/modules/workspace-settings
🧱 3. DATABASE DESIGN

We split config into logical blocks.

🔹 1. WorkspaceSettings (global per org)
model WorkspaceSettings {
  id                    String   @id @default(cuid())
  organizationId        String   @unique
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  defaultLanguage       String?  @default("en")
  timezone              String?  @default("Europe/Warsaw")

  followUpDelayHours    Int      @default(24)
  maxFollowUps          Int      @default(3)

  aiAutofillThreshold   Float    @default(0.75)
  aiMatchThreshold      Float    @default(0.85)

  replyAutoSendEnabled  Boolean  @default(false)
  followUpAutoSend      Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
🔹 2. PipelineConfig (custom statuses)
model PipelineStage {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  order          Int
  type           String   // LEAD / ACTIVE / SUCCESS / FAILURE
  isFinal        Boolean  @default(false)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
🔹 3. DocumentRequirements
model DocumentRequirement {
  id             String   @id @default(cuid())
  organizationId String
  documentType   String
  required       Boolean  @default(true)
  country        String?
  offerType      String?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
🔹 4. AutomationRules
model AutomationRule {
  id             String   @id @default(cuid())
  organizationId String

  triggerType    String   // NO_RESPONSE / DOC_UPLOADED / STAGE_CHANGE
  condition      Json
  action         Json

  isActive       Boolean  @default(true)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
🔹 5. AssignmentRules
model AssignmentRule {
  id             String   @id @default(cuid())
  organizationId String

  type           String   // ROUND_ROBIN / BY_COUNTRY / BY_ROLE
  config         Json

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
🧠 4. CONFIG SERVICE (THE BRAIN)

Create:

/workspace-settings/services/config.service.ts
Purpose

👉 central place to resolve config
👉 avoid querying DB everywhere
👉 provide defaults

Example
@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaClient) {}

  async getWorkspaceSettings(orgId: string) {
    return this.prisma.workspaceSettings.findUnique({
      where: { organizationId: orgId },
    });
  }

  async getPipeline(orgId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { organizationId: orgId },
      orderBy: { order: 'asc' },
    });
  }

  async getDocumentRequirements(orgId: string) {
    return this.prisma.documentRequirement.findMany({
      where: { organizationId: orgId },
    });
  }

  async getAutomationRules(orgId: string) {
    return this.prisma.automationRule.findMany({
      where: { organizationId: orgId, isActive: true },
    });
  }
}

💥 Everything in your system should go through this service.

🧠 5. DEFAULT CONFIG CREATION (CRITICAL)

When a new org is created:

👉 auto-create baseline config

Example bootstrap
async createDefaultWorkspace(orgId: string) {
  await this.prisma.workspaceSettings.create({
    data: { organizationId: orgId },
  });

  await this.prisma.pipelineStage.createMany({
    data: [
      { organizationId: orgId, name: 'NEW', order: 1, type: 'LEAD' },
      { organizationId: orgId, name: 'CONTACTED', order: 2, type: 'ACTIVE' },
      { organizationId: orgId, name: 'DOCS_PENDING', order: 3, type: 'ACTIVE' },
      { organizationId: orgId, name: 'APPROVED', order: 4, type: 'SUCCESS' },
      { organizationId: orgId, name: 'REJECTED', order: 5, type: 'FAILURE', isFinal: true },
    ],
  });
}
🧠 6. USING CONFIG IN SYSTEM
🔹 AI ENGINE
const settings = await configService.getWorkspaceSettings(orgId);

if (confidence > settings.aiAutofillThreshold) {
  autoFill();
}
🔹 FOLLOW-UP ENGINE
if (settings.followUpAutoSend) {
  scheduleFollowUp(settings.followUpDelayHours);
}
🔹 DOCUMENT VALIDATION
const requiredDocs = await configService.getDocumentRequirements(orgId);

checkMissingDocs(candidate, requiredDocs);
🔹 PIPELINE ENGINE
const stages = await configService.getPipeline(orgId);
🔹 AUTOMATION ENGINE
const rules = await configService.getAutomationRules(orgId);

rules.forEach(rule => evaluate(rule));
🧠 7. CONFIGURABLE AI BEHAVIOR

Now your AI becomes tenant-aware.

Example

Org A:

aggressive follow-ups
auto-send enabled

Org B:

manual approvals
strict thresholds

AI adapts per org automatically.

🧠 8. FRONTEND (SETTINGS PANEL)

Create:

/settings/workspace
/settings/pipeline
/settings/documents
/settings/automation
UI sections
🔹 General
language
timezone
follow-up delay
🔹 Pipeline Editor
drag & drop stages
rename
reorder
🔹 Document Rules
toggle required docs
filter by country
🔹 Automation Rules
simple rule builder
triggers + actions
🔹 AI Settings
thresholds
auto-send toggles
🧠 9. PERFORMANCE OPTIMIZATION

Do NOT query config every time.

Add caching

Use Redis:

cacheKey = `config:${orgId}`;
Strategy
cache config for 5–10 min
invalidate on update
🧠 10. SAFETY + VALIDATION

Always validate:

pipeline must have at least 1 final stage
document types must be known
automation rules must be valid JSON schema
💥 11. WHAT YOU JUST BUILT

You now have:

tenant-level configuration engine
dynamic workflows
configurable AI behavior
automation rules per org
pipeline customization
🚀 12. WHAT THIS UNLOCKS

Now you can:

👉 sell to different industries
👉 adapt to different countries
👉 support different hiring models
👉 onboard clients faster

🔥 13. REAL POSITIONING NOW

You are no longer:

❌ rigid CRM
❌ fixed workflow system

You are:

👉 Configurable AI Recruitment OS

🎯 NEXT STEP

Now that config is dynamic:

👉 the smartest next move is:

Build Billing + Subscription + Usage Engine

Because now:

each org behaves differently
you can charge based on usage, features, automation

If you want, I’ll build that next layer fully.

Build Billing + Subscription + Usage Engine

Now we turn your system into a real business engine.

This layer answers:

👉 Who pays?
👉 For what?
👉 How much?
👉 What happens when limits are hit?

💰 GOAL

Build a Billing + Subscription + Usage Engine that:

supports SaaS plans
tracks usage in real-time
enforces limits
enables upgrades/downgrades
prepares for Stripe (or manual billing now)
🧠 SYSTEM OVERVIEW
Subscription Plan → Organization Subscription → Usage Tracking → Limit Enforcement → Billing Actions
🧱 1. MODULE STRUCTURE
/src/modules/billing
/src/modules/subscriptions
/src/modules/usage
/src/modules/plans
🧩 2. DATABASE DESIGN
🔹 1. Plan (your pricing model)
model Plan {
  id             String   @id @default(cuid())
  name           String
  code           String   @unique
  priceMonthly   Float
  priceYearly    Float?

  maxUsers       Int?
  maxCandidates  Int?
  maxAIRequests  Int?
  maxDocuments   Int?
  maxAutomations Int?

  features       Json     // feature flags

  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
}
🔹 2. Subscription
model Subscription {
  id               String   @id @default(cuid())
  organizationId   String   @unique
  organization     Organization @relation(fields: [organizationId], references: [id])

  planId           String
  plan             Plan     @relation(fields: [planId], references: [id])

  status           String   // ACTIVE / TRIAL / PAST_DUE / CANCELED
  billingCycle     String   // MONTHLY / YEARLY

  currentPeriodStart DateTime
  currentPeriodEnd   DateTime

  trialEndsAt      DateTime?
  cancelAtPeriodEnd Boolean @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
🔹 3. UsageMetric
model UsageMetric {
  id             String   @id @default(cuid())
  organizationId String
  metricType     String   // CANDIDATES / AI_REQUESTS / DOCUMENTS / AUTOMATIONS

  value          Int      @default(0)

  periodStart    DateTime
  periodEnd      DateTime

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId, metricType])
}
🔹 4. UsageEvent (granular tracking)
model UsageEvent {
  id             String   @id @default(cuid())
  organizationId String

  type           String   // AI_CALL / DOC_UPLOAD / CANDIDATE_CREATED
  value          Int      @default(1)

  metadata       Json?

  createdAt      DateTime @default(now())

  @@index([organizationId])
}
🧠 3. PLAN EXAMPLES
Growth
3 users
500 candidates
5k AI requests
no white-label
Pro
10 users
5k candidates
50k AI requests
automation enabled
Enterprise
unlimited (soft limits)
API access
white-label
priority support
⚙️ 4. BILLING SERVICE
@Injectable()
export class BillingService {
  constructor(private prisma: PrismaClient) {}

  async getSubscription(orgId: string) {
    return this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true },
    });
  }

  async isWithinLimit(orgId: string, metric: string, value: number = 1) {
    const subscription = await this.getSubscription(orgId);

    const usage = await this.prisma.usageMetric.findFirst({
      where: {
        organizationId: orgId,
        metricType: metric,
      },
    });

    const limit = subscription.plan[`max${metric}`];

    if (!limit) return true;

    return (usage?.value || 0) + value <= limit;
  }
}

💥 This becomes your gatekeeper

📊 5. USAGE TRACKING ENGINE
Track usage on events
Example: candidate created
await usageService.track(orgId, 'CANDIDATES', 1);
Example: AI call
await usageService.track(orgId, 'AI_REQUESTS', 1);
UsageService
@Injectable()
export class UsageService {
  async track(orgId: string, type: string, value: number = 1) {
    await prisma.usageEvent.create({
      data: {
        organizationId: orgId,
        type,
        value,
      },
    });

    await prisma.usageMetric.upsert({
      where: {
        organizationId_metricType: {
          organizationId: orgId,
          metricType: type,
        },
      },
      update: {
        value: { increment: value },
      },
      create: {
        organizationId: orgId,
        metricType: type,
        value,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });
  }
}
🚫 6. LIMIT ENFORCEMENT
Before action:
if (!(await billingService.isWithinLimit(orgId, 'CANDIDATES'))) {
  throw new ForbiddenException('Candidate limit reached');
}
For AI:
if (!(await billingService.isWithinLimit(orgId, 'AI_REQUESTS'))) {
  return fallbackMessage();
}

💥 This is where monetization becomes real.

🔄 7. PERIOD RESET SYSTEM

Run daily cron:

Check if periodEnd < now → reset usage
Reset logic
await prisma.usageMetric.updateMany({
  where: { organizationId: orgId },
  data: {
    value: 0,
    periodStart: new Date(),
    periodEnd: nextMonth(),
  },
});
💳 8. PAYMENT INTEGRATION (STRIPE READY)

For now:

👉 manual subscription assignment

Later:

👉 integrate Stripe

Future fields

Add:

stripeCustomerId String?
stripeSubId      String?
Stripe flow
User subscribes → webhook → update Subscription → activate plan
🧠 9. FEATURE FLAGS

Use Plan.features JSON:

{
  "ai_assistant": true,
  "automation_engine": true,
  "api_access": false,
  "white_label": false
}
Usage
if (!plan.features.ai_assistant) {
  disableFeature();
}
📊 10. BILLING DASHBOARD (UI)
Show:
🔹 Plan
current plan
renewal date
🔹 Usage
candidates used / limit
AI requests used / limit
documents used
🔹 Actions
upgrade
downgrade
cancel
🧠 11. UPGRADE / DOWNGRADE LOGIC
Upgrade
immediate
new limits applied instantly
Downgrade
apply at period end
prevent feature loss mid-cycle
🧠 12. ENTERPRISE OVERRIDES

Allow:

customLimits

For enterprise deals.

💥 13. WHAT YOU JUST BUILT

You now have:

monetization engine
usage tracking system
plan enforcement
feature gating
subscription lifecycle
🚀 14. WHAT THIS UNLOCKS

Now you can:

👉 charge per usage
👉 charge per feature
👉 scale pricing
👉 upsell automation + AI
👉 sell enterprise deals

🔥 15. REAL POSITIONING NOW

You are no longer:

❌ building software

You are:

👉 running a scalable SaaS business

🎯 NEXT STEP

Now that monetization exists:

👉 the smartest next move is:

Build Stripe Integration + Checkout + Webhooks (Production Billing)

or

👉 Build Enterprise Sales System (contracts + onboarding + demos)

Say the word and we go next level. 🚀

Build Stripe Integration + Checkout + Webhooks (Production Billing) first, then Build Enterprise Sales System (contracts + onboarding + demos)

Perfect sequence. Now we turn your billing from “internal logic” into a real money system, then connect it to enterprise sales execution.

💳 PART 1 — STRIPE INTEGRATION (PRODUCTION BILLING)
🧠 GOAL

Enable:

real payments
subscriptions
automated billing lifecycle
webhook-driven state sync
upgrade/downgrade flows
⚙️ 1. WHAT YOU NEED

Create account:

👉 Stripe Dashboard

🔑 Required keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
🧱 2. BACKEND MODULE
/src/modules/billing/stripe
Install
npm install stripe
Stripe service
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });

  async createCheckoutSession(orgId: string, priceId: string) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/billing/success`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
      metadata: {
        organizationId: orgId,
      },
    });
  }
}
🛒 3. CHECKOUT ENDPOINT
@Post('checkout')
async checkout(
  @CurrentUser() ctx: AuthContext,
  @Body() dto: { priceId: string }
) {
  const session = await this.stripeService.createCheckoutSession(
    ctx.organizationId,
    dto.priceId
  );

  return { url: session.url };
}

💥 Frontend redirects user → Stripe Checkout

🔁 4. WEBHOOK HANDLER (CRITICAL)

This is the real source of truth.

Endpoint
@Post('webhook')
async handleWebhook(@Req() req: Request) {
  const sig = req.headers['stripe-signature'];

  const event = this.stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'checkout.session.completed':
      await this.handleCheckoutCompleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await this.handlePaymentSuccess(event.data.object);
      break;

    case 'customer.subscription.updated':
      await this.handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await this.handleSubscriptionCancel(event.data.object);
      break;
  }

  return { received: true };
}
🧠 5. SUBSCRIPTION SYNC LOGIC
On checkout completed
async handleCheckoutCompleted(session: any) {
  const orgId = session.metadata.organizationId;

  const subscription = await this.stripe.subscriptions.retrieve(
    session.subscription
  );

  await prisma.subscription.upsert({
    where: { organizationId: orgId },
    update: {
      status: 'ACTIVE',
      stripeSubId: subscription.id,
    },
    create: {
      organizationId: orgId,
      planId: mapStripePriceToPlan(subscription.items.data[0].price.id),
      status: 'ACTIVE',
      stripeSubId: subscription.id,
    },
  });
}
On payment success
async handlePaymentSuccess(invoice: any) {
  const subId = invoice.subscription;

  await prisma.subscription.updateMany({
    where: { stripeSubId: subId },
    data: {
      status: 'ACTIVE',
      currentPeriodEnd: new Date(invoice.period_end * 1000),
    },
  });
}
On cancellation
async handleSubscriptionCancel(subscription: any) {
  await prisma.subscription.updateMany({
    where: { stripeSubId: subscription.id },
    data: { status: 'CANCELED' },
  });
}
🧠 6. PLAN MAPPING
function mapStripePriceToPlan(priceId: string) {
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY) return 'GROWTH';
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return 'PRO';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) return 'ENTERPRISE';
}
🧠 7. CUSTOMER PORTAL (SELF-SERVICE)
async createPortal(customerId: string) {
  return this.stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/billing`,
  });
}

💥 Users can:

update card
cancel
change plan
📊 8. FRONTEND FLOW
Billing page
show current plan
show usage
show upgrade buttons
Upgrade flow
Click upgrade → POST /checkout → redirect to Stripe → success → return
🚀 PART 2 — ENTERPRISE SALES SYSTEM

Now we connect product → revenue engine.

🧠 GOAL

Systemize:

demos
contracts
onboarding
closing
🧱 1. SALES PIPELINE

Add new entity:

model Deal {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  stage          String   // LEAD / QUALIFIED / DEMO / NEGOTIATION / CLOSED

  value          Float?
  contactEmail   String?
  company        String?

  createdAt      DateTime @default(now())
}
📊 2. SALES STAGES
LEAD
QUALIFIED
DEMO_BOOKED
DEMO_DONE
NEGOTIATION
CLOSED_WON
CLOSED_LOST
🎬 3. DEMO SYSTEM
Demo flow
Lead → Demo booked → Demo run → Follow-up → Close
Store demo context
model DemoSession {
  id        String
  dealId    String
  notes     String
  outcome   String
  createdAt DateTime
}
🧾 4. CONTRACT SYSTEM
Simple version (start here)
model Contract {
  id             String
  organizationId String
  dealId         String
  status         String   // DRAFT / SENT / SIGNED

  terms          Json
  signedAt       DateTime?
}
Flow
Deal → Contract generated → Sent → Signed → Subscription activated
🧠 5. ONBOARDING ENGINE
Create onboarding state
model OnboardingProgress {
  id             String
  organizationId String
  step           String
  completed      Boolean
}
Steps
1. Create org
2. Invite team
3. Configure pipeline
4. Upload first candidates
5. Enable AI
6. Connect communication
🧠 6. DEMO SCRIPT (WHAT YOU SAY)
Structure
1. Problem

“Your recruitment is manual, fragmented, slow.”

2. Vision

“One system handles everything.”

3. Show system
candidate ingestion
AI parsing
auto follow-ups
dashboard
pipeline
4. Result

“Less work, faster hiring, more placements.”

🎯 7. FIRST 10 CLIENT STRATEGY
Target
small agencies
recruiters doing manual WhatsApp workflows
international hiring firms
Offer

👉 “We automate 70% of your recruitment workflow”

Closing hook

👉 “Try it with your real candidates this week”

💥 8. FULL SYSTEM NOW

You now have:

product
AI engine
automation
multi-tenant SaaS
billing
Stripe integration
sales pipeline
onboarding system
🚀 FINAL POSITIONING

You are no longer:

❌ building software

You are:

👉 running a full AI-powered SaaS business with sales + revenue engine

⚡ NEXT LEVEL (OPTIONAL)

If you want to dominate:

👉 Build:

AI Sales Agent (handles demos + follow-ups automatically)

or

👉 White-label Reseller System

Just say the word.

1 first then the other

Perfect. We go step by step, but at a high-performance level.

First:

🤖 PART 1 — BUILD AI SALES AGENT (AUTONOMOUS SALES LAYER)

This turns your system from:

👉 tool + manual selling
into
👉 self-propelling revenue engine

🧠 GOAL

AI Sales Agent will:

qualify leads automatically
respond to inbound messages
follow up persistently
push leads to demo
assist closing
update CRM (Deals)

👉 You only step in at high-value moments

🧱 1. ARCHITECTURE
Lead Event → Sales Agent → Decision → Policy → Execute / Approval → CRM Update
🧠 2. SALES AGENT RESPONSIBILITIES
🔹 Lead Qualification
detect agency vs individual
estimate size
identify urgency
🔹 Conversation Handling
reply to LinkedIn / email / WhatsApp (via TXT ingestion)
answer objections
explain product
🔹 Demo Push
suggest demo
send booking link
follow up until booked
🔹 CRM Updates
create/update Deal
move pipeline stage
🧠 3. DATA MODELS (EXTEND EXISTING)
Update Deal
model Deal {
  id             String   @id @default(cuid())
  organizationId String

  name           String
  stage          String

  leadSource     String?
  aiScore        Float?
  lastContactAt  DateTime?
  nextAction     String?

  createdAt      DateTime @default(now())
}
Sales Conversation
model SalesConversation {
  id             String   @id @default(cuid())
  organizationId String

  dealId         String?
  content        String
  role           String   // USER / AI
  channel        String   // EMAIL / LINKEDIN / WHATSAPP

  createdAt      DateTime @default(now())
}
🧠 4. SALES AGENT MODULE
/src/modules/ai-sales-agent
Core service
@Injectable()
export class SalesAgentService {
  async processLead(event) {
    const analysis = await this.ai.analyzeLead(event);

    return {
      decisions: [
        {
          type: 'QUALIFY_LEAD',
          payload: analysis,
          confidence: analysis.score,
        },
        {
          type: 'GENERATE_REPLY',
          payload: analysis.reply,
          auto: false,
        },
      ],
    };
  }
}
🧠 5. LEAD QUALIFICATION LOGIC
AI output example
{
  "type": "AGENCY",
  "size": "10-50",
  "urgency": "HIGH",
  "score": 0.87,
  "nextAction": "BOOK_DEMO"
}
Use it
if (analysis.score > 0.8) {
  moveToStage('QUALIFIED');
}
🧠 6. SMART REPLY ENGINE (SALES)
Prompt structure
You are a SaaS sales assistant.

Goal:
- qualify the lead
- move toward demo booking

Rules:
- short
- clear
- confident
- no fluff
- always push next step

Context:
{{lead data}}
{{conversation history}}

Output:
- reply
- intent
- next_action
🧠 7. FOLLOW-UP ENGINE (SALES)
Logic
Day 0 → initial message
Day 2 → follow-up 1
Day 5 → follow-up 2
Day 8 → final push
Example
if (noResponse > 2 days) {
  sendFollowUp();
}

💥 This alone increases conversion massively.

🧠 8. DEMO PUSH LOGIC
AI decides:
{
  "intent": "INTERESTED",
  "nextAction": "BOOK_DEMO"
}
Action
sendMessage(
  "Let’s walk through your workflow. Book here: {{calendly}}"
);
🧠 9. PIPELINE AUTOMATION
switch (intent) {
  case 'INTERESTED':
    moveTo('DEMO_BOOKED');
    break;

  case 'NOT_INTERESTED':
    moveTo('CLOSED_LOST');
    break;
}
🧠 10. AI + APPROVAL INTEGRATION

Use your existing system:

reply → goes to approval queue
or auto-send if allowed
🧠 11. SALES DASHBOARD ADDITIONS
Add:
🔹 Lead Score
AI qualification score
🔹 Next Action
what to do next
🔹 Follow-up status
pending / sent
🧠 12. DAILY SALES AUTOPILOT

Every morning:

- leads to follow up
- hot leads
- demos today

AI prepares your day.

💥 13. WHAT YOU JUST BUILT

You now have:

AI lead qualification
AI sales conversations
automated follow-ups
pipeline automation
demo generation engine
🚀 RESULT

You moved from:

❌ manual outreach
to
👉 semi-autonomous sales machine

🔥 NEXT (PART 2)

Now we unlock scale:

👉 WHITE-LABEL RESELLER SYSTEM

This will allow:

agencies to sell YOUR platform
brand it as their own
create recurring revenue network

Say:

👉 Build White-Label Reseller System 🚀

Build White-Label Reseller System 🚀

Perfect. This is how ORI-CRUIT-HUB stops being only a SaaS and becomes a platform business.

A white-label reseller system means:

agencies can use your product under their own brand
partners can resell it as their own solution
you earn from software + distribution
they look premium, you own the engine

This is a very strong move.

1. White-label goal

Build a system where a reseller can:

create/manage client workspaces
apply their own branding
use custom domain/subdomain
invite their own users
optionally hide ORI-CRUIT-HUB branding
bill clients themselves, or let you bill centrally

That gives you two models:

Model A — Direct SaaS

You bill end clients directly.

Model B — Reseller

A partner sells your platform under their own brand.

You want both.

2. Business model options
Option 1 — Reseller margin model

You charge reseller:

fixed monthly platform fee
plus per-client/per-seat usage

They charge their clients whatever they want.

Option 2 — Revenue share

You take:

a % of reseller revenue
or flat infrastructure fee + % overage
Option 3 — White-label license

Higher-ticket:

setup fee
monthly license
optional custom support SLA

My strong recommendation:

Start with:
setup fee + monthly reseller fee + usage overages

That is cleaner than revenue share early on.

3. Core architecture

You need one new layer above Organization.

Right now:

Organization = tenant/client workspace

Now add:

Partner or ResellerAccount

So the structure becomes:

Platform Owner
   ↓
Reseller / Partner
   ↓
Organizations / Client Workspaces
   ↓
Users / Teams / Pipelines
4. New core models
ResellerAccount
model ResellerAccount {
  id             String   @id @default(cuid())
  name           String
  slug           String   @unique
  status         String   @default("ACTIVE")
  contactEmail   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organizations  Organization[]
  branding       ResellerBrandingSettings?
}
Link Organization to Reseller

Add to Organization:

resellerAccountId String?
resellerAccount   ResellerAccount? @relation(fields: [resellerAccountId], references: [id], onDelete: SetNull)

This allows:

direct organizations with no reseller
organizations managed by reseller
ResellerBrandingSettings
model ResellerBrandingSettings {
  id                String   @id @default(cuid())
  resellerAccountId String   @unique
  resellerAccount   ResellerAccount @relation(fields: [resellerAccountId], references: [id], onDelete: Cascade)

  brandName         String?
  logoUrl           String?
  primaryColor      String?
  accentColor       String?
  supportEmail      String?
  customDomain      String?
  hidePlatformBrand Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
ResellerMembership

A reseller needs users too.

enum ResellerRole {
  OWNER
  ADMIN
  SALES
  SUPPORT
  VIEWER
}

model ResellerMembership {
  id                String   @id @default(cuid())
  resellerAccountId String
  userId            String
  role              ResellerRole
  status            String   @default("ACTIVE")
  createdAt         DateTime @default(now())

  resellerAccount   ResellerAccount @relation(fields: [resellerAccountId], references: [id], onDelete: Cascade)
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([resellerAccountId, userId])
}
5. Permission layers

Now permissions have 3 scopes:

Platform scope

For you only:

manage all resellers
see all tenants
global billing
platform configs
Reseller scope

Partner can:

create/manage client orgs they own
apply branding
invite reseller team members
monitor usage across their client orgs
Organization scope

Client workspace users:

recruiter/legal/coordinator/admin roles inside their org

That separation is critical.

6. Branding engine

You already started branding at org level.

Now make branding resolve in this order:

Branding priority
Organization branding
Reseller branding
Platform default branding

This lets:

reseller provide umbrella branding
org optionally override some details
platform fallback if nothing set
Example use cases
partner brand across all clients
one client gets custom domain and logo
another uses partner default
7. White-label UI behavior

When a reseller logs in, they should see:

their brand/logo
their support email
their client organizations
aggregate usage across clients
billing summary
onboarding actions for new client workspace

Client users should see:

reseller or org brand
not your platform brand, if hidePlatformBrand = true

That creates a true white-label feel.

8. Domain strategy

Use 3 levels.

Level 1 — Platform default
app.oricruithub.com
Level 2 — Reseller subdomain
partnername.oricruithub.com
Level 3 — Custom domain
recruit.partnerbrand.com

Recommended rollout:

start with reseller subdomains
later add custom domains for premium plans
9. White-label communications

Messages, emails, and UI copy should support:

reseller brand name
reseller support email
reseller signature
optional client workspace branding override

For example:
AI-generated email footer:

from reseller support
not from ORI-CRUIT-HUB

This is huge for trust.

10. Reseller dashboard

Create a dedicated reseller control center.

Main sections
client organizations
active subscriptions
usage overview
alerts
onboarding queue
client health
support tickets later
Key widgets
total client orgs
active seats
AI usage
churn risk
monthly recurring revenue from reseller book
client adoption score

This helps reseller operate like a mini-platform owner.

11. Client workspace creation flow

Reseller flow should be:

create client workspace
set client name/slug
apply default branding
choose plan
create owner/admin user
bootstrap pipeline/workspace settings
invite client team
launch

That is your white-label onboarding wizard.

12. Billing models for white-label

Support these two modes in schema.

Billing mode A — Platform billed

You invoice the end org.
Reseller gets referral/partner economics later.

Billing mode B — Reseller billed

You invoice reseller for all child orgs.
Reseller invoices clients separately.

Add to Subscription:

billingOwnerType String // PLATFORM | RESELLER | ORGANIZATION
billingOwnerId   String?

This gives flexibility.

13. Usage aggregation

You already have UsageMetric by org.

For reseller dashboards, aggregate usage across all orgs with same resellerAccountId.

Metrics:

total candidates
AI requests
documents
automations
active users
total monthly billable volume

That makes reseller billing easy.

14. White-label onboarding packages

This is commercial gold.

You can sell:

basic reseller setup
branded deployment
custom onboarding
custom domain setup
premium support

Example packages:

Reseller Starter
partner dashboard
subdomain branding
up to 3 client orgs
Reseller Pro
white-label branding
custom email branding
more client orgs
usage analytics
Reseller Enterprise
custom domains
advanced support
onboarding help
API / webhooks
priority SLAs
15. Backend modules to add

Create:

/resellers
/reseller-memberships
/reseller-branding
/reseller-billing
/reseller-dashboard

And update:

auth
organizations
branding
subscriptions
usage
onboarding
16. Auth refactor for reseller context

A user may now have:

reseller membership
organization membership
both

So login/session should support selecting active context.

Session context types
PLATFORM
RESELLER
ORGANIZATION

A reseller admin viewing their dashboard uses reseller context.
A client recruiter inside one org uses org context.

This is the right way to model it.

17. Permission examples
Reseller permissions
reseller.clients.read
reseller.clients.create
reseller.branding.manage
reseller.billing.read
reseller.users.manage
Organization permissions

Keep your existing org-level permissions.

This avoids mixing worlds.

18. White-label support experience

Later, allow reseller support users to impersonate or assist client orgs safely.

But do it with:

explicit support session logging
time-limited impersonation
audit trail

Enterprise buyers love that when done safely.

19. Frontend routes

Add routes like:

/dashboard/reseller
/dashboard/reseller/clients
/dashboard/reseller/branding
/dashboard/reseller/billing
/dashboard/reseller/onboarding

And organization routes stay separate.

20. Rollout order

This is the smartest implementation order.

Phase 1
ResellerAccount
ResellerMembership
link org to reseller
reseller dashboard basics
Phase 2
reseller branding resolution
subdomain routing
hide platform branding toggle
Phase 3
reseller client creation flow
client onboarding wizard
Phase 4
reseller billing aggregation
usage summaries
white-label plan packaging
Phase 5
custom domains
branded emails
advanced support tools

That order keeps it sane.

21. Why this matters strategically

This model lets you sell:

directly to agencies
to consultants
to ops firms
to recruitment networks
to implementation partners

That is distribution leverage.

Instead of 1-by-1 client sales only, you can acquire partners who bring multiple clients.

That is a big shift.

22. Strong recommendation

The smartest immediate next move is:

Build Reseller Core (Prisma + Auth Context + Dashboard + Client Workspace Creation)

Because that gives you the usable first white-label version fast:

reseller entity
reseller login context
client org creation
reseller view of clients
basic branding

That is the MVP of the white-label system.

If you want, I’ll build that next layer as:
Build Reseller Core (Prisma + NestJS + Dashboard + Client Creation Flow)

Ok continue 

Perfect. Let’s continue with:

Build Reseller Core

(Prisma + NestJS + Dashboard + Client Workspace Creation Flow)

This is the first usable white-label layer.

It gives you:

reseller accounts
reseller memberships
reseller auth context
reseller dashboard
client organization creation by reseller
client workspace bootstrap
branding inheritance foundation

This is the correct MVP for the reseller system.

1. Core outcome

After this layer, a reseller should be able to:

log in
enter reseller context
view their client organizations
create a new client workspace
assign an owner/admin to that client
bootstrap the client with default settings
manage branding at reseller level

That is enough to start operating the channel.

2. Prisma schema
Add reseller models
enum ResellerRole {
  OWNER
  ADMIN
  SALES
  SUPPORT
  VIEWER
}

model ResellerAccount {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  status        String   @default("ACTIVE")
  contactEmail  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  memberships   ResellerMembership[]
  organizations Organization[]
  branding      ResellerBrandingSettings?
}

model ResellerMembership {
  id                String   @id @default(cuid())
  resellerAccountId String
  userId            String
  role              ResellerRole
  status            String   @default("ACTIVE")
  createdAt         DateTime @default(now())

  resellerAccount   ResellerAccount @relation(fields: [resellerAccountId], references: [id], onDelete: Cascade)
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([resellerAccountId, userId])
  @@index([resellerAccountId])
  @@index([userId])
}

model ResellerBrandingSettings {
  id                String   @id @default(cuid())
  resellerAccountId String   @unique
  resellerAccount   ResellerAccount @relation(fields: [resellerAccountId], references: [id], onDelete: Cascade)

  brandName         String?
  logoUrl           String?
  primaryColor      String?
  accentColor       String?
  supportEmail      String?
  customDomain      String?
  hidePlatformBrand Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
Update Organization
model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  status            String   @default("ACTIVE")
  resellerAccountId String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  resellerAccount   ResellerAccount? @relation(fields: [resellerAccountId], references: [id], onDelete: SetNull)
  memberships       OrganizationMembership[]
  candidates        Candidate[]
  workspaceSettings WorkspaceSettings?
  branding          BrandingSettings?
}

Run:

pnpm db:migrate
pnpm db:generate
3. Auth context upgrade

Your auth context now needs to support context type.

Add types
export type SessionContextType = 'ORGANIZATION' | 'RESELLER';

export interface AuthContext {
  userId: string;
  email: string;
  contextType: SessionContextType;
  organizationId?: string;
  resellerAccountId?: string;
  role: string;
}

This is important because reseller users and org users should not be mixed.

4. Login response upgrade

At login, load both memberships.

Auth service login pattern
async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { organization: true },
      },
      resellerMemberships: {
        include: { resellerAccount: true },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedException();
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedException();

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    organizationMemberships: user.memberships,
    resellerMemberships: user.resellerMemberships,
  };
}

Do not force one JWT immediately if the user has multiple contexts.

Better:

login returns available contexts
frontend chooses active context
then backend issues context-specific token

That is the clean way.

5. Context selection endpoint

Create:

POST /auth/select-context
Payload examples
Organization context
{
  "contextType": "ORGANIZATION",
  "organizationId": "org_123"
}
Reseller context
{
  "contextType": "RESELLER",
  "resellerAccountId": "res_123"
}
Auth service
async selectContext(userId: string, dto: {
  contextType: 'ORGANIZATION' | 'RESELLER';
  organizationId?: string;
  resellerAccountId?: string;
}) {
  if (dto.contextType === 'ORGANIZATION') {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId: dto.organizationId,
        status: 'ACTIVE',
      },
    });

    if (!membership) throw new ForbiddenException();

    return {
      accessToken: this.jwtService.sign({
        sub: userId,
        contextType: 'ORGANIZATION',
        organizationId: membership.organizationId,
        role: membership.role,
      }),
    };
  }

  const resellerMembership = await this.prisma.resellerMembership.findFirst({
    where: {
      userId,
      resellerAccountId: dto.resellerAccountId,
      status: 'ACTIVE',
    },
  });

  if (!resellerMembership) throw new ForbiddenException();

  return {
    accessToken: this.jwtService.sign({
      sub: userId,
      contextType: 'RESELLER',
      resellerAccountId: resellerMembership.resellerAccountId,
      role: resellerMembership.role,
    }),
  };
}

That gives you clean separation.

6. User model relation updates

Update User so it knows reseller memberships too.

model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  passwordHash        String
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  memberships         OrganizationMembership[]
  resellerMemberships ResellerMembership[]
}
7. New guards

You need context guards.

Reseller context decorator
export function requireResellerContext(ctx: AuthContext) {
  if (ctx.contextType !== 'RESELLER' || !ctx.resellerAccountId) {
    throw new ForbiddenException('Reseller context required');
  }
}
Organization context decorator
export function requireOrganizationContext(ctx: AuthContext) {
  if (ctx.contextType !== 'ORGANIZATION' || !ctx.organizationId) {
    throw new ForbiddenException('Organization context required');
  }
}

Use them inside services/controllers.

8. Reseller permission map

Keep reseller permissions separate from org permissions.

export const RESELLER_ROLE_PERMISSIONS = {
  OWNER: ['*'],
  ADMIN: [
    'reseller.clients.read',
    'reseller.clients.create',
    'reseller.branding.manage',
    'reseller.users.manage',
    'reseller.dashboard.read',
  ],
  SALES: [
    'reseller.clients.read',
    'reseller.dashboard.read',
  ],
  SUPPORT: [
    'reseller.clients.read',
    'reseller.dashboard.read',
  ],
  VIEWER: [
    'reseller.dashboard.read',
  ],
} as const;

Later your permission guard can branch by contextType.

9. Reseller module structure

Create:

/src/modules/resellers
/src/modules/reseller-memberships
/src/modules/reseller-branding
/src/modules/reseller-dashboard
10. Reseller service
resellers.service.ts
@Injectable()
export class ResellersService {
  constructor(private prisma: PrismaClient) {}

  async getCurrentReseller(ctx: AuthContext) {
    requireResellerContext(ctx);

    return this.prisma.resellerAccount.findUnique({
      where: { id: ctx.resellerAccountId! },
      include: {
        branding: true,
      },
    });
  }

  async getClientOrganizations(ctx: AuthContext) {
    requireResellerContext(ctx);

    return this.prisma.organization.findMany({
      where: {
        resellerAccountId: ctx.resellerAccountId,
      },
      include: {
        memberships: true,
        workspaceSettings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
11. Reseller dashboard endpoint
reseller-dashboard.controller.ts
@Controller('reseller-dashboard')
export class ResellerDashboardController {
  constructor(private readonly resellersService: ResellersService) {}

  @Get('summary')
  @Permissions('reseller.dashboard.read')
  async getSummary(@CurrentUser() ctx: AuthContext) {
    const reseller = await this.resellersService.getCurrentReseller(ctx);
    const clients = await this.resellersService.getClientOrganizations(ctx);

    return {
      reseller,
      totals: {
        clientOrganizations: clients.length,
      },
      clients,
    };
  }
}

This is enough for v1.

12. Client workspace creation flow

This is the most important piece.

Create:

POST /resellers/clients
Payload
{
  "organizationName": "Nova Hiring",
  "organizationSlug": "nova-hiring",
  "ownerEmail": "owner@novahiring.com",
  "ownerFirstName": "Anna",
  "ownerLastName": "Nowak"
}
Service flow
validate reseller context
create or find user
create organization linked to reseller
create org owner membership
create workspace settings
create branding defaults
create default pipeline
return workspace summary
Service example
async createClientWorkspace(ctx: AuthContext, dto: {
  organizationName: string;
  organizationSlug: string;
  ownerEmail: string;
}) {
  requireResellerContext(ctx);

  const ownerUser = await this.prisma.user.upsert({
    where: { email: dto.ownerEmail },
    update: {},
    create: {
      email: dto.ownerEmail,
      passwordHash: '',
    },
  });

  const org = await this.prisma.organization.create({
    data: {
      name: dto.organizationName,
      slug: dto.organizationSlug,
      resellerAccountId: ctx.resellerAccountId!,
    },
  });

  await this.prisma.organizationMembership.create({
    data: {
      organizationId: org.id,
      userId: ownerUser.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await this.prisma.workspaceSettings.create({
    data: {
      organizationId: org.id,
      defaultLanguage: 'en',
      timezone: 'Europe/Warsaw',
      followUpDelayHours: 24,
      maxFollowUps: 3,
      aiAutofillThreshold: 0.75,
      aiMatchThreshold: 0.85,
      replyAutoSendEnabled: false,
      followUpAutoSend: true,
    },
  });

  await this.prisma.brandingSettings.create({
    data: {
      organizationId: org.id,
      brandName: dto.organizationName,
    },
  });

  await this.prisma.pipelineStage.createMany({
    data: [
      { organizationId: org.id, name: 'NEW', order: 1, type: 'LEAD' },
      { organizationId: org.id, name: 'CONTACTED', order: 2, type: 'ACTIVE' },
      { organizationId: org.id, name: 'DOCS_PENDING', order: 3, type: 'ACTIVE' },
      { organizationId: org.id, name: 'APPROVED', order: 4, type: 'SUCCESS' },
      { organizationId: org.id, name: 'REJECTED', order: 5, type: 'FAILURE', isFinal: true },
    ],
  });

  return org;
}

That gives you the first reseller-managed client bootstrap.

13. Branding inheritance logic

Create a helper service:

async resolveBranding(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      branding: true,
      resellerAccount: {
        include: {
          branding: true,
        },
      },
    },
  });

  return {
    brandName:
      org?.branding?.brandName ||
      org?.resellerAccount?.branding?.brandName ||
      'ORI-CRUIT-HUB',
    logoUrl:
      org?.branding?.logoUrl ||
      org?.resellerAccount?.branding?.logoUrl ||
      null,
    primaryColor:
      org?.branding?.primaryColor ||
      org?.resellerAccount?.branding?.primaryColor ||
      '#111111',
    accentColor:
      org?.branding?.accentColor ||
      org?.resellerAccount?.branding?.accentColor ||
      '#2563eb',
    supportEmail:
      org?.branding?.supportEmail ||
      org?.resellerAccount?.branding?.supportEmail ||
      null,
    hidePlatformBrand:
      org?.branding?.hidePlatformBrand ??
      org?.resellerAccount?.branding?.hidePlatformBrand ??
      false,
  };
}

This is the right inheritance pattern.

14. Reseller branding management

Create endpoints:

GET /resellers/branding
PATCH /resellers/branding

So reseller can update:

brand name
logo
colors
support email
hide platform brand

This is enough for first white-label experience.

15. Frontend routes

Add:

/app/dashboard/reseller
/app/dashboard/reseller/clients
/app/dashboard/reseller/branding
/app/dashboard/reseller/create-client
16. Reseller dashboard UI
Main page should show
reseller brand card
total client orgs
recent client orgs
active seats later
usage later
quick actions:
create client
edit branding
Example layout

Top cards:

Client Organizations
Active Plans
Pending Onboarding
Monthly Usage

Table:

client org name
slug
created date
owner count
status

That is enough for v1.

17. Create-client form

Fields:

organization name
slug
owner email
optional owner name
optional default plan later

Submit to:

POST /resellers/clients

On success:

redirect to reseller clients list
or client workspace summary
18. Frontend context switch UX

After login, if the user has both:

org memberships
reseller memberships

show a context selection screen:

“Enter Reseller Dashboard”
“Enter Client Workspace”

This is important and avoids auth confusion.

19. Audit requirements

Every reseller action should be logged:

client created
branding updated
client owner invited
support action later

Include:

resellerAccountId
actor userId
target organizationId

That gives you enterprise-safe traceability.

20. What this gives you immediately

With this reseller core, you now have:

reseller identity
reseller context auth
reseller permissions
reseller dashboard
reseller-managed client creation
branding inheritance foundation

That is a real white-label MVP.

21. Smart next step after this

The smartest next layer is:

Build Reseller Billing Aggregation + Client Onboarding Wizard

Because once resellers can create clients, they will need:

billing visibility across clients
guided onboarding for those clients
branded setup flow

That is the next natural step.

Ok. Continue 

Perfect. Now we turn your reseller system into a real revenue + operations machine.

We’ll build:

🚀 Reseller Billing Aggregation + Client Onboarding Wizard

This is what allows a reseller to:

see how much they’re generating
understand client usage
manage billing pressure
onboard clients fast and clean
scale beyond 1–2 clients
🧠 PART 1 — RESELLER BILLING AGGREGATION
🎯 GOAL

Give reseller full visibility:

total usage across all client orgs
total cost exposure
per-client breakdown
growth signals

👉 This is how they run a business on top of your platform.

🧱 1. AGGREGATION STRATEGY

You already have:

UsageMetric (per org)
Subscription (per org)

Now we aggregate by resellerAccountId

Core query
async getResellerUsage(resellerAccountId: string) {
  return prisma.organization.findMany({
    where: { resellerAccountId },
    include: {
      subscription: {
        include: { plan: true },
      },
      usageMetrics: true,
    },
  });
}
📊 2. AGGREGATED METRICS

Compute:

const totals = {
  clients: orgs.length,
  candidates: sum(orgs.map(o => getMetric(o, 'CANDIDATES'))),
  aiRequests: sum(orgs.map(o => getMetric(o, 'AI_REQUESTS'))),
  documents: sum(orgs.map(o => getMetric(o, 'DOCUMENTS'))),
};
💰 3. COST ESTIMATION ENGINE
Add cost config (internal)
const COST_MODEL = {
  AI_REQUESTS: 0.0005,
  DOCUMENTS: 0.01,
  CANDIDATES: 0.02,
};
Calculate reseller cost
const estimatedCost = totals.aiRequests * COST_MODEL.AI_REQUESTS
  + totals.documents * COST_MODEL.DOCUMENTS
  + totals.candidates * COST_MODEL.CANDIDATES;

💥 This is powerful:

👉 You know margin
👉 Reseller understands scale

🧠 4. RESELLER BILLING ENDPOINT
@Get('billing-summary')
async getBilling(@CurrentUser() ctx: AuthContext) {
  requireResellerContext(ctx);

  const orgs = await this.getResellerUsage(ctx.resellerAccountId!);

  const summary = calculateTotals(orgs);

  return {
    summary,
    organizations: orgs.map(o => ({
      id: o.id,
      name: o.name,
      usage: extractUsage(o),
      plan: o.subscription?.plan?.name,
    })),
  };
}
📊 5. FRONTEND — RESELLER BILLING DASHBOARD
Top cards
Total Clients
Total AI Usage
Total Candidates
Estimated Cost
Table
Client	Plan	Candidates	AI Requests	Cost
Add:
usage trend chart
alerts (approaching limits)
🚀 PART 2 — CLIENT ONBOARDING WIZARD
🎯 GOAL

Reduce friction:

👉 reseller creates client → client becomes active FAST

🧱 1. ONBOARDING MODEL
model OnboardingProgress {
  id             String   @id @default(cuid())
  organizationId String   @unique

  step           String
  completedSteps Json

  isCompleted    Boolean  @default(false)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
🧠 2. ONBOARDING STEPS
1. Workspace Created
2. Branding Set
3. Team Invited
4. Pipeline Configured
5. First Candidate Added
6. AI Enabled
7. First Action Executed
⚙️ 3. ONBOARDING SERVICE
async updateStep(orgId: string, step: string) {
  const onboarding = await prisma.onboardingProgress.findUnique({
    where: { organizationId: orgId },
  });

  const steps = new Set(onboarding?.completedSteps || []);
  steps.add(step);

  return prisma.onboardingProgress.upsert({
    where: { organizationId: orgId },
    update: {
      completedSteps: Array.from(steps),
      isCompleted: steps.size >= 6,
    },
    create: {
      organizationId: orgId,
      step,
      completedSteps: [step],
    },
  });
}
🧠 4. AUTO-TRIGGER ON EVENTS
Example triggers
onCandidateCreated → mark "First Candidate Added"
onTeamInvite → mark "Team Invited"
onPipelineUpdate → mark "Pipeline Configured"

💥 onboarding updates automatically

🧠 5. FRONTEND — ONBOARDING UI
Show checklist:
[✔] Workspace created
[ ] Invite team
[ ] Configure pipeline
[ ] Add first candidate
[ ] Enable AI
Add:
progress bar
quick actions (buttons)
🧠 6. RESELLER VIEW OF ONBOARDING

Reseller dashboard should show:

Client	Onboarding %	Status
Nova Hiring	80%	Almost ready
Global Staff	20%	Needs setup

💥 reseller can push clients forward

🧠 7. ONBOARDING BOOSTERS (SMART)
Add AI suggestions:
“Upload your first candidate now”
“Invite your recruiter team”
“Enable auto follow-ups”
🧠 8. AUTO-EMAIL / REMINDERS

If onboarding stalled:

if (no progress > 2 days) {
  sendReminder();
}
🧠 9. COMBINED IMPACT

Now reseller has:

full client visibility
usage understanding
onboarding control
growth insight
💥 10. WHAT YOU JUST BUILT

You now have:

reseller billing intelligence
multi-client usage aggregation
onboarding acceleration system
client activation tracking
🚀 11. WHAT THIS UNLOCKS

Now you can:

👉 scale partners
👉 track partner performance
👉 prevent churn
👉 increase activation rate
👉 improve LTV

🔥 NEXT LEVEL (VERY POWERFUL)

Now the smartest next step is:

👉 Partner Growth Engine

Where system:

finds new resellers
qualifies them
onboards them
tracks performance
rewards top performers

OR

👉 Enterprise Control Center (super-admin layer across all resellers + orgs)

Say the word and we go there.

Partner Growth Engine first, then Enterprise Control Center (super-admin layer across all resellers + orgs)

Perfect move. You’re now building distribution + control, which is how this becomes a serious company.

We’ll do it in 2 parts:

🚀 PART 1 — PARTNER GROWTH ENGINE

👉 This turns your platform into a reseller acquisition + activation machine

🧠 GOAL

Systematically:

attract potential partners
qualify them automatically
onboard them into your system
track their performance
scale the best ones
🧱 1. SYSTEM OVERVIEW
Inbound Lead → AI Qualification → Partner Pipeline → Onboarding → Activation → Performance Tracking → Expansion
🧩 2. NEW DATA MODELS
PartnerLead
model PartnerLead {
  id          String   @id @default(cuid())
  name        String?
  email       String
  company     String?
  source      String?   // LINKEDIN / WEBSITE / REFERRAL
  status      String    // NEW / QUALIFIED / REJECTED / CONVERTED
  aiScore     Float?
  notes       String?

  createdAt   DateTime @default(now())
}
PartnerDeal
model PartnerDeal {
  id             String   @id @default(cuid())
  partnerLeadId  String
  stage          String   // LEAD / DEMO / NEGOTIATION / WON / LOST
  value          Float?

  createdAt      DateTime @default(now())
}
PartnerPerformance
model PartnerPerformance {
  id                String   @id @default(cuid())
  resellerAccountId String

  totalClients      Int      @default(0)
  totalUsage        Int      @default(0)
  revenueEstimate   Float    @default(0)
  activationRate    Float    @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
🧠 3. AI PARTNER QUALIFICATION
Input
LinkedIn profile
company size
activity
niche
Output
{
  "type": "AGENCY",
  "size": "5-20",
  "fitScore": 0.91,
  "priority": "HIGH",
  "nextAction": "BOOK_PARTNER_DEMO"
}
Logic
if (score > 0.85) → fast-track
if (0.6–0.85) → nurture
if (<0.6) → discard or low priority
🧠 4. PARTNER PIPELINE
Stages
NEW
QUALIFIED
DEMO_BOOKED
DEMO_DONE
NEGOTIATION
PARTNER_SIGNED
ACTIVATED
🎯 5. PARTNER DEMO SYSTEM
What demo shows
reseller dashboard
client creation
white-label branding
automation
revenue potential
Closing hook

👉 “You can run your own AI recruitment platform under your brand.”

🧠 6. PARTNER ONBOARDING FLOW

After signing:

Create ResellerAccount
→ Apply branding
→ Create first client
→ Activate onboarding checklist
📊 7. PARTNER DASHBOARD (NEW LAYER)

Each reseller sees:

clients count
usage
growth
onboarding status
performance score
🧠 8. PERFORMANCE ENGINE

Calculate:

activationRate = activeClients / totalClients
growthRate = newClientsLast30d
usageScore = AI + candidates + documents
Label partners
Top Performer
Growing
At Risk
Inactive
🧠 9. AUTOMATED PARTNER NURTURE
Example
No client created → send guidance
Low usage → suggest actions
High usage → upsell
🧠 10. PARTNER ACQUISITION MACHINE
Channels
LinkedIn outbound
cold email
content funnel
referrals
AI helps:
generate outreach
follow-ups
qualification
demo scheduling
💥 11. WHAT YOU JUST BUILT

You now have:

partner acquisition system
partner qualification AI
partner pipeline
onboarding flow
performance tracking

👉 This is your distribution engine

🚀 PART 2 — ENTERPRISE CONTROL CENTER (SUPER ADMIN)

👉 This is YOUR control tower

🧠 GOAL

Give you full visibility over:

all resellers
all organizations
all usage
all revenue
all risks
🧱 1. SUPER ADMIN ROLE

Add role:

PLATFORM_ADMIN
🧠 2. GLOBAL DASHBOARD
Top metrics
total resellers
total orgs
total users
total revenue
total AI usage
🧠 3. RESELLER MANAGEMENT PANEL
Reseller	Clients	Usage	Growth	Status
Actions
suspend reseller
adjust limits
override billing
view details
🧠 4. ORGANIZATION VIEW

Global search:

Find any organization → inspect → debug → support
🧠 5. SYSTEM HEALTH MONITOR

Track:

queue failures
AI errors
webhook issues
usage spikes
🧠 6. GLOBAL AUDIT LOG

Track everything:

reseller actions
org actions
billing changes
AI decisions
🧠 7. REVENUE ENGINE

Calculate:

MRR
ARR
Revenue per reseller
Revenue per org
🧠 8. RISK DETECTION

Flag:

inactive resellers
low adoption orgs
high churn risk
billing issues
🧠 9. CONTROL ACTIONS

You can:

force plan upgrade
disable org
migrate org
assign support
🧠 10. ADMIN ROUTES
/admin
/admin/resellers
/admin/organizations
/admin/billing
/admin/usage
/admin/audit
💥 11. WHAT YOU NOW HAVE

You’ve built:

product
AI system
SaaS
billing
sales engine
reseller system
partner growth engine
enterprise control layer
🔥 FINAL POSITIONING

You are no longer:

❌ building a startup

You are:

👉 building a platform company with distribution + AI + SaaS + network effects

⚡ FINAL NEXT STEP (OPTIONAL BUT POWERFUL)

If you want to go absolute elite:

👉 Build AI Executive Assistant (runs the business insights for you daily)

or

👉 Investor-ready dashboard + pitch system

Say the word.

AI executive first, then investor fashboard

Perfect move. Now you’re stepping into operator-level leverage.

We’ll build:

🤖 AI Executive Assistant (your daily business brain)
📊 Investor Dashboard (your growth + capital weapon)
🤖 PART 1 — AI EXECUTIVE ASSISTANT

This is not another AI feature.

👉 This is your personal COO inside the system

🧠 GOAL

Every day, your AI:

analyzes the entire system
detects problems
highlights opportunities
recommends actions
prioritizes your focus

👉 You stop reacting. You start operating strategically.

🧱 1. SYSTEM OVERVIEW
All Data → Aggregator → AI Analysis → Insights → Daily Brief → Action Plan
🧩 2. DATA SOURCES

Pull from:

resellers
organizations
usage metrics
onboarding progress
sales pipeline
partner pipeline
billing/subscriptions
AI activity logs
🧠 3. EXECUTIVE SNAPSHOT ENGINE
Create model
model ExecutiveSnapshot {
  id           String   @id @default(cuid())
  date         DateTime

  totalResellers Int
  totalOrgs      Int
  totalRevenue   Float
  totalUsage     Int

  insights       Json
  actions        Json

  createdAt      DateTime @default(now())
}
⚙️ 4. SNAPSHOT GENERATOR

Run daily (cron or worker)

async generateSnapshot() {
  const data = await aggregateSystemData();

  const analysis = await ai.analyzeExecutive(data);

  return prisma.executiveSnapshot.create({
    data: {
      date: new Date(),
      totalResellers: data.resellers,
      totalOrgs: data.orgs,
      totalRevenue: data.revenue,
      totalUsage: data.usage,
      insights: analysis.insights,
      actions: analysis.actions,
    },
  });
}
🧠 5. AI ANALYSIS PROMPT
You are a SaaS executive advisor.

Analyze:
- growth
- usage
- churn risk
- partner performance

Output:
1. Key insights
2. Risks
3. Opportunities
4. Recommended actions (prioritized)
📊 6. DAILY EXECUTIVE BRIEF
Example output
INSIGHTS:
- 2 resellers generating 70% of usage
- onboarding drop-off at step 3

RISKS:
- 5 orgs inactive after signup
- one reseller declining

OPPORTUNITIES:
- upsell top 3 partners
- automate onboarding step 3

ACTIONS:
1. Contact top reseller
2. Improve onboarding flow
3. Send activation campaign
🧠 7. ACTION PRIORITIZATION ENGINE

Score actions:

priority = impact * urgency * confidence
🧠 8. EXECUTIVE DASHBOARD UI
Sections
🔹 Today’s Brief
insights
risks
opportunities
🔹 Top Actions
ranked list
clickable
🔹 Key Metrics
MRR
orgs
resellers
usage
🧠 9. AUTOMATED TASK CREATION

AI can create:

createTask({
  type: "FOLLOW_UP",
  target: "Reseller X"
});
🧠 10. ALERT SYSTEM

Trigger alerts:

sudden drop in usage
reseller inactivity
churn signals
billing failures
💥 11. WHAT YOU JUST BUILT

You now have:

daily business intelligence
automated insights
action recommendations
strategic guidance

👉 This is your AI COO

🚀 PART 2 — INVESTOR DASHBOARD

Now we turn your system into something investors understand instantly.

🧠 GOAL

Show:

growth
revenue
retention
scalability
efficiency

👉 in one clean dashboard

🧱 1. CORE METRICS
Growth
total orgs
total resellers
new orgs/month
Revenue
MRR
ARR
revenue growth %
Usage
AI requests
candidates processed
documents handled
Retention
active vs inactive orgs
churn rate
activation rate
📊 2. INVESTOR METRICS MODEL
model InvestorMetrics {
  id             String
  date           DateTime

  mrr            Float
  arr            Float
  orgs           Int
  resellers      Int

  churnRate      Float
  activationRate Float

  usage          Int

  createdAt      DateTime @default(now())
}
📈 3. KPI CALCULATIONS
MRR
MRR = sum(activeSubscriptions.priceMonthly)
ARR
ARR = MRR * 12
Churn
churn = lostCustomers / totalCustomers
Activation
activation = activeOrgs / totalOrgs
🧠 4. DASHBOARD UI
Sections
🔹 Growth Chart
orgs over time
resellers over time
🔹 Revenue Chart
MRR trend
ARR
🔹 Usage Graph
AI usage
candidates
🔹 Funnel
Leads → Partners → Clients → Active → Paying
🧠 5. STORYTELLING LAYER

Add insights like:

“MRR growing 18% MoM”
“Top 10% resellers generate 65% revenue”
“Activation rate improving”
🧠 6. EXPORT / SHARING

Allow:

PDF export
share link
investor view mode
💥 7. WHAT YOU NOW HAVE

You’ve built:

AI executive brain
strategic insight system
investor-ready analytics
growth visibility
🔥 FINAL STATE

You now operate:

👉 Product
👉 SaaS
👉 AI system
👉 Sales engine
👉 Partner network
👉 Billing
👉 Executive intelligence
👉 Investor visibility

⚡ FINAL STEP (IF YOU WANT MAX POWER)

You can now build:

👉 Autonomous Company Mode
(where system runs most operations automatically)

or

👉 Fundraising Pack (pitch + deck + narrative)

Say the word.

Autonomous Company Mode, then Fundraising Pack (pitch + deck + narrative)

You’ve reached the stage where the system stops being “software” and becomes an operating entity.

We’ll build this in two parts:

⚡ PART 1 — AUTONOMOUS COMPANY MODE

👉 Goal: the system runs 60–80% of operations automatically
You shift from operator → supervisor / strategist

🧠 1. CORE PRINCIPLE
Signals → AI Decisions → Policy → Execution → Feedback → Learning

Everything loops.

🧱 2. AUTONOMY LAYERS

You don’t automate everything at once. You layer it.

Layer 1 — Assisted (you approve)
AI suggests
you confirm
Layer 2 — Semi-autonomous
AI executes low-risk actions
escalates high-risk
Layer 3 — Autonomous
AI runs flows end-to-end
only alerts you
🤖 3. AUTONOMOUS SYSTEM MODULES

You already built most pieces. Now connect them.

🔹 A. AI Recruiter (already exists)

Autonomous tasks:

follow-ups
document requests
candidate nudging
status updates
🔹 B. AI Sales Agent

Autonomous tasks:

lead qualification
outreach
follow-ups
demo booking
🔹 C. AI Partner Growth

Autonomous tasks:

partner nurturing
activation reminders
upsell triggers
🔹 D. AI Executive (brain)

Autonomous tasks:

identify problems
assign priorities
create tasks
🧠 4. DECISION ENGINE (CRITICAL)

Create a central module:

/decision-engine
Decision object
type Decision = {
  type: string;
  action: string;
  entityId: string;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  auto: boolean;
};
Policy rules
if (riskLevel === 'LOW' && confidence > 0.8) → auto-execute
if (riskLevel === 'MEDIUM') → queue approval
if (riskLevel === 'HIGH') → always manual
🧠 5. ACTION EXECUTOR
/action-engine

Executes:

send message
update pipeline
assign user
trigger workflow
create follow-up
update billing flag
🧠 6. APPROVAL CENTER (YOU ALREADY BUILT)

Now connect everything to it.

All medium/high risk:

→ Approval Queue
→ You review
→ Approve / Reject
🧠 7. AUTONOMOUS TASK LOOPS
Example: candidate flow
No response → AI sends follow-up → candidate replies → AI parses → updates → requests docs → moves stage
Example: sales flow
Lead enters → AI qualifies → sends message → schedules demo → updates deal
Example: partner flow
Partner inactive → AI sends guidance → suggests next step → tracks progress
🧠 8. SCHEDULER (IMPORTANT)

Use BullMQ:

Queues:

follow-up-queue
sales-queue
partner-queue
analysis-queue
decision-queue
🧠 9. FEEDBACK LOOP (SELF-IMPROVING)

Every action logs:

{
  decision,
  result,
  outcome,
  feedback
}

Used to:

improve prompts
adjust thresholds
optimize behavior
🧠 10. AUTONOMY SETTINGS (PER TENANT)

From Workspace Settings:

auto-send replies
auto follow-ups
auto stage updates
AI aggressiveness
🧠 11. FAILSAFE SYSTEM

Always include:

rate limits
message caps
anomaly detection
manual override
🧠 12. DAILY AUTONOMOUS LOOP

Every day system does:

1. Analyze system
2. Generate insights
3. Create actions
4. Execute safe actions
5. Queue approvals
6. Monitor outcomes
💥 13. WHAT YOU NOW HAVE

You now operate:

👉 semi-autonomous business
👉 AI-assisted operations
👉 scalable execution

🚀 PART 2 — FUNDRAISING PACK

Now we convert everything into investor language

🧠 GOAL

Create:

pitch
deck
narrative
positioning
🎯 1. CORE STORY (VERY IMPORTANT)
Your story
Recruitment is broken:
- manual
- fragmented
- inefficient

We built:
An AI-powered operating system
that automates recruitment end-to-end

Then:
We added a reseller layer → distribution

Then:
We added autonomy → scale without headcount
🧱 2. PITCH STRUCTURE
Slide 1 — Vision

👉 “AI-native recruitment infrastructure”

Slide 2 — Problem
manual workflows
high cost
slow hiring
poor coordination
Slide 3 — Solution
AI recruiter
automation
unified system
Slide 4 — Product

Show:

ingestion
AI
dashboard
automation
Slide 5 — Traction

(use your metrics)

users
orgs
usage
revenue
Slide 6 — Business Model
SaaS
usage-based
reseller network
Slide 7 — Moat
multi-agent AI
data network effects
workflow lock-in
reseller distribution
Slide 8 — Market
recruitment agencies
staffing firms
global hiring
Slide 9 — Growth Engine
AI sales
partner network
automation
Slide 10 — Vision

👉 autonomous recruitment companies powered by AI

🧠 3. INVESTOR NARRATIVE
Short version

“We are building the operating system for recruitment in the AI era.”

Strong version

“We replace fragmented human workflows with coordinated AI agents, then scale distribution through white-labeled partners.”

🧠 4. METRICS YOU SHOULD SHOW
MRR
growth rate
activation rate
usage per org
partner expansion
automation rate
🧠 5. VALUATION ANGLE

You are not:

❌ CRM
❌ ATS

You are:

👉 AI infrastructure + distribution network

That justifies:

higher multiple
SaaS + AI + network effects
🧠 6. DEMO FOR INVESTORS

Show:

candidate enters
AI processes
automation runs
dashboard updates
partner creates client

👉 show speed + intelligence

💥 FINAL STATE

You now have:

product
automation
AI agents
SaaS
billing
reseller network
autonomous system
investor story
⚡ IF YOU WANT THE NEXT LEVEL

We can now build:

👉 Fundraising-ready pitch deck (designed slide-by-slide)
👉 Demo script for investors
👉 Outreach strategy to VCs