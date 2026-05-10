import type { Graph, TemplateId } from '../types';

// Hardcoded template graphs. Each one's shape highlights one May 2026 primitive:
// - travel:  multi-agent orchestration (lead + 3 parallel subagents)
// - support: Memory store + File search as composable nodes
// - email:   Skills as composable nodes + User approval

const TRAVEL: Graph = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 80, y: 240 },
      data: { kind: 'start', label: 'Start' },
    },
    {
      id: 'lead',
      type: 'agent',
      position: { x: 280, y: 240 },
      data: {
        kind: 'agent',
        label: 'Travel Coordinator',
        prompt: 'You orchestrate a travel-planning workflow. Decompose the user\'s trip request into flight, hotel, and itinerary work; delegate to specialists; synthesize results.',
        model: 'claude-opus-4-7',
        tools: ['web_search'],
        dreaming: true,
      },
    },
    {
      id: 'sub-flight',
      type: 'subagent',
      position: { x: 600, y: 80 },
      data: {
        kind: 'subagent',
        label: 'Flight Search',
        prompt: 'Search flight options for the requested dates and destination.',
        model: 'claude-sonnet-4-6',
        tools: ['web_search'],
      },
    },
    {
      id: 'sub-hotel',
      type: 'subagent',
      position: { x: 600, y: 240 },
      data: {
        kind: 'subagent',
        label: 'Hotel Booking',
        prompt: 'Find lodging matching budget and preferences.',
        model: 'claude-sonnet-4-6',
        tools: ['mcp:bookings'],
      },
    },
    {
      id: 'sub-itinerary',
      type: 'subagent',
      position: { x: 600, y: 400 },
      data: {
        kind: 'subagent',
        label: 'Itinerary Builder',
        prompt: 'Build a day-by-day itinerary using the selected flights and hotel.',
        model: 'claude-sonnet-4-6',
        tools: [],
      },
    },
    {
      id: 'ifelse',
      type: 'ifelse',
      position: { x: 920, y: 240 },
      data: { kind: 'ifelse', label: 'Have plan?', branches: ['yes', 'no'] },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1180, y: 240 },
      data: { kind: 'end', label: 'End' },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'lead' },
    { id: 'e2', source: 'lead', target: 'sub-flight', label: 'parallel' },
    { id: 'e3', source: 'lead', target: 'sub-hotel', label: 'parallel' },
    { id: 'e4', source: 'lead', target: 'sub-itinerary', label: 'parallel' },
    { id: 'e5', source: 'sub-flight', target: 'ifelse' },
    { id: 'e6', source: 'sub-hotel', target: 'ifelse' },
    { id: 'e7', source: 'sub-itinerary', target: 'ifelse' },
    { id: 'e8', source: 'ifelse', target: 'end', label: 'yes' },
    { id: 'e9', source: 'ifelse', target: 'lead', label: 'no' },
  ],
};

