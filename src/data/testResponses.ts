import type { TemplateId } from '../types';

// Hardcoded test responses per template. Picked by simple keyword overlap;
// fallback per template covers anything else.

export type TestResponse = {
  thinking: string[]; // shown as expandable "thinking" section above the answer
  reply: string;     // the final answer (markdown-ish but rendered as plain text whitespace-pre-wrap)
  // Ordered node ids the agent traverses; mapped over the thinking-reveal
  // duration so the active node pulses on the canvas as the agent "executes".
  nodeSequence?: string[];
};

// A small mocked record the agent "has access to" — shown in the Context panel
// next to the test chat so reviewers see the data the agent is operating on.
export type ContextItem = {
  label: string;
  body: string;
  badge?: string; // small tag like "Unread" / "Urgent"
  badgeTone?: 'default' | 'warn' | 'spam' | 'info';
};

type TemplateTest = {
  intro: string;
  suggestions: string[];
  routes: { keywords: string[]; response: TestResponse }[];
  fallback: TestResponse;
  contextTitle: string;
  contextSubtitle: string;
  context: ContextItem[];
};

// ---- Travel ----

const TRAVEL: TemplateTest = {
  intro:
    "Tell the agent what trip you want to plan. The lead Travel Coordinator will fan out to flight, hotel, and itinerary subagents and merge their results.",
  suggestions: [
    'Plan a 5-day trip to Tokyo for 2 people in October',
    'Weekend getaway in Lisbon under $1500',
    'Rebook my Tokyo flight one day later',
  ],
  routes: [
    {
      keywords: ['tokyo', 'japan'],
      response: {
        thinking: [
          'Decomposing request: 5 days, 2 travellers, October, Tokyo.',
          'Reading travel preferences from Memory store: window seats, walkable hotels, food-forward.',
          'Fanning out to three specialist subagents in parallel:',
          '   • Flight Search  → JFK ⇄ HND, mid-October, 2 pax',
          '   • Hotel Booking  → Tokyo, 5 nights, walkable to transit',
          '   • Itinerary Builder → 5-day plan, food + culture lean',
          'Subagents returned. Merging into a single plan.',
          'Confidence 0.86. Returning to user.',
        ],
        reply:
          "Here's a 5-day Tokyo trip for two in mid-October:\n\n" +
          '• **Flights** — JFK ⇄ HND, JAL 5/8 Oct, $1,420 pp (premium economy, window seats per your prefs)\n' +
          '• **Hotel** — Hotel Niwa Tokyo, 5 nts, $230/nt (Akihabara, JR-walkable)\n' +
          '• **Day-by-day**\n' +
          '   1. Arrive HND → check in → ramen in Shinjuku\n' +
          '   2. Tsukiji breakfast → teamLab Planets → Asakusa Senso-ji\n' +
          '   3. Day trip to Hakone (onsen + Mt. Fuji views if clear)\n' +
          '   4. Shibuya/Harajuku → Meiji Shrine → izakaya hop\n' +
          '   5. Tokyo Skytree → Akihabara → flight home\n\n' +
          'Total: **$5,150** for two. Want to swap any leg, push to Q4, or add a Kyoto day?',
        nodeSequence: ['lead', 'lead', 'sub-flight', 'sub-hotel', 'sub-itinerary', 'lead', 'ifelse', 'end'],
      },
    },
    {
      keywords: ['lisbon', 'portugal'],
      response: {
        thinking: [
          'Decomposing: weekend (3 days), Lisbon, $1,500 budget for two.',
          'Flight Search → mid-week shoulder fares, $310 RT pp.',
          'Hotel Booking → Memmo Alfama, $190/nt × 2 nts = $380.',
          'Itinerary Builder → tile-tour + Belém + fado night.',
          'Total $1,290 — under budget. Returning.',
        ],
        reply:
          'Lisbon weekend for two, $1,290 total:\n\n' +
          '• **Flights** — TAP, $310 pp RT\n' +
          '• **Hotel** — Memmo Alfama, 2 nts, $380\n' +
          '• **Day 1** — Alfama walking + sunset at Miradouro da Senhora do Monte\n' +
          '• **Day 2** — Belém (pastéis + tower + monastery), fado at Mesa de Frades\n' +
          '• **Day 3** — Time Out Market brunch, return\n\n' +
          'Want a vegetarian-friendly food list or shift to a beachfront stay in Cascais?',
        nodeSequence: ['lead', 'sub-flight', 'sub-hotel', 'sub-itinerary', 'lead', 'ifelse', 'end'],
      },
    },
    {
      keywords: ['rebook', 'change', 'reschedule', 'one day later', 'push'],
      response: {
        thinking: [
          'User wants to modify an existing trip. Looking up active trips in Memory store.',
          'Found: Tokyo, Oct 5-9, 2 pax (last planned 2026-05-10).',
          'Flight Search → outbound 5 Oct shifted to 6 Oct: same fare, +$45 change fee.',
          'Hotel Booking → night 1 cancelled, refund $230. Itinerary shifts forward.',
          'Net cost change: -$185. Returning summary.',
        ],
        reply:
          "Pushed your Tokyo trip back one day:\n\n" +
          '• **Outbound flight** — now 6 Oct (was 5 Oct), +$45 change fee\n' +
          '• **Hotel** — first night refunded, $230 credited\n' +
          '• **Itinerary** — shifted; teamLab moved to day 2, Hakone day 3\n\n' +
          'Net: **−$185**. Confirm to apply?',
        nodeSequence: ['lead', 'sub-flight', 'sub-hotel', 'sub-itinerary', 'lead', 'ifelse', 'end'],
      },
    },
  ],
  fallback: {
    thinking: [
      'Decomposing the trip request into flight, hotel, itinerary tasks.',
      'Three subagents running in parallel on a shared filesystem.',
      'Synthesizing results from each specialist.',
    ],
    reply:
      "I'd plan this as a fan-out to three subagents — flight, hotel, itinerary — then merge. The real agent would call live booking APIs; this prototype returns a canned plan.",
    nodeSequence: ['lead', 'sub-flight', 'sub-hotel', 'sub-itinerary', 'lead'],
  },
  contextTitle: 'Travel preferences',
  contextSubtitle: "What the agent reads from your Memory store before planning.",
  context: [
    { label: 'Seating', body: 'Window seats; aisle if not available.' },
    { label: 'Hotel style', body: 'Walkable, near transit, ≤$250/nt unless flagged.' },
    { label: 'Diet', body: 'Adventurous food; flag spicy.' },
    { label: 'Loyalty', body: 'Star Alliance, Marriott Bonvoy.' },
    { label: 'Active trips', body: 'Tokyo · Oct 5-9 · 2 pax (planned 2026-05-10).' },
  ],
};

