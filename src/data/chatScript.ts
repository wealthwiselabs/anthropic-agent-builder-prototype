import type { Graph, GraphNode, GraphEdge, AgentNodeData, ModelId } from '../types';

// Mutations operate on a graph and return the updated graph + a human-readable
// description for the chat event card.
export type MutationResult = {
  graph: Graph;
  eventLabel: string;
};

export type Mutation = (graph: Graph) => MutationResult | null;

const id = (prefix = 'n') => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

// ---- mutation builders ----

const insertGuardrails: Mutation = (graph) => {
  // Insert a Guardrails node before the first Agent node, redirecting incoming edges.
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  const guardId = id('guardrails');
  const incoming = graph.edges.filter((e) => e.target === agent.id);
  const newNode: GraphNode = {
    id: guardId,
    type: 'guardrails',
    position: { x: agent.position.x - 220, y: agent.position.y - 90 },
    data: {
      kind: 'guardrails',
      label: 'Guardrails',
      rules: ['no PII leakage', 'no harmful instructions'],
    },
  };
  const rerouted: GraphEdge[] = incoming.map((e) => ({
    ...e,
    target: guardId,
  }));
  const bridge: GraphEdge = { id: id('e'), source: guardId, target: agent.id };
  const others = graph.edges.filter((e) => !incoming.find((i) => i.id === e.id));
  return {
    graph: {
      nodes: [...graph.nodes, newNode],
      edges: [...others, ...rerouted, bridge],
    },
    eventLabel: `Inserted Guardrails before ${agent.data.label}`,
  };
};

const setModelOnAllAgents = (model: ModelId): Mutation => (graph) => {
  let touched = 0;
  const nodes = graph.nodes.map((n) => {
    if (n.type === 'agent' || n.type === 'subagent') {
      touched++;
      return { ...n, data: { ...n.data, model } as AgentNodeData };
    }
    return n;
  });
  if (touched === 0) return null;
  return {
    graph: { ...graph, nodes },
    eventLabel: `Set model to ${model.replace('claude-', '')} on ${touched} agent${touched === 1 ? '' : 's'}`,
  };
};

const escalateOnLowConfidence: Mutation = (graph) => {
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  const ifId = id('ifelse');
  const apvId = id('approval');
  const newIfElse: GraphNode = {
    id: ifId,
    type: 'ifelse',
    position: { x: agent.position.x + 280, y: agent.position.y },
    data: {
      kind: 'ifelse',
      label: 'Confidence ≥ 0.7?',
      branches: ['yes', 'no'],
    },
  };
  const newApproval: GraphNode = {
    id: apvId,
    type: 'approval',
    position: { x: agent.position.x + 540, y: agent.position.y + 110 },
    data: { kind: 'approval', label: 'Human review' },
  };
  return {
    graph: {
      nodes: [...graph.nodes, newIfElse, newApproval],
      edges: [
        ...graph.edges,
        { id: id('e'), source: agent.id, target: ifId },
        { id: id('e'), source: ifId, target: apvId, sourceHandle: 'no', label: 'no' },
      ],
    },
    eventLabel: 'Added confidence-based escalation to a human reviewer',
  };
};

const enableDreamingOnSelected: Mutation = (graph) => {
  const lead = graph.nodes.find(
    (n) => n.type === 'agent' && (n.data as AgentNodeData).kind === 'agent'
  );
  if (!lead) return null;
  return {
    graph: {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === lead.id
          ? { ...n, data: { ...n.data, dreaming: true } as AgentNodeData }
          : n
      ),
    },
    eventLabel: `Enabled dreaming on ${(lead.data as AgentNodeData).label}`,
  };
};

const addMemoryStore: Mutation = (graph) => {
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  if (graph.nodes.find((n) => n.type === 'memory')) {
    return {
      graph,
      eventLabel: 'Memory store already present — no change',
    };
  }
  const memId = id('memory');
  const newNode: GraphNode = {
    id: memId,
    type: 'memory',
    position: { x: agent.position.x, y: agent.position.y - 180 },
    data: { kind: 'memory', label: 'Memory store', storeName: 'shared-memory' },
  };
  return {
    graph: {
      nodes: [...graph.nodes, newNode],
      edges: [...graph.edges, { id: id('e'), source: memId, target: agent.id }],
    },
    eventLabel: 'Added a Memory store and linked it to the agent',
  };
};

const addWebSearch: Mutation = (graph) => {
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  const data = agent.data as AgentNodeData;
  if (data.tools.includes('web_search')) {
    return { graph, eventLabel: 'Web search already enabled' };
  }
  return {
    graph: {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === agent.id
          ? {
              ...n,
              data: { ...data, tools: [...data.tools, 'web_search'] } as AgentNodeData,
            }
          : n
      ),
    },
    eventLabel: `Added web search to ${data.label}`,
  };
};

