import type { Decision, Flow, Metric } from "./types";

/**
 * Products built independently. Scale figures were measured from the source
 * trees (models, tools, lines, test files). Update them as the code grows.
 */
export type ProjectStatus = { label: string; tone: "live" | "building" | "lab" };

export type Screenshot = { src: string; alt: string; width: number; height: number; device: "desktop" | "phone" };

export type Project = {
  slug: string;
  name: string;
  family?: "Zigna";
  kind: string;
  status: ProjectStatus;
  oneLiner: string;
  pitch: string;
  scale: Metric[];
  surfaces: string[];
  problem: string;
  built: string[];
  decisions: Decision[];
  stack: { label: string; items: string[] }[];
  flow: Flow;
  next?: string[];
  repo?: string;
  /* The code exists but the repository isn't public; shown instead of a source link. */
  privateRepo?: boolean;
  /* Slugs of essays in src/content/articles that explain this build. */
  essays?: string[];
  /* Real screenshots, served from /public/projects/<slug>/. */
  screenshots?: Screenshot[];
};

export const projects: Project[] = [
  {
    slug: "zignalyft",
    essays: ["every-query-has-a-landlord"],
    name: "ZignaLyft",
    family: "Zigna",
    kind: "Multi-tenant gym management SaaS",
    status: { label: "In production · running a gym in Ibadan", tone: "live" },
    oneLiner: "Gym management software that tracks revenue, attendance, churn and membership health in real time.",
    pitch:
      "Most gyms run on a notebook, a POS and a WhatsApp group, so owners only find out a member has left after they are gone. ZignaLyft puts the whole business in one system and gives members an app they actually use.",
    scale: [
      { value: "42", label: "data models" },
      { value: "20+", label: "business domains" },
      { value: "4", label: "surfaces shipped" },
    ],
    surfaces: ["REST API", "Owner & staff dashboard", "Member mobile app (iOS / Android)", "Marketing site"],
    screenshots: [
      {
        src: "/projects/zignalyft/owner-home.jpg",
        alt: "ZignaLyft owner app showing today's performance report with alerts for new signups, retention and expiring subscriptions",
        width: 500,
        height: 1082,
        device: "phone",
      },
      {
        src: "/projects/zignalyft/member-home.png",
        alt: "ZignaLyft member app showing a consistency streak, milestone badges and a check-in heatmap",
        width: 780,
        height: 1688,
        device: "phone",
      },
      {
        src: "/projects/zignalyft/instructor-classes.png",
        alt: "ZignaLyft instructor app listing upcoming classes",
        width: 780,
        height: 1688,
        device: "phone",
      },
    ],
    problem:
      "A gym's important numbers, like who is about to leave, which plans make money and which equipment needs repair, usually live in people's heads. Generic CRMs don't model memberships, instructors or check-ins, or the way Nigerian gyms collect money.",
    built: [
      "Memberships, plans and subscriptions with renewals, suspensions and refunds",
      "Check-ins, visits, classes and instructor assignment",
      "Retention: churn tracking with reasons, renewal reviews and member assessments",
      "Member app: workouts, exercise logs, body measurements, goals and streaks",
      "Leads and referrals",
      "Equipment maintenance, inventory, expenses, payroll and staff shifts",
      "Subscription billing for the gyms themselves, through Paystack",
      "Configurable analytics dashboards for every area of the business",
    ],
    decisions: [
      {
        title: "Every request is scoped to one gym",
        body: "A person can be an owner at one gym and a member at another. Middleware works out the active gym, role and membership from each request, and every service query is filtered by it, so no code path can read another gym's data by accident.",
      },
      {
        title: "Permissions instead of broad roles",
        body: "Access is defined with fine-grained permissions, such as viewing all members, only assigned members or only yourself. Instructors only see a member's phone number if that member has agreed to it, and that check happens in the query, not just in the UI.",
      },
      {
        title: "Prices come from the server",
        body: "Checkout charges the price stored in a server-side plan table. The price shown on the website is for display only, so changing a request can't buy a cheaper plan.",
      },
      {
        title: "Dashboards are configuration",
        body: "Each dashboard is described by a widget config, so adding a chart means adding a config entry instead of a new endpoint. That gave owners nine analytics areas without nine separate APIs.",
      },
      {
        title: "One API for web and mobile",
        body: "The browser dashboard uses Redis-backed session cookies and the mobile app uses JWTs. Both resolve to the same user before any business logic runs.",
      },
    ],
    stack: [
      { label: "API", items: ["Node.js", "Express 5", "Sequelize", "MySQL", "Redis sessions", "Joi", "JWT", "Paystack"] },
      { label: "Dashboard", items: ["React 19", "Vite", "Tailwind CSS 4", "Recharts"] },
      { label: "Mobile", items: ["React Native", "Expo Router", "Secure Store"] },
    ],
    flow: {
      caption: "Every request is scoped to one gym before it reaches business logic",
      nodes: [
        { label: "Dashboard · App", sub: "cookie · JWT" },
        { label: "Auth", sub: "identity" },
        { label: "Gym context", sub: "tenant · role", accent: true },
        { label: "Permissions", sub: "fine-grained" },
        { label: "Services", sub: "scoped queries" },
      ],
    },
  },
  {
    slug: "zignastay",
    name: "ZignaStay",
    family: "Zigna",
    kind: "Hotel property management system",
    status: { label: "In development", tone: "building" },
    oneLiner: "Hotel management software for reservations, the front desk, housekeeping, maintenance and the P&L.",
    pitch:
      "Small and mid-size hotels usually get their P&L from an accountant weeks after the month ends. ZignaStay runs the front desk and the back office in the same system, so the owner can see today's numbers today.",
    scale: [
      { value: "72", label: "data models" },
      { value: "16", label: "analytics domains" },
      { value: "4", label: "subscription tiers" },
    ],
    surfaces: ["REST API", "Operations dashboard"],
    screenshots: [
      {
        src: "/projects/zignastay/front-desk.png",
        alt: "ZignaStay front desk screen with QR check-ins, a check-in form and the list of in-house guests",
        width: 1613,
        height: 1001,
        device: "desktop",
      },
      {
        src: "/projects/zignastay/payments.png",
        alt: "ZignaStay payments analytics with revenue, refunds, deposits and trend charts",
        width: 1578,
        height: 1060,
        device: "desktop",
      },
    ],
    problem:
      "A single hotel booking touches a room, a guest, a payment, a housekeeping task and a line in the P&L. Most tools for small hotels only handle reservations, so everything else ends up on paper.",
    built: [
      "Reservations with waitlists, group bookings, packages and cancellation reasons",
      "Front desk: stays, check-in barcodes and third-party check-ins",
      "Guest CRM: loyalty points, corporate profiles, companions, documents and a blacklist",
      "Property model: branches → buildings → floors → rooms, with room types, features and downtime",
      "Housekeeping tasks and maintenance: work orders, preventive schedules, technicians and costs",
      "Procurement: requisitions, vendors, vendor payments and repairs",
      "Utility metering, expenses, staff shifts and payroll",
      "Daily snapshots that power the owner's P&L view",
    ],
    decisions: [
      {
        title: "Every booking change is recorded",
        body: "Each edit to a booking is saved as a field-level change (old value, new value, reason and who made it) in the same transaction as the edit. When a guest disputes something, the history is already there.",
      },
      {
        title: "Booking, room and history are saved together",
        body: "Availability is checked before a room is assigned. The booking, the room's status and the audit entries are committed in one transaction, so either all of them are saved or none are.",
      },
      {
        title: "One property model for every size of hotel",
        body: "Properties are modelled as branch, building, floor and room, so a 12-room guesthouse and a hotel with several branches use the same schema. Moving up to enterprise features is a plan upgrade, not a data migration.",
      },
      {
        title: "Plans are enforced on the server",
        body: "One feature map defines what each subscription tier includes. The API enforces it, and the dashboard uses the same map to build its navigation, so the two always agree.",
      },
    ],
    stack: [
      { label: "API", items: ["Node.js", "Express 5", "Sequelize", "MySQL", "Redis", "Joi"] },
      { label: "Dashboard", items: ["React 19", "Vite", "Tailwind CSS 4", "Recharts"] },
    ],
    flow: {
      caption: "A booking is one transaction across four concerns",
      nodes: [
        { label: "Reservation", sub: "dates · guest" },
        { label: "Availability", sub: "overlap check" },
        { label: "Transaction", sub: "all or nothing", accent: true },
        { label: "Room · Booking · Log", sub: "committed together" },
        { label: "Owner P&L", sub: "daily snapshots" },
      ],
    },
  },
  {
    slug: "vigil",
    essays: ["an-assistant-is-only-as-powerful-as-its-user"],
    name: "Vigil",
    family: "Zigna",
    kind: "Cross-product AI assistant",
    status: { label: "In development", tone: "building" },
    oneLiner: "An AI assistant that works across the Zigna products through their APIs, with the same permissions as the person using it.",
    pitch:
      "Owners don't want another dashboard. They want to ask \"why did we lose members last month?\" and get an answer. Vigil answers questions like that across the gym and hotel products, and can act on them, but it never has more access than the person asking.",
    scale: [
      { value: "~80", label: "product tools" },
      { value: "2", label: "products integrated" },
      { value: "3", label: "model tiers with fallback" },
      { value: "0", label: "direct database access" },
    ],
    surfaces: ["Assistant API", "Ops dashboard", "Embedded in ZignaLyft & ZignaStay"],
    screenshots: [
      {
        src: "/projects/vigil/chat-reply.png",
        alt: "Vigil answering a question about a gym's retention inside ZignaLyft",
        width: 410,
        height: 465,
        device: "phone",
      },
      {
        src: "/projects/vigil/inventory-answer.png",
        alt: "Vigil giving an inventory overview with stock value, sales movement and a table of low-stock items",
        width: 410,
        height: 980,
        device: "phone",
      },
    ],
    problem:
      "The quickest way to build an assistant is to give a model access to the database. It's also how you leak one customer's data to another, or let a chatbot do things a receptionist isn't allowed to do. Vigil had to be useful without becoming a security risk.",
    built: [
      "About 80 tools over the gym and hotel APIs, covering analytics, members, bookings, maintenance, inventory and more",
      "Saved conversations, feedback and usage tracking per business",
      "A classifier that sends each message to the cheapest model that can handle it",
      "Per-business limits, rate limiting, request tracing and error logging",
    ],
    decisions: [
      {
        title: "It only talks to product APIs",
        body: "Vigil never imports product code or reads a product database. Every tool calls a published product API, so it gets each product's validation, tenancy and permission checks automatically. If a product doesn't expose something, Vigil can't do it.",
      },
      {
        title: "The model only sees what the user is allowed to do",
        body: "Tools are filtered by the user's role before the model is called. A front-desk user's assistant can't suggest a payroll action, because the payroll tools aren't available to it.",
      },
      {
        title: "Simple questions go to cheaper models",
        body: "Greetings and simple counts go to a small, fast model. Questions that span products go to a stronger one. If a model fails, the request moves up to the next tier instead of returning an error.",
      },
    ],
    stack: [
      { label: "Service", items: ["Node.js", "Express", "Sequelize", "Tool registry", "OpenAI-compatible providers"] },
      { label: "Dashboard", items: ["React", "Vite"] },
    ],
    flow: {
      caption: "The assistant never has more access than the person using it",
      nodes: [
        { label: "User", sub: "role · business" },
        { label: "Classifier", sub: "low · med · high" },
        { label: "Role-filtered tools", sub: "~80", accent: true },
        { label: "Model tier", sub: "with fallback" },
        { label: "Product APIs", sub: "never the DB" },
      ],
    },
    repo: "https://github.com/OlutobiOgunsola/zigna-vigil",
  },
  {
    slug: "ducent",
    essays: ["dont-let-the-model-pick-your-ids"],
    name: "Ducent",
    kind: "Trust layer for Nigerian e-commerce",
    status: { label: "Pre-launch", tone: "building" },
    oneLiner: "A marketplace where a vendor's reputation comes from verified transactions instead of testimonials.",
    pitch:
      "Buying from a vendor you found on Instagram is a gamble, and \"what I ordered vs. what I got\" posts are everywhere for a reason. Ducent shows buyers a verified history for each business, and gives honest vendors a reputation that can't be faked or damaged by a competitor's fake reviews.",
    scale: [
      { value: "46", label: "data models" },
      { value: "3", label: "background workers" },
      { value: "29", label: "domain services" },
    ],
    surfaces: ["REST API", "Web app", "Discovery operator tooling"],
    problem:
      "Trust in Nigerian online shopping runs on screenshots and word of mouth. A trust platform starts with no vendors and no buyers, and people will try to game any score it shows. Both problems had to be planned for from the start.",
    built: [
      "Vendor and business profiles with verification and supporting documents",
      "Buyer and vendor transactions with comments, documents and reviews",
      "A versioned trust score, calculated per transaction, that shows how it was reached",
      "Natural-language search: \"tailor in Yaba\" → structured intent → ranked results",
      "A discovery pipeline that adds businesses from public sources, following each platform's rules",
    ],
    decisions: [
      {
        title: "Trust scores are versioned and explained",
        body: "Every score stores the version of the formula and a breakdown of how it was calculated. A background worker computes it, and if the worker falls behind, the score is calculated when it's read and saved once. Changing the formula never quietly rewrites old scores.",
      },
      {
        title: "The AI never chooses a database ID",
        body: "The model only extracts what the user is looking for and where. That is checked against a live list of categories and locations before it reaches a query. If the AI provider is down, a rule-based extractor takes over, so search still works.",
      },
      {
        title: "Discovery checks the rules before it runs",
        body: "A policy check runs before any external call or write. Platforms that don't allow automation are handled manually, API quotas are budgeted and never retried, and running a job twice never creates duplicates.",
      },
      {
        title: "Duplicates are only merged on strong evidence",
        body: "Matching source IDs always merge, and matching phone numbers or websites are strong signals. A similar name alone never merges, because \"ABC Fashion\" could be a dozen different businesses. Unclear matches go to a person.",
      },
    ],
    stack: [
      { label: "API", items: ["Node.js", "Express 5", "Sequelize", "MySQL", "Joi", "Background workers", "node:test"] },
      { label: "AI", items: ["Provider-neutral LLM layer", "Deterministic fallback"] },
      { label: "Web", items: ["React", "Vite", "Tailwind CSS"] },
    ],
    flow: {
      caption: "Reputation comes from evidence, never from typed-in claims",
      nodes: [
        { label: "Transaction", sub: "buyer ↔ vendor" },
        { label: "Evidence", sub: "docs · reviews" },
        { label: "Trust engine", sub: "versioned", accent: true },
        { label: "Score + breakdown", sub: "explainable" },
        { label: "Search ranking" },
      ],
    },
  },
  {
    slug: "sentinel",
    essays: ["double-entry-for-developers"],
    name: "Sentinel",
    kind: "Estate management platform",
    status: { label: "In development", tone: "building" },
    oneLiner: "Gate access, levies and community tools for residential estates, with a WhatsApp bot that sends visitor codes.",
    pitch:
      "Lagos estates run security with paper logbooks and collect dues through bank-transfer screenshots. Sentinel replaces both. Residents get visitor codes from WhatsApp, security scans them at the gate, and every payment goes into a proper ledger.",
    scale: [{ value: "28", label: "data models" }],
    surfaces: ["Installable web app (PWA)", "WhatsApp bot", "Security gate view"],
    problem:
      "Estate security often depends on a guard trusting a phone call, and estate finances depend on someone matching bank transfers to houses by hand. Both break without anyone noticing until something goes wrong.",
    built: [
      "Access codes: residents create and cancel them, and security scans them to check visitors in and out",
      "A WhatsApp bot that sends a ready-to-forward access code in one message",
      "Levies and dues with online payment, a double-entry ledger, a trial balance and a list of defaulters",
      "Estate-wide alerts and a vendor directory where residents recommend and admins approve",
    ],
    decisions: [
      {
        title: "Balances come from a double-entry ledger",
        body: "Every payment posts a debit and a credit, and balances and the trial balance are calculated from those entries. Money can't appear or disappear without a matching entry.",
      },
      {
        title: "Payment webhooks are verified and applied once",
        body: "A payment webhook is only accepted with a valid HMAC signature, and it's only applied if the payment hasn't been settled yet, so a repeated webhook can't post to the ledger twice.",
      },
      {
        title: "One application",
        body: "It's a single Next.js App Router app with shared types from the database to the UI. For a product this size, a separate API service would add work without adding anything useful.",
      },
    ],
    stack: [
      { label: "App", items: ["Next.js App Router", "React 19", "TypeScript (strict)", "Tailwind CSS 4", "PWA"] },
      { label: "Data", items: ["PostgreSQL", "Prisma", "Zod"] },
      { label: "Integrations", items: ["WhatsApp bot", "Paystack webhooks"] },
    ],
    flow: {
      caption: "A visitor code from WhatsApp to the gate",
      nodes: [
        { label: "Resident", sub: "WhatsApp" },
        { label: "Bot", sub: "tool call" },
        { label: "Access code", sub: "scoped · revocable", accent: true },
        { label: "Gate scan", sub: "check in / out" },
        { label: "Audit log" },
      ],
    },
  },
  {
    slug: "leadmonkey",
    name: "LeadMonkey",
    kind: "Lead research and outreach tool",
    status: { label: "In use · local tool", tone: "live" },
    oneLiner: "A local tool that finds small businesses whose AI-built websites need a developer, and drafts outreach to each one in the owner's language.",
    pitch:
      "I rebuild websites that people made with tools like Lovable, Bolt and Framer. LeadMonkey finds those sites across Italy, Germany, Portugal, Spain and Greece, checks each one for a public contact email, and turns the specific problems on each page into a short email in the local language that I review and send.",
    scale: [
      { value: "10", label: "countries, in priority order" },
      { value: "9", label: "niches searched" },
      { value: "21", label: "qualified leads from the first run" },
    ],
    surfaces: ["Local web UI", "CLI driven by Claude Code", "SQLite database"],
    screenshots: [
      {
        src: "/projects/leadmonkey/lead-table.png",
        alt: "LeadMonkey lead table with country, niche, website, email and status columns, a DIY badge and a needs-message badge (demo data)",
        width: 1440,
        height: 530,
        device: "desktop",
      },
      {
        src: "/projects/leadmonkey/lead-detail.png",
        alt: "An expanded LeadMonkey lead showing three site issues, the Italian outreach email and its English version, each with a copy button (demo data)",
        width: 1440,
        height: 555,
        device: "desktop",
      },
    ],
    problem:
      "Generic lead lists don't work for this. The useful signal is narrow: a small business whose site still runs on a builder subdomain, shares the builder's default preview image, or has no page title. Finding those by hand takes hours, and a cold email only lands if it names something real on the person's own site, in their language.",
    built: [
      "Search rotation: every query is logged, and each run is handed the least-used cities and the wording already tried for each niche and country",
      "An ingest step that fetches each candidate over HTTP, falls back to a headless browser for JavaScript-only builder sites, and stores an outline of the page: title, meta tags, Open Graph image, headings, forms and builder fingerprints",
      "Email extraction only from the site itself: mailto links, footer and contact sections, and contact, about and Impressum pages, including Cloudflare-obfuscated addresses",
      "Deduplication by site and business name, with rejected sites remembered for 30 days",
      "Daily and per-niche caps, so leads spread across countries in priority order",
      "A playbook Claude Code follows to search, judge fit, find two or three concrete issues and write the email in the local language, plus an English copy",
      "Checks that refuse a draft without real issues, a subject line or a sign-off, or with placeholders left in",
      "A local UI with filters, a copy button for each message, and status and notes that save as you type",
    ],
    decisions: [
      {
        title: "The model writes, the code verifies",
        body: "Claude finds candidates and writes the issues and emails, but it never handles an email address. Addresses are extracted from the site by the ingest step, so a contact can't be invented. Every draft passes checks in code before it's stored.",
      },
      {
        title: "No API key, by design",
        body: "Every keyless search endpoint I tried blocked automated requests. So search and writing run inside Claude Code, and the app owns everything that has to be deterministic: fetching, extraction, dedupe, caps and storage.",
      },
      {
        title: "Issues come from the page outline",
        body: "Each lead keeps a compact outline of what its site actually shows. An issue has to point at something in that outline, like a page declared as English while written in Italian, which keeps every email specific and checkable.",
      },
      {
        title: "Path-aware site identity",
        body: "Most builder sites live on a subdomain, but Wix and GitHub Pages sites live under a path. Site keys include the first path segment on those hosts, so two different practices on the same host are never merged as duplicates.",
      },
      {
        title: "Repeats are the real limit",
        body: "The same search returns the same sites. Logging every query and handing back the least-used cities and past wordings is what keeps a 30-a-day target workable after the first week.",
      },
    ],
    stack: [
      { label: "App", items: ["Node.js", "Express 5", "better-sqlite3", "cheerio", "Playwright"] },
      { label: "UI", items: ["HTML, CSS and JavaScript", "No build step"] },
      { label: "AI", items: ["Claude Code", "Playbook-driven CLI"] },
    ],
    flow: {
      caption: "Claude Code searches and writes. The app fetches, verifies and stores.",
      nodes: [
        { label: "Claude Code", sub: "web search" },
        { label: "Ingest", sub: "log · fetch" },
        { label: "Extract", sub: "email · outline", accent: true },
        { label: "Dedupe & caps", sub: "SQLite" },
        { label: "Drafts", sub: "checked" },
        { label: "Local UI", sub: "copy · track" },
      ],
      branch: { from: 2, label: "Rejected", sub: "skipped for 30 days" },
    },
    privateRepo: true,
  },
  {
    slug: "plugin-pilot",
    name: "Plugin Pilot",
    kind: "Mixing assistant for music producers",
    status: { label: "In use · local tool", tone: "live" },
    oneLiner: "A mix guide that fixes sounds step by step using the plugins already installed on your computer.",
    pitch:
      "Mixing advice online assumes you own the plugin in the video. Plugin Pilot scans the AU and VST3 plugins on a Mac, then answers \"what's wrong and how do I fix it\" with steps that name a plugin you actually have, and settings to start from.",
    scale: [
      { value: "405", label: "plugins in the knowledge base" },
      { value: "32", label: "sound types" },
      { value: "29", label: "problems with step-by-step fixes" },
    ],
    surfaces: ["Local app (Python server)", "Static web build", "macOS plugin scanner"],
    screenshots: [
      {
        src: "/projects/plugin-pilot/fix-a-sound.png",
        alt: "Plugin Pilot's Fix a sound screen, listing vocals, guitars, bass, drums, keys, strings and whole-mix sources to choose from",
        width: 1440,
        height: 770,
        device: "desktop",
      },
      {
        src: "/projects/plugin-pilot/fix-steps.png",
        alt: "Plugin Pilot's fix for a muddy lead vocal: three steps naming Pro-Q 4 with alternatives, a check for whether it worked, and what not to overdo",
        width: 1440,
        height: 830,
        device: "desktop",
      },
    ],
    problem:
      "Producers collect hundreds of plugins and still reach for the same few, because nothing connects a problem like a muddy vocal to the right tool in their own library, or to the right place in the chain.",
    built: [
      "A scanner that reads AU and VST3 folders with macOS's built-in osascript, with nothing to install",
      "Fix a sound: pick what you're mixing and what's wrong, and get ordered steps with the best matching plugin you own, alternatives, frequency ranges, how to check it worked and what not to overdo",
      "A knowledge base of 405 plugins tagged by category and character, with longer notes for 149 of them",
      "A chain builder and pair check that flag ordering and pairing problems in an insert chain",
      "My Songs: a staged mix plan for each song, from prep and balance through buses and master, built from each track's role and the song's genre",
      "Compare: loudness (ITU-R BS.1770), band balance, width and mono compatibility against a reference track, measured in the browser",
      "A mix agent that answers free-text questions with Claude, using the user's own API key and recommending only plugins in their library",
    ],
    decisions: [
      {
        title: "Steps name a kind of tool, not a product",
        body: "Each fix step asks for a category, like a dynamic EQ or an opto compressor, and the engine picks the best match from the user's library. One set of fixes works for any plugin collection.",
      },
      {
        title: "Signal-flow order is data",
        body: "Every plugin category has a position in a typical insert chain. Chain checks and the staged song plan read that order instead of hard-coding rules per plugin.",
      },
      {
        title: "Audio never leaves the machine",
        body: "Reference comparison decodes and measures audio in the browser, and only the measurements are saved. The agent calls Anthropic directly from the browser with the user's key, so no server ever holds keys or audio.",
      },
      {
        title: "Two ways to run, one codebase",
        body: "A small Python server adds the one-click scan and saves songs as JSON files in the user's Documents folder. The same app builds to a static site that keeps data in IndexedDB, for anyone who just wants it in a browser.",
      },
    ],
    stack: [
      { label: "App", items: ["JavaScript", "Web Audio API", "IndexedDB"] },
      { label: "Local", items: ["Python", "osascript (JXA) scanner"] },
      { label: "AI", items: ["Claude via the Anthropic SDK", "User-supplied API key"] },
    ],
    flow: {
      caption: "From a problem to a chain built from your own plugins",
      nodes: [
        { label: "Scan", sub: "AU · VST3" },
        { label: "Library", sub: "matched to KB" },
        { label: "Problem", sub: "sound · issue" },
        { label: "Engine", sub: "category → plugin", accent: true },
        { label: "Steps", sub: "settings · checks" },
        { label: "Chain", sub: "order check" },
      ],
    },
    privateRepo: true,
  },
  {
    slug: "go-systems-lab",
    essays: ["a-goroutine-per-connection"],
    name: "Gosh",
    kind: "Systems programming in Go",
    status: { label: "Active · learning in public", tone: "lab" },
    oneLiner: "Rebuilding Unix tools and network servers in Go from scratch, to understand what my services run on.",
    pitch:
      "I've spent years building on top of runtimes and frameworks. Gosh is where I learn what's underneath them. It's small and written from scratch on purpose: a Unix-style command toolkit and a concurrent TCP chat server, built one piece at a time.",
    scale: [],
    surfaces: ["gosh: Unix-style CLI", "gosh-chat: TCP server"],
    problem:
      "It's hard to reason about a Node service under load without understanding processes, file descriptors, sockets and concurrency. Go is a clean place to learn those properly, and it's the language I want to use for more of my backend tooling.",
    built: [
      "gosh: a command registry that maps names to handlers behind a small Executable interface, with head and wc implemented",
      "Typed errors: an unknown command is its own error type, not a string",
      "gosh-chat: a TCP server that handles concurrent clients with one goroutine per connection",
    ],
    decisions: [
      {
        title: "Interfaces between the parts",
        body: "Every command implements a one-method Executable interface, so adding a tool means adding a handler. The runner never changes.",
      },
      {
        title: "Errors are values",
        body: "Errors are returned and typed instead of thrown, so the caller decides what's fatal. I use the same approach for error types in production APIs.",
      },
      {
        title: "No shared state to start with",
        body: "Each connection has its own goroutine and buffer. Broadcasting comes next, using channels rather than locks.",
      },
    ],
    stack: [{ label: "Go", items: ["Standard library only", "net", "os", "goroutines"] }],
    flow: {
      caption: "gosh-chat today, and where it's going",
      nodes: [
        { label: "Clients", sub: "TCP :9001" },
        { label: "Listener", sub: "accept loop" },
        { label: "Goroutine / conn", sub: "isolated", accent: true },
        { label: "Hub", sub: "channels (next)" },
        { label: "Broadcast", sub: "next" },
      ],
    },
    next: [
      "A broadcast hub with channels and named rooms",
      "Graceful shutdown with context cancellation",
      "Streaming reads with bufio instead of loading whole files",
      "Pipes between gosh commands",
      "Benchmarks against equivalent Node.js implementations",
    ],
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