// ---- Customer Support ----

const SUPPORT: TemplateTest = {
  intro:
    "You're the customer in this test. Send a support request and watch the Triage classifier route to refund / technical / general.",
  suggestions: [
    'My order #4421 never arrived',
    "I can't log in — getting a 403 error",
    'How do I update my billing address?',
  ],
  routes: [
    {
      keywords: ['order', 'refund', 'arrive', 'never received', "didn't arrive"],
      response: {
        thinking: [
          'Classify intent → refund (confidence 0.92).',
          'Routing to Refund agent branch.',
          'Reading customer history Memory store for order #4421.',
          '   • Shipped 2026-05-04, marked delivered 2026-05-08.',
          '   • Customer in good standing, 7 prior orders, 0 refunds.',
          'Drafting empathetic response with full refund.',
          'Guardrails check (PII, harmful) → pass. Returning to user.',
        ],
        reply:
          "Sorry to hear that — order #4421 was marked delivered yesterday but you say it never arrived. I've initiated a full refund of **$89.99** to your original payment method; expect it in 3-5 business days. I'm also flagging the carrier for follow-up. Want me to ship a replacement at no charge?",
        nodeSequence: ['classify', 'classify', 'memory', 'memory', 'agent-refund', 'agent-refund', 'end'],
      },
    },
    {
      keywords: ['log in', 'login', '403', 'access', 'error', 'password'],
      response: {
        thinking: [
          'Classify intent → technical (confidence 0.88).',
          'Routing to Technical agent branch.',
          'File search across product docs for "403" and "login flow".',
          '   • Top hit: docs/auth/troubleshoot.md — known issue with stale OAuth refresh tokens.',
          'Guardrails check → pass.',
        ],
        reply:
          'A 403 on login usually means a stale refresh token. Try this:\n\n' +
          '1. Sign out fully (top-right menu → Sign out)\n' +
          '2. Clear cookies for `app.example.com`\n' +
          '3. Sign in again — you should hit a fresh OAuth flow\n\n' +
          "If it still fails, share the URL and the request ID from DevTools → Network → the 403 response. I'll escalate to engineering.",
        nodeSequence: ['classify', 'classify', 'fileSearch', 'agent-tech', 'guardrails', 'end'],
      },
    },
  ],
  fallback: {
    thinking: [
      'Classifying intent → general (no strong refund/technical signal).',
      'Routing to General agent branch.',
      'Drafting friendly response.',
    ],
    reply:
      "Happy to help. Could you share a bit more — order number, account email, or a screenshot of what you're seeing?",
    nodeSequence: ['classify', 'agent-general', 'end'],
  },
  contextTitle: 'Customer record',
  contextSubtitle: 'Pulled from the Memory store at the start of the session.',
  context: [
    { label: 'Customer', body: 'Eric S. · joined 2024-06 · 7 orders · 0 refunds' },
    { label: 'Recent order', body: '#4421 · $89.99 · shipped 2026-05-04 · marked delivered 2026-05-08', badge: 'Open issue', badgeTone: 'warn' },
    { label: 'Subscription', body: 'Pro plan · auto-renew · next bill 2026-05-28' },
    { label: 'Sentiment', body: 'Neutral — usually patient; one mild complaint last quarter.' },
  ],
};