const SUPPORT: Graph = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 80, y: 280 },
      data: { kind: 'start', label: 'Start' },
    },
    {
      id: 'classify',
      type: 'classify',
      position: { x: 260, y: 280 },
      data: { kind: 'classify', label: 'Classify intent', intents: ['refund', 'technical', 'general'] },
    },
    {
      id: 'memory',
      type: 'memory',
      position: { x: 520, y: 80 },
      data: { kind: 'memory', label: 'Memory store', storeName: 'customer-history' },
    },
    {
      id: 'agent-refund',
      type: 'agent',
      position: { x: 520, y: 180 },
      data: {
        kind: 'agent',
        label: 'Refund agent',
        prompt: 'Handle refund requests. Pull past tickets from the customer history Memory store before responding.',
        model: 'claude-sonnet-4-6',
        tools: [],
        memoryRef: 'memory',
      },
    },
    {
      id: 'fileSearch',
      type: 'fileSearch',
      position: { x: 520, y: 320 },
      data: { kind: 'fileSearch', label: 'Docs search', source: 'product-docs' },
    },
    {
      id: 'agent-tech',
      type: 'agent',
      position: { x: 520, y: 420 },
      data: {
        kind: 'agent',
        label: 'Technical agent',
        prompt: 'Resolve technical issues using product docs and known fixes.',
        model: 'claude-sonnet-4-6',
        tools: ['file_search'],
      },
    },
    {
      id: 'guardrails',
      type: 'guardrails',
      position: { x: 800, y: 420 },
      data: { kind: 'guardrails', label: 'Guardrails', rules: ['no PII leakage', 'no harmful instructions'] },
    },
    {
      id: 'agent-general',
      type: 'agent',
      position: { x: 520, y: 540 },
      data: {
        kind: 'agent',
        label: 'General agent',
        prompt: 'Handle general support inquiries.',
        model: 'claude-sonnet-4-6',
        tools: [],
      },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1060, y: 360 },
      data: { kind: 'end', label: 'End' },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'classify' },
    { id: 'e2', source: 'classify', target: 'agent-refund', label: 'refund' },
    { id: 'e3', source: 'classify', target: 'agent-tech', label: 'technical' },
    { id: 'e4', source: 'classify', target: 'agent-general', label: 'general' },
    { id: 'e5', source: 'memory', target: 'agent-refund' },
    { id: 'e6', source: 'fileSearch', target: 'agent-tech' },
    { id: 'e7', source: 'agent-refund', target: 'end' },
    { id: 'e8', source: 'agent-tech', target: 'guardrails' },
    { id: 'e9', source: 'guardrails', target: 'end' },
    { id: 'e10', source: 'agent-general', target: 'end' },
  ],
};

const EMAIL: Graph = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 80, y: 280 },
      data: { kind: 'start', label: 'Start' },
    },
    {
      id: 'agent',
      type: 'agent',
      position: { x: 280, y: 280 },
      data: {
        kind: 'agent',
        label: 'Inbox Assistant',
        prompt: 'Read incoming email; pick a Skill (draft / summarize / schedule) and execute. Wait for human approval before sending.',
        model: 'claude-sonnet-4-6',
        tools: ['skills'],
      },
    },
    {
      id: 'skill-draft',
      type: 'skill',
      position: { x: 580, y: 120 },
      data: { kind: 'skill', label: 'draft_reply', description: 'Compose a reply matching tone and prior thread context.' },
    },
    {
      id: 'skill-summary',
      type: 'skill',
      position: { x: 580, y: 280 },
      data: { kind: 'skill', label: 'summarize_thread', description: 'Summarize a long thread into action items.' },
    },
    {
      id: 'skill-schedule',
      type: 'skill',
      position: { x: 580, y: 440 },
      data: { kind: 'skill', label: 'schedule_meeting', description: 'Propose times via the calendar tool.' },
    },
    {
      id: 'approval',
      type: 'approval',
      position: { x: 880, y: 280 },
      data: { kind: 'approval', label: 'User approval' },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1120, y: 280 },
      data: { kind: 'end', label: 'End' },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'agent' },
    { id: 'e2', source: 'skill-draft', target: 'agent' },
    { id: 'e3', source: 'skill-summary', target: 'agent' },
    { id: 'e4', source: 'skill-schedule', target: 'agent' },
    { id: 'e5', source: 'agent', target: 'approval' },
    { id: 'e6', source: 'approval', target: 'end' },
  ],
};

const BLANK: Graph = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 200, y: 240 },
      data: { kind: 'start', label: 'Start' },
    },
    {
      id: 'agent',
      type: 'agent',
      position: { x: 460, y: 240 },
      data: {
        kind: 'agent',
        label: 'New agent',
        prompt: 'You are a helpful assistant.',
        model: 'claude-sonnet-4-6',
        tools: [],
      },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 720, y: 240 },
      data: { kind: 'end', label: 'End' },
    },
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
