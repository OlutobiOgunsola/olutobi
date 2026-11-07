import type { Decision, Flow, Metric } from "./types";

/**
 * Professional case studies, told by domain. Employers, clients and dates are
 * deliberately left out: the site is about the work, not the CV.
 */
export type CaseStudy = {
  slug: string;
  domain: string;
  title: string;
  summary: string;
  role: string;
  metrics: Metric[];
  context: string;
  problem: string;
  approach: string[];
  decisions: Decision[];
  outcome: string;
  stack: string[];
  flow: Flow;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "patient-engagement",
    domain: "Healthcare · Hospital operations",
    title: "Halving missed hospital visits with automated follow-up",
    summary:
      "Architected the reminder and follow-up system for a hospital that relied on staff remembering to call patients.",
    role: "Architect & lead engineer (2-person team)",
    metrics: [
      { value: "50%", label: "fewer missed visits" },
    ],
    context:
      "Appointment reminders and post-visit follow-ups were done by front-desk staff, by hand, when they had time. Patients got at most one ad-hoc message, and nobody could say which ones had actually been sent.",
    problem:
      "Missed appointments cost the hospital revenue and cost patients continuity of care. The fix had to be reliable in both directions: never fail to remind, and never remind twice, patients who get spammed opt out.",
    approach: [
      "Modelled reminders as data: each appointment generates a schedule of reminders and follow-ups by rule, against the patient's preferred channel.",
      "A scheduled job materialises due reminders; queue-backed workers render and deliver them over SMS and email through a single template pipeline.",
      "Each send is keyed on appointment, channel and send window, so a retry resolves to the same message instead of a second one. Cancelled or completed appointments suppress anything still pending.",
      "Failed deliveries retry with bounded, per-channel policies and then surface to staff. No silent drops.",
    ],
    decisions: [
      {
        title: "Rules in data, not in code paths",
        body: "Clinics change their reminder cadence. Encoding the cadence as schedule rows meant the hospital could change policy without a deploy.",
      },
      {
        title: "Reconcile delivery status asynchronously",
        body: "Provider delivery receipts are slow and unreliable. Workers fire and record; the final state is reconciled later against the appointment, keeping the hot path fast.",
      },
    ],
    outcome:
      "Missed visits dropped by half, reminders stopped depending on whoever was at the front desk, and the hospital gained a reliable record of every reminder sent.",
    stack: ["Node.js", "Job queues", "Scheduled jobs", "SQL", "SMS gateway", "Transactional email"],
    flow: {
      caption: "Appointments become a schedule; the schedule becomes messages",
      nodes: [
        { label: "Appointment", sub: "booked · changed" },
        { label: "Rules", sub: "cadence · channel" },
        { label: "Scheduler", sub: "due reminders" },
        { label: "Delivery", sub: "SMS · email", accent: true },
        { label: "Patient" },
      ],
      branch: { from: 3, label: "Retry → staff", sub: "bounded per channel" },
    },
  },
  {
    slug: "business-operations-platform",
    domain: "SaaS · Finance & operations",
    title: "One source of truth for a business that ran on spreadsheets",
    summary:
      "Built an internal platform that unified finance tracking, P&L reporting and inventory into a single system of record.",
    role: "Lead engineer",
    metrics: [
      { value: "3", label: "domains unified: finance, P&L, inventory" },
    ],
    context:
      "Finance, reporting and stock lived in separate spreadsheets maintained by different people. Month-end meant reconciling them by hand, and the P&L was always a few weeks stale.",
    problem:
      "Spreadsheets are flexible and forgiving. That's why people love them and why their numbers drift. The platform had to keep the speed of quick entry while making inconsistent numbers impossible to write.",
    approach: [
      "Modelled money movement explicitly, so P&L is derived from recorded transactions rather than typed in.",
      "Tied inventory movements to the financial records they create, so a stock adjustment and its cost can't disagree.",
      "Role-based access per function, so finance, operations and management each see and change only what they own.",
      "Kept fast-entry flows for day-to-day staff, with validation at the boundary and constraints in the database.",
    ],
    decisions: [
      {
        title: "Derive reports, never re-key them",
        body: "Every report is a query over recorded events. More upfront modelling, zero month-end drift.",
      },
      {
        title: "Constraints at the database layer",
        body: "UI validation is a courtesy; database constraints are the guarantee. Both, always.",
      },
    ],
    outcome:
      "The business replaced its spreadsheet stack with a single trusted system and got a P&L view that's current the moment a transaction is recorded.",
    stack: ["TypeScript", "React", "Node.js", "Relational SQL", "RBAC"],
    flow: {
      caption: "Record once; derive everything else",
      nodes: [
        { label: "Sales & expenses", sub: "fast entry" },
        { label: "Transactions", sub: "system of record", accent: true },
        { label: "Inventory", sub: "linked movements" },
        { label: "P&L & reports", sub: "derived, live" },
      ],
    },
  },
  {
    slug: "claims-service-interfaces",
    domain: "Insurance · Claims processing",
    title: "Predictable service interfaces for insurance claims",
    summary:
      "Designed backend service contracts that gave claims data one reliable path through processing, cutting reconciliation errors downstream.",
    role: "Backend engineer",
    metrics: [],
    context:
      "Claims data moved between internal systems through interfaces that had grown organically. Each consumer handled malformed or partial data differently, and errors surfaced days later in reconciliation.",
    problem:
      "In a regulated insurer, \"we'll fix it at month-end\" isn't acceptable. Downstream teams needed interfaces that behaved the same way every time, including when things went wrong.",
    approach: [
      "Defined explicit request and response contracts for claims data and validated at the boundary, so bad data was rejected at intake rather than discovered in finance.",
      "Separated retryable from terminal failures with clear, documented error responses, so callers knew exactly what to do with each.",
      "Profiled the claims data flow and removed the bottlenecks that were causing partial writes and duplicate records.",
      "Wrote the documentation dependent teams needed to integrate without a meeting.",
    ],
    decisions: [
      {
        title: "Fail at the boundary",
        body: "The cheapest place to catch a bad claim is the moment it arrives. Everything after that is reconciliation.",
      },
      {
        title: "Speed inside the compliance envelope",
        body: "Balanced delivery pace against the security and audit requirements of a regulated environment, nothing shipped without a paper trail.",
      },
    ],
    outcome:
      "Claims data reached underwriting and finance through one predictable path, and the reconciliation errors that had become routine fell away.",
    stack: ["Backend services", "REST", "Schema validation", "Structured error contracts", "Technical documentation"],
    flow: {
      caption: "One contract between every source and every consumer",
      nodes: [
        { label: "Claim sources", sub: "internal systems" },
        { label: "Contract", sub: "validate at intake", accent: true },
        { label: "Claims service", sub: "consistent writes" },
        { label: "Underwriting & finance" },
      ],
      branch: { from: 1, label: "Rejected early", sub: "documented errors" },
    },
  },
  {
    slug: "bulk-orders",
    domain: "Fintech · Bulk payments",
    title: "Bulk orders in minutes, not a working day",
    summary:
      "Rebuilt how business partners place large orders: submit once, process in parallel, and settle every line safely, even when the network makes everyone retry.",
    role: "Design, implementation, rollout & on-call ownership",
    metrics: [
      { value: "1,000+", label: "orders per run" },
      { value: "<25 min", label: "end to end" },
      { value: "~80%", label: "less partner processing time" },
    ],
    context:
      "Business partners buy digital products (airtime, data, bill payments) in bulk for their own customers. Before this work, every order went through the same path a single consumer purchase did: one request, one provider call, one wait.",
    problem:
      "Processing was sequential, so a large order took most of a working day and one stuck provider call held up everything behind it. Worse, the path wasn't safe to retry: a timeout followed by a resubmission could debit a partner's wallet twice or vend the same order twice. In payments, that's the bug that ends trust.",
    approach: [
      "Partners submit a batch once. The API validates every row up front, persists the batch, and returns immediately with a batch reference instead of holding the connection open.",
      "A scheduler fans the batch out onto a Bull queue backed by Redis. A pool of workers vends items concurrently, with per-item retries and backoff tuned to each provider's failure modes.",
      "Every order carries an entity-unique identifier enforced by a composite unique index. A retried request (from the partner, the queue, or an operator) collides with the existing row and resolves to the original outcome instead of creating a new charge.",
      "Items that exhaust their retries land in a reject set an operator can see and act on, and partners get a reconciled CSV of every line's final state.",
    ],
    decisions: [
      {
        title: "Uniqueness lives in the database, not in application code",
        body: "Application-level \"check then insert\" races under concurrency. A composite unique index can't. The code's job is to handle the collision gracefully; the database's job is to make the duplicate impossible.",
      },
      {
        title: "At-least-once delivery, exactly-once effects",
        body: "Exactly-once queues across third-party providers are a fantasy. I accepted at-least-once delivery from the queue and pushed deduplication to the point where money moves.",
      },
      {
        title: "CSV stays as the interchange format",
        body: "Partner finance teams live in spreadsheets. Keeping CSV in and out made every batch auditable by the people who sign off on it. The envelope doesn't matter as long as every row is idempotent.",
      },
    ],
    outcome:
      "Partners now clear 1,000+ item batches in under 25 minutes, roughly 80% faster than before, without babysitting the process. Retries, resubmissions and operator replays are routine rather than dangerous.",
    stack: ["Node.js", "Express", "Bull", "Redis", "MySQL", "Sequelize", "AWS SQS", "Cron", "CSV pipelines"],
    flow: {
      caption: "Submit once, fan out, settle every row exactly once",
      nodes: [
        { label: "Partner", sub: "API · CSV" },
        { label: "Batch API", sub: "validate · persist" },
        { label: "Scheduler", sub: "fan-out" },
        { label: "Workers", sub: "concurrent · retries", accent: true },
        { label: "Ledger", sub: "unique index" },
      ],
      branch: { from: 3, label: "Reject set", sub: "operator review" },
    },
  },
];

export const caseStudyBySlug = (slug: string) => caseStudies.find((c) => c.slug === slug);