const parallelize: Mutation = (graph) => {
  // If there's already a multi-agent setup, no-op gracefully.
  if (graph.nodes.filter((n) => n.type === 'subagent').length > 0) {
    return { graph, eventLabel: 'Multi-agent setup already in place' };
  }
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  const subA: GraphNode = {
    id: id('sub'),
    type: 'subagent',
    position: { x: agent.position.x + 280, y: agent.position.y - 100 },
    data: {
      kind: 'subagent',
      label: 'Specialist A',
      prompt: 'Handle subtask A.',
      model: 'claude-sonnet-4-6',
      tools: [],
    },
  };
  const subB: GraphNode = {
    id: id('sub'),
    type: 'subagent',
    position: { x: agent.position.x + 280, y: agent.position.y + 100 },
    data: {
      kind: 'subagent',
      label: 'Specialist B',
      prompt: 'Handle subtask B.',
      model: 'claude-sonnet-4-6',
      tools: [],
    },
  };
  return {
    graph: {
      nodes: [...graph.nodes, subA, subB],
      edges: [
        ...graph.edges,
        { id: id('e'), source: agent.id, target: subA.id, label: 'parallel' },
        { id: id('e'), source: agent.id, target: subB.id, label: 'parallel' },
      ],
    },
    eventLabel: 'Converted to multi-agent with two specialist subagents',
  };
};

// ---- entries ----

export type ChatEntry = {
  keywords: string[];
  reply: string;
  mutation: Mutation;
};

export const CHAT_ENTRIES: ChatEntry[] = [
  {
    keywords: ['guardrail', 'guard', 'safety', 'filter', 'safe'],
    reply:
      "Added a Guardrails node before the lead agent. It'll filter unsafe inputs and outputs based on the rules you set in the inspector.",
    mutation: insertGuardrails,
  },
  {
    keywords: ['sonnet', 'switch to sonnet', 'use sonnet'],
    reply: 'Switched all agents to Sonnet 4.6.',
    mutation: setModelOnAllAgents('claude-sonnet-4-6'),
  },
  {
    keywords: ['opus', 'more powerful', 'smarter'],
    reply: 'Switched all agents to Opus 4.7.',
    mutation: setModelOnAllAgents('claude-opus-4-7'),
  },
  {
    keywords: ['haiku', 'cheap', 'fast', 'lighter'],
    reply: 'Switched all agents to Haiku 4.5 — cheap and fast.',
    mutation: setModelOnAllAgents('claude-haiku-4-5'),
  },
  {
    keywords: ['escalate', 'low confidence', 'confidence', 'human', 'reviewer'],
    reply:
      'Added an If/else: when confidence < 0.7 the agent routes to a human reviewer node before responding.',
    mutation: escalateOnLowConfidence,
  },
  {
    keywords: ['dreaming', 'dream', 'consolidate memory'],
    reply:
      'Dreaming enabled (research preview). After ~100 sessions this agent will start consolidating memory patterns from past runs.',
    mutation: enableDreamingOnSelected,
  },
  {
    keywords: ['memory', 'remember', 'persistent', 'history'],
    reply:
      'Added a Memory store. The agent will retain context across sessions; you can rename the store in the inspector.',
    mutation: addMemoryStore,
  },
  {
    keywords: ['web search', 'internet', 'search the web', 'web'],
    reply: 'Web search added to the lead agent.',
    mutation: addWebSearch,
  },
  {
    keywords: ['parallel', 'parallelize', 'multi-agent', 'subagent', 'specialists'],
    reply:
      'Converted to a multi-agent setup with two specialist subagents running in parallel. Adjust their prompts in the inspector.',
    mutation: parallelize,
  },
];

