import type { Graph, TemplateId } from '../types';

// Hardcoded template graphs. Each one's shape highlights one May 2026 primitive:
// - travel:  multi-agent orchestration (lead + 3 parallel subagents)
// - support: Memory store + File search as composable nodes
// - email:   Skills as composable nodes + User approval

// All templates flow top → bottom. Nodes are positioned with column x
// values that roughly center under their parent and row y values stepping
// down by ~140-160px per logical "level".

const TRAVEL: Graph = {
  nodes: [
    { id: 'start',         type: 'start',    position: { x: 460, y: 20 },  data: { kind: 'start', label: 'Start' } },
    {
      id: 'lead',
      type: 'agent',
      position: { x: 400, y: 140 },
      data: {
        kind: 'agent',
        label: 'Travel Coordinator',
        prompt: "You orchestrate a travel-planning workflow. Decompose the user's trip request into flight, hotel, and itinerary work; delegate to specialists; synthesize results.",
        model: 'claude-opus-4-7',
        tools: ['web_search'],
        dreaming: true,
      },
    },
    // Three specialist subagents fan out horizontally below the coordinator.
    {
      id: 'sub-flight',
      type: 'subagent',
      position: { x: 100, y: 320 },
      data: {
        kind: 'subagent', label: 'Flight Search',
        prompt: 'Search flight options for the requested dates and destination.',
        model: 'claude-sonnet-4-6', tools: ['web_search'],
      },
    },
    {
      id: 'sub-hotel',
      type: 'subagent',
      position: { x: 410, y: 320 },
      data: {
        kind: 'subagent', label: 'Hotel Booking',
        prompt: 'Find lodging matching budget and preferences.',
        model: 'claude-sonnet-4-6', tools: ['mcp:bookings'],
      },
    },
    {
      id: 'sub-itinerary',
      type: 'subagent',
      position: { x: 720, y: 320 },
      data: {
        kind: 'subagent', label: 'Itinerary Builder',
        prompt: 'Build a day-by-day itinerary using the selected flights and hotel.',
        model: 'claude-sonnet-4-6', tools: [],
      },
    },
    {
      id: 'ifelse',
      type: 'ifelse',
      position: { x: 410, y: 500 },
      data: { kind: 'ifelse', label: 'Have plan?', branches: ['yes', 'no'] },
    },
    { id: 'end', type: 'end', position: { x: 470, y: 660 }, data: { kind: 'end', label: 'End' } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'lead' },
    { id: 'e2', source: 'lead', target: 'sub-flight',    label: 'parallel' },
    { id: 'e3', source: 'lead', target: 'sub-hotel',     label: 'parallel' },
    { id: 'e4', source: 'lead', target: 'sub-itinerary', label: 'parallel' },
    { id: 'e5', source: 'sub-flight',    target: 'ifelse' },
    { id: 'e6', source: 'sub-hotel',     target: 'ifelse' },
    { id: 'e7', source: 'sub-itinerary', target: 'ifelse' },
    { id: 'e8', source: 'ifelse', sourceHandle: 'yes', target: 'end', label: 'yes' },
  ],
};

const SUPPORT: Graph = {
  nodes: [
    { id: 'start',    type: 'start',    position: { x: 460, y: 20 },  data: { kind: 'start', label: 'Start' } },
    {
      id: 'classify', type: 'classify',
      position: { x: 400, y: 140 },
      data: { kind: 'classify', label: 'Classify intent', intents: ['refund', 'technical', 'general'] },
    },
    // Memory and file-search are side inputs feeding into the branch agents
    // — positioned in the same row as the agents but offset to one side.
    {
      id: 'memory',   type: 'memory',
      position: { x: -200, y: 340 },
      data: { kind: 'memory', label: 'Memory store', storeName: 'customer-history' },
    },
    {
      id: 'agent-refund', type: 'agent',
      position: { x: 60, y: 340 },
      data: {
        kind: 'agent', label: 'Refund agent',
        prompt: 'Handle refund requests. Pull past tickets from the customer history Memory store before responding.',
        model: 'claude-sonnet-4-6', tools: [], memoryRef: 'memory',
      },
    },
    {
      id: 'fileSearch', type: 'fileSearch',
      position: { x: 280, y: 200 },
      data: { kind: 'fileSearch', label: 'Docs search', source: 'product-docs' },
    },
    {
      id: 'agent-tech', type: 'agent',
      position: { x: 440, y: 340 },
      data: {
        kind: 'agent', label: 'Technical agent',
        prompt: 'Resolve technical issues using product docs and known fixes.',
        model: 'claude-sonnet-4-6', tools: ['file_search'],
      },
    },
    {
      id: 'agent-general', type: 'agent',
      position: { x: 820, y: 340 },
      data: {
        kind: 'agent', label: 'General agent',
        prompt: 'Handle general support inquiries.',
        model: 'claude-sonnet-4-6', tools: [],
      },
    },
    {
      id: 'guardrails', type: 'guardrails',
      position: { x: 460, y: 520 },
      data: { kind: 'guardrails', label: 'Guardrails', rules: ['no PII leakage', 'no harmful instructions'] },
    },
    { id: 'end', type: 'end', position: { x: 500, y: 660 }, data: { kind: 'end', label: 'End' } },
  ],
  edges: [
    { id: 'e1',  source: 'start',         target: 'classify' },
    { id: 'e2',  source: 'classify',      sourceHandle: 'refund',    target: 'agent-refund',  label: 'refund' },
    { id: 'e3',  source: 'classify',      sourceHandle: 'technical', target: 'agent-tech',    label: 'technical' },
    { id: 'e4',  source: 'classify',      sourceHandle: 'general',   target: 'agent-general', label: 'general' },
    { id: 'e5',  source: 'memory',        target: 'agent-refund' },
    { id: 'e6',  source: 'fileSearch',    target: 'agent-tech' },
    { id: 'e7',  source: 'agent-refund',  target: 'end' },
    { id: 'e8',  source: 'agent-tech',    target: 'guardrails' },
    { id: 'e9',  source: 'guardrails',    target: 'end' },
    { id: 'e10', source: 'agent-general', target: 'end' },
  ],
};