// ---- Email Assistant ----

const EMAIL: TemplateTest = {
  intro:
    "Ask the agent to do something with your inbox. It has Gmail access (mocked here) — try a triage, a reply, or a cleanup.",
  suggestions: [
    'Summarize my unread emails',
    'Draft a reply to Sarah about the Q3 status',
    "Accept the meeting invite from Bob",
    'Clean up the spam in my inbox',
  ],
  routes: [
    {
      keywords: ['summarize', 'summary', 'unread', 'what did i miss', 'what came in', 'inbox'],
      response: {
        thinking: [
          'Pulling unread messages from Gmail (4 unread).',
          'Triaging each:',
          '   • Sarah (CEO) → request',
          '   • Bob (eng) → meeting',
          '   • AI Newsletter → info-sharing',
          '   • noreply@grants → spam',
          'Drafting per-email summaries; deferring spam from summary.',
        ],
        reply:
          'You have **3 messages worth seeing** (1 spam ignored):\n\n' +
          '• **Sarah Chen (CEO)** — *Q3 status update needed by Friday*. Wants 3 bullets: shipped, blockers, next-week priorities.\n' +
          '• **Bob Wu (eng)** — *Sync Tue 2pm about the search rewrite?* You\'re free.\n' +
          '• **The Agent Brief** — newsletter with 4 items: multi-agent GA, dreaming research preview, memory stores, eval primitives.\n\n' +
          "Want me to draft replies to Sarah and Bob, or just one?",
        nodeSequence: ['triage', 'triage', 'skill-summary', 'end'],
      },
    },
    {
      keywords: ['sarah', 'q3', 'status', 'reply to sarah', 'draft', 'ceo'],
      response: {
        thinking: [
          'Lookup: most-recent thread from Sarah Chen → "Q3 status update needed by Friday".',
          'Triage → request (confidence 0.94).',
          'Reading prior reply tone in this thread → brisk, structured, first-name signoff.',
          'Drafting via draft_reply Skill.',
          'Routing to User approval before sending.',
        ],
        reply:
          'Drafted (awaiting your approval):\n\n' +
          '> Hi Sarah,\n' +
          '>\n' +
          "> Will have the Q3 status to you by 5pm Friday. I'll cover: (1) shipped this week, (2) blockers, (3) next-week priorities. Let me know if you want anything else included.\n" +
          '>\n' +
          '> — Eric\n\n' +
          '👉 Approve to send, or edit the draft.',
        nodeSequence: ['triage', 'skill-draft', 'approval', 'end'],
      },
    },
    {
      keywords: ['bob', 'meeting', 'tuesday', 'tue', '2pm', 'accept', 'meet', 'sync', 'invite'],
      response: {
        thinking: [
          'Lookup: most-recent thread from Bob Wu → meeting invite, Tue 2-3pm.',
          'Triage → meeting (confidence 0.95).',
          'Calendar check → Tue 2-3pm is free.',
          'schedule_meeting Skill → drafting accept + sending invite.',
          'Routing to User approval.',
        ],
        reply:
          'Calendar is free Tuesday 2-3pm. Drafted (awaiting approval):\n\n' +
          '> Sounds good — Tue 2pm works. Sending an invite. Anything specific to prep?\n\n' +
          '👉 Approve to send the reply + calendar invite.',
        nodeSequence: ['triage', 'skill-schedule', 'approval', 'end'],
      },
    },
    {
      keywords: ['spam', 'clean up', 'cleanup', 'delete', 'trash', 'junk'],
      response: {
        thinking: [
          'Scanning inbox for spam-like messages.',
          'Found 1 candidate:',
          '   • noreply@grants-now.biz → "🎉 Pre-qualified for $50k grant!!" (confidence 0.97)',
          'Triage → spam → delete (skip approval, skip reply).',
          'Moving to trash.',
        ],
        reply:
          '🗑️ Moved 1 message to trash:\n\n' +
          '• "🎉 Pre-qualified for $50k grant!!" from noreply@grants-now.biz\n\n' +
          'No reply sent. (Want me to also unsubscribe from the AI newsletter, or keep it?)',
        nodeSequence: ['triage', 'end'],
      },
    },
    {
      keywords: ['important', 'priority', 'urgent', 'flag'],
      response: {
        thinking: [
          'Triaging all unread by priority:',
          '   • Sarah (CEO) → request, time-bound (Friday) → HIGH',
          '   • Bob (eng) → meeting, this week → MEDIUM',
          '   • Newsletter → info → LOW',
          '   • Grant scam → spam → IGNORE',
        ],
        reply:
          'Two need your attention:\n\n' +
          '• 🔴 **Sarah Chen** — Q3 status due Friday. Want me to draft?\n' +
          '• 🟡 **Bob Wu** — meeting accept needed (Tue 2pm). Want me to send the accept?\n\n' +
          '(1 newsletter can wait; 1 spam already in trash.)',
        nodeSequence: ['triage', 'skill-draft', 'skill-schedule', 'skill-summary', 'end'],
      },
    },
  ],
  fallback: {
    thinking: [
      'Interpreting request as inbox-related; classifier yielded no strong intent.',
      'Defaulting to summarize unread.',
    ],
    reply:
      "I wasn't sure what you wanted, so I summarized your unread. Try `summarize`, `draft a reply to <person>`, `accept the meeting`, or `clean up spam`.",
    nodeSequence: ['triage', 'skill-summary', 'end'],
  },
  contextTitle: 'Mock inbox · Gmail',
  contextSubtitle: 'What the agent sees when you ask it to do inbox work.',
  context: [
    {
      label: 'Sarah Chen (CEO)',
      body: '"Q3 status update needed by Friday — please send 3 bullets."',
      badge: 'Unread · Important',
      badgeTone: 'warn',
    },
    {
      label: 'Bob Wu (eng)',
      body: '"Can we sync Tue 2pm about the search rewrite?"',
      badge: 'Unread · Meeting',
      badgeTone: 'info',
    },
    {
      label: 'The Agent Brief',
      body: '"5 trends in AI agents this month — multi-agent GA, dreaming preview…"',
      badge: 'Unread · Newsletter',
    },
    {
      label: 'noreply@grants-now.biz',
      body: '"🎉 You are pre-qualified for a $50,000 grant!! Click here."',
      badge: 'Spam',
      badgeTone: 'spam',
    },
  ],
};