// Find the best-matching entry for a user prompt; returns null if no keyword overlap.
export function matchEntry(prompt: string): ChatEntry | null {
  const p = prompt.toLowerCase();
  let best: ChatEntry | null = null;
  let bestScore = 0;
  for (const entry of CHAT_ENTRIES) {
    const score = entry.keywords.filter((k) => p.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}

// ---- Generic fallbacks ----
//
// Any unmatched user message still produces a graph mutation. We rotate
// through three plausible edit kinds so it feels like an AI is interpreting
// the request: prompt edit, new node, new logic branch.

const editLeadAgentPrompt = (userText: string): Mutation => (graph) => {
  const lead = graph.nodes.find((n) => n.type === 'agent');
  if (!lead) return null;
  const data = lead.data as AgentNodeData;
  const note = `\n\n# Note (added by copilot): ${userText.slice(0, 200)}`;
  if (data.prompt.includes(note.trim())) {
    return { graph, eventLabel: 'Prompt already updated for this request' };
  }
  return {
    graph: {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === lead.id
          ? { ...n, data: { ...data, prompt: data.prompt + note } as AgentNodeData }
          : n
      ),
    },
    eventLabel: `Updated ${data.label}'s prompt`,
  };
};

const addNoteCapturing = (userText: string): Mutation => (graph) => {
  const noteId = id('note');
  const end = graph.nodes.find((n) => n.type === 'end');

  // If the graph has an End node, splice the Note in between whoever was
  // feeding End and End itself. Otherwise hang it off the lead agent.
  if (end) {
    const incomingToEnd = graph.edges.filter((e) => e.target === end.id);
    // Position the Note just before End (roughly at end.x - 240, same y).
    const pos = { x: end.position.x - 240, y: end.position.y };
    const noteNode: GraphNode = {
      id: noteId,
      type: 'note',
      position: pos,
      data: { kind: 'note', label: 'Copilot note', body: userText.slice(0, 240) },
    };

    // Reroute every incoming-to-End edge to land on the Note instead, then
    // add a single Note → End bridge.
    const rerouted: GraphEdge[] = incomingToEnd.map((e) => ({
      ...e,
      target: noteId,
    }));
    const others = graph.edges.filter(
      (e) => !incomingToEnd.find((i) => i.id === e.id)
    );
    const bridge: GraphEdge = {
      id: id('e'),
      source: noteId,
      target: end.id,
    };

    return {
      graph: {
        nodes: [...graph.nodes, noteNode],
        edges: [...others, ...rerouted, bridge],
      },
      eventLabel: 'Added a Note before End',
    };
  }

  // No End node — attach Note as a downstream of the lead agent.
  const lead = graph.nodes.find((n) => n.type === 'agent');
  if (!lead) {
    // Bare graph: just drop a free Note.
    return {
      graph: {
        ...graph,
        nodes: [
          ...graph.nodes,
          {
            id: noteId,
            type: 'note',
            position: { x: 240, y: 240 },
            data: { kind: 'note', label: 'Copilot note', body: userText.slice(0, 240) },
          },
        ],
      },
      eventLabel: 'Added a free-floating Note (no flow to attach to)',
    };
  }

  const noteNode: GraphNode = {
    id: noteId,
    type: 'note',
    position: { x: lead.position.x + 280, y: lead.position.y + 160 },
    data: { kind: 'note', label: 'Copilot note', body: userText.slice(0, 240) },
  };
  return {
    graph: {
      nodes: [...graph.nodes, noteNode],
      edges: [...graph.edges, { id: id('e'), source: lead.id, target: noteId }],
    },
    eventLabel: 'Added a Note linked to the lead agent',
  };
};

const addBranchAfterAgent = (userText: string): Mutation => (graph) => {
  const agent = graph.nodes.find((n) => n.type === 'agent');
  if (!agent) return null;
  const ifId = id('ifelse');
  const branchLabel =
    userText.split(/\s+/).slice(0, 3).join(' ').slice(0, 28) || 'new branch';
  const newIfElse: GraphNode = {
    id: ifId,
    type: 'ifelse',
    position: { x: agent.position.x + 280, y: agent.position.y + 160 },
    data: {
      kind: 'ifelse',
      label: 'New branch',
      branches: [branchLabel, 'else'],
    },
  };
  return {
    graph: {
      nodes: [...graph.nodes, newIfElse],
      edges: [...graph.edges, { id: id('e'), source: agent.id, target: ifId }],
    },
    eventLabel: `Added an If/else branch for "${branchLabel}"`,
  };
};

// Cycle through the three generic edits per session so consecutive
// unmatched messages don't all do the same thing.
let fallbackCounter = 0;
export function fallbackEntry(userText: string): ChatEntry {
  const which = fallbackCounter++ % 3;
  if (which === 0) {
    return {
      keywords: [],
      reply: `Got it — I tweaked the lead agent's system prompt to address that.`,
      mutation: editLeadAgentPrompt(userText),
    };
  }
  if (which === 1) {
    return {
      keywords: [],
      reply: `Noted. I dropped a Note node next to the agent capturing what you said.`,
      mutation: addNoteCapturing(userText),
    };
  }
  return {
    keywords: [],
    reply: `Interesting. I added an If/else after the agent so you can branch on that condition.`,
    mutation: addBranchAfterAgent(userText),
  };
}
