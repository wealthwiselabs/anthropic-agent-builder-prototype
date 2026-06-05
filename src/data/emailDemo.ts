import type { Graph, GraphNode } from '../types';
import { EMAIL_FINAL } from './templates';

// Pre-filled prompt that lands in the chat input when a reviewer first hits
// the Email assistant.
export const EMAIL_DEMO_PROMPT =
  'Build me an email assistant that triages each email, drafts replies for requests, schedules meetings, and deletes spam.';

// Each step has a copilot reply line + a graph mutation. The ChatSidebar
// walks through these sequentially with the same staged "thinking → reply
// → spawn nodes → connect edges" animation it uses for normal mutations.
export type DemoStep = {
  reply: string;
  mutation: (g: Graph) => Graph;
  // How long the active highlight should linger on the freshly added
  // node before the next step kicks off.
  dwellMs?: number;
};

// ----- Step builders -----
// Each one assumes the previous step's result. They reuse stable ids
// ('triage', 'skill-draft', etc.) so the final state matches EMAIL_FINAL.

const addTriage = (g: Graph): Graph => {
  const start = g.nodes.find((n) => n.type === 'start');
  const end = g.nodes.find((n) => n.type === 'end');
  if (!start || !end) return g;

  const triage: GraphNode = {
    id: 'triage',
    type: 'classify',
    position: { x: 300, y: 180 },
    data: {
      kind: 'classify',
      label: 'Triage email',
      intents: ['request', 'info-sharing', 'meeting', 'spam'],
    },
  };

  // Reroute start → end to go through triage.
  const edges = g.edges
    .filter((e) => !(e.source === start.id && e.target === end.id))
    .concat([
      { id: 'e-start', source: start.id, target: triage.id },
      { id: 'e-triage-end', source: triage.id, target: end.id },
    ]);

  return { nodes: [...g.nodes, triage], edges };
};

const addRequestBranch = (g: Graph): Graph => {
  const end = g.nodes.find((n) => n.type === 'end');
  if (!end) return g;

  const draft: GraphNode = {
    id: 'skill-draft',
    type: 'skill',
    position: { x: 60, y: 430 },
    data: {
      kind: 'skill',
      label: 'draft_reply',
      description: 'Compose a reply matching tone and prior thread context.',
    },
  };
  const approval: GraphNode = {
    id: 'approval',
    type: 'approval',
    position: { x: 220, y: 600 },
    data: { kind: 'approval', label: 'User approval' },
  };

  // Remove the placeholder triage → end (it'll be re-added later for spam).
  const edges = g.edges
    .filter((e) => !(e.source === 'triage' && e.target === end.id && !e.sourceHandle))
    .concat([
      {
        id: 'e-req',
        source: 'triage',
        sourceHandle: 'request',
        target: 'skill-draft',
        label: 'request',
      },
      { id: 'e-draft', source: 'skill-draft', target: 'approval' },
      { id: 'e-approval', source: 'approval', target: end.id },
    ]);

  return { nodes: [...g.nodes, draft, approval], edges };
};

const addMeetingBranch = (g: Graph): Graph => {
  const schedule: GraphNode = {
    id: 'skill-schedule',
    type: 'skill',
    position: { x: 580, y: 430 },
    data: {
      kind: 'skill',
      label: 'schedule_meeting',
      description: 'Propose times via the calendar tool.',
    },
  };
  const edges = [
    ...g.edges,
    {
      id: 'e-meet',
      source: 'triage',
      sourceHandle: 'meeting',
      target: 'skill-schedule',
      label: 'meeting',
    },
    { id: 'e-sched', source: 'skill-schedule', target: 'approval' },
  ];
  return { nodes: [...g.nodes, schedule], edges };
};

const addInfoBranch = (g: Graph): Graph => {
  const end = g.nodes.find((n) => n.type === 'end');
  if (!end) return g;

  const summary: GraphNode = {
    id: 'skill-summary',
    type: 'skill',
    position: { x: 320, y: 430 },
    data: {
      kind: 'skill',
      label: 'summarize_thread',
      description: 'Summarize a long thread into action items.',
    },
  };
  const edges = [
    ...g.edges,
    {
      id: 'e-info',
      source: 'triage',
      sourceHandle: 'info-sharing',
      target: 'skill-summary',
      label: 'info',
    },
    { id: 'e-summary', source: 'skill-summary', target: end.id },
  ];
  return { nodes: [...g.nodes, summary], edges };
};

const wireSpam = (g: Graph): Graph => {
  const end = g.nodes.find((n) => n.type === 'end');
  if (!end) return g;
  return {
    ...g,
    edges: [
      ...g.edges,
      {
        id: 'e-spam',
        source: 'triage',
        sourceHandle: 'spam',
        target: end.id,
        label: 'spam → delete',
      },
    ],
  };
};

export const EMAIL_DEMO_STEPS: DemoStep[] = [
  {
    reply:
      "Got it. Let's start with a Triage step that classifies each email into request, info-sharing, meeting, or spam.",
    mutation: addTriage,
  },
  {
    reply:
      "For 'request' emails, I'll draft a reply and gate sending behind a User approval interrupt — humans review before anything goes out.",
    mutation: addRequestBranch,
  },
  {
    reply:
      "Meetings get a scheduling Skill, also funneled through the same approval gate so you can sanity-check times before they're sent.",
    mutation: addMeetingBranch,
  },
  {
    reply:
      "Info-sharing emails just get summarized — no reply needed, so this branch bypasses approval and goes straight to End.",
    mutation: addInfoBranch,
  },
  {
    reply:
      "And spam goes straight to End (deleted) — no work to do. That's the agent. Hop over to **Test** to send it some real-looking emails.",
    mutation: wireSpam,
  },
];

export { EMAIL_FINAL };