// ---- Blank ----

const BLANK: TemplateTest = {
  intro:
    "This is a blank Sonnet 4.6 agent. Ask it anything. To make it more useful, switch to Build and add Skills, Memory, or Tools.",
  suggestions: [
    'Hello! What can you do?',
    'Write a haiku about agent builders',
    'Explain what an agent is in 2 sentences',
  ],
  routes: [],
  fallback: {
    thinking: [
      'Single-agent flow. No tools or memory configured.',
      'Generating response with the system prompt as-is.',
    ],
    reply:
      "I'm a blank Claude agent in this prototype. I'd respond using whatever system prompt you set on the Agent node. Drag in Memory, Skills, or Guardrails (Build mode) to teach me more.",
    nodeSequence: ['agent', 'agent', 'end'],
  },
  contextTitle: 'Agent context',
  contextSubtitle: 'Nothing wired up yet.',
  context: [
    { label: 'System prompt', body: 'You are a helpful assistant.' },
    { label: 'Tools', body: '— none —' },
    { label: 'Memory', body: '— none —' },
  ],
};

export const TEMPLATE_TESTS: Record<TemplateId, TemplateTest> = {
  travel: TRAVEL,
  support: SUPPORT,
  email: EMAIL,
  blank: BLANK,
};

// Pick the best matching response for an input, falling back if nothing matches.
export function pickTestResponse(templateId: TemplateId | null, input: string): TestResponse {
  const tpl = TEMPLATE_TESTS[templateId ?? 'blank'];
  const p = input.toLowerCase();
  let best: { score: number; response: TestResponse } | null = null;
  for (const route of tpl.routes) {
    const score = route.keywords.filter((k) => p.includes(k.toLowerCase())).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { score, response: route.response };
    }
  }
  return best?.response ?? tpl.fallback;
}