// EMAIL starts as a blank shell so the cold-start copilot demo (see
// emailDemo.ts) can build it up step-by-step. The completed graph from the
// demo matches what used to be hardcoded here.
const EMAIL: Graph = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 380, y: 60 },  data: { kind: 'start', label: 'Start' } },
    { id: 'end',   type: 'end',   position: { x: 400, y: 660 }, data: { kind: 'end', label: 'End' } },
  ],
  edges: [
    { id: 'e-start-end', source: 'start', target: 'end' },
  ],
};

// The fully-built form (Test mode references this when picking responses).
export const EMAIL_FINAL: Graph = {
  nodes: [
    { id: 'start',          type: 'start',    position: { x: 380, y: 60 },  data: { kind: 'start', label: 'Start' } },
    { id: 'triage',         type: 'classify', position: { x: 300, y: 180 }, data: { kind: 'classify', label: 'Triage email', intents: ['request', 'info-sharing', 'meeting', 'spam'] } },
    { id: 'skill-draft',    type: 'skill',    position: { x: 60, y: 360 },  data: { kind: 'skill', label: 'draft_reply', description: 'Compose a reply matching tone and prior thread context.' } },
    { id: 'skill-summary',  type: 'skill',    position: { x: 320, y: 360 }, data: { kind: 'skill', label: 'summarize_thread', description: 'Summarize a long thread into action items.' } },
    { id: 'skill-schedule', type: 'skill',    position: { x: 580, y: 360 }, data: { kind: 'skill', label: 'schedule_meeting', description: 'Propose times via the calendar tool.' } },
    { id: 'approval',       type: 'approval', position: { x: 220, y: 520 }, data: { kind: 'approval', label: 'User approval' } },
    { id: 'end',            type: 'end',      position: { x: 400, y: 680 }, data: { kind: 'end', label: 'End' } },
  ],
  edges: [
    { id: 'e-start',    source: 'start',          target: 'triage' },
    { id: 'e-req',      source: 'triage',         sourceHandle: 'request',      target: 'skill-draft',     label: 'request' },
    { id: 'e-info',     source: 'triage',         sourceHandle: 'info-sharing', target: 'skill-summary',   label: 'info' },
    { id: 'e-meet',     source: 'triage',         sourceHandle: 'meeting',      target: 'skill-schedule',  label: 'meeting' },
    { id: 'e-spam',     source: 'triage',         sourceHandle: 'spam',         target: 'end',             label: 'spam → delete' },
    { id: 'e-draft',    source: 'skill-draft',    target: 'approval' },
    { id: 'e-sched',    source: 'skill-schedule', target: 'approval' },
    { id: 'e-approval', source: 'approval',       target: 'end' },
    { id: 'e-summary',  source: 'skill-summary',  target: 'end' },
  ],
};

const BLANK: Graph = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 460, y: 40 },  data: { kind: 'start', label: 'Start' } },
    {
      id: 'agent', type: 'agent',
      position: { x: 400, y: 200 },
      data: {
        kind: 'agent', label: 'New agent',
        prompt: 'You are a helpful assistant.',
        model: 'claude-sonnet-4-6', tools: [],
      },
    },
    { id: 'end', type: 'end', position: { x: 460, y: 400 }, data: { kind: 'end', label: 'End' } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'agent' },
    { id: 'e2', source: 'agent', target: 'end' },
  ],
};

export const TEMPLATES: Record<TemplateId, { name: string; description: string; graph: Graph }> = {
  travel: {
    name: 'Travel agent',
    description:
      'Lead coordinator delegates flight, hotel, and itinerary work to three parallel subagents. Showcases multi-agent orchestration.',
    graph: TRAVEL,
  },
  support: {
    name: 'Customer support',
    description:
      'Classifies intent, routes to specialized agents. Refund branch reads a Memory store; technical branch searches docs.',
    graph: SUPPORT,
  },
  email: {
    name: 'Email assistant',
    description:
      'Inbox helper with three Skills (draft, summarize, schedule) and human-in-the-loop approval before sending.',
    graph: EMAIL,
  },
  blank: {
    name: 'Blank agent',
    description: 'A blank starting point with the core toolset.',
    graph: BLANK,
  },
};

// Fuzzy keyword router from a chat prompt to a template id.
const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  travel: ['travel', 'trip', 'flight', 'hotel', 'vacation', 'tour', 'itinerary', 'booking'],
  support: ['support', 'ticket', 'customer', 'refund', 'help desk', 'service', 'complaint'],
  email: ['email', 'inbox', 'reply', 'message', 'mail', 'compose'],
  blank: [],
};

export function routePromptToTemplate(prompt: string): TemplateId {
  const p = prompt.toLowerCase();
  let bestId: TemplateId = 'travel';
  let bestScore = 0;
  (Object.keys(TEMPLATE_KEYWORDS) as TemplateId[]).forEach((id) => {
    const score = TEMPLATE_KEYWORDS[id].filter((k) => p.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  });
  return bestId;
}
