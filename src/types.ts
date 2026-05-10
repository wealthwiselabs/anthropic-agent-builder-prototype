// Domain types for the Agent Builder prototype.
// Graph state mirrors React Flow's Node/Edge but adds typed `data` per node kind.

export type NodeKind =
  | 'start'
  | 'end'
  | 'agent'
  | 'subagent'
  | 'classify'
  | 'ifelse'
  | 'while'
  | 'approval'
  | 'memory'
  | 'guardrails'
  | 'mcp'
  | 'fileSearch'
  | 'skill'
  | 'note';

export type ModelId =
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-7'
  | 'claude-haiku-4-5';

export type AgentNodeData = {
  kind: 'agent' | 'subagent';
  label: string;
  prompt: string;
  model: ModelId;
  tools: string[]; // free-form tool chips
  memoryRef?: string; // id of a memory node it reads from
  dreaming?: boolean;
};

export type ClassifyNodeData = {
  kind: 'classify';
  label: string;
  intents: string[]; // labels for output branches
};

export type IfElseNodeData = {
  kind: 'ifelse';
  label: string;
  branches: string[]; // labels for branches; last one is implicit "else"
};

export type WhileNodeData = {
  kind: 'while';
  label: string;
  condition: string;
};

export type ApprovalNodeData = {
  kind: 'approval';
  label: string;
};

export type MemoryNodeData = {
  kind: 'memory';
  label: string;
  storeName: string;
};

export type SkillNodeData = {
  kind: 'skill';
  label: string;
  description: string;
};

export type GuardrailsNodeData = {
  kind: 'guardrails';
  label: string;
  rules: string[];
};

export type MCPNodeData = {
  kind: 'mcp';
  label: string;
  server: string;
};

export type FileSearchNodeData = {
  kind: 'fileSearch';
  label: string;
  source: string;
};

export type StartEndNodeData = {
  kind: 'start' | 'end';
  label: string;
};

export type NoteNodeData = {
  kind: 'note';
  label: string;
  body: string;
};

export type AnyNodeData =
  | AgentNodeData
  | ClassifyNodeData
  | IfElseNodeData
  | WhileNodeData
  | ApprovalNodeData
  | MemoryNodeData
  | SkillNodeData
  | GuardrailsNodeData
  | MCPNodeData
  | FileSearchNodeData
  | StartEndNodeData
  | NoteNodeData;

export type GraphNode = {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: AnyNodeData;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
  animated?: boolean;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type TemplateId = 'travel' | 'support' | 'email' | 'blank';

export type ChatMessage = {
  id: string;
  role: 'user' | 'copilot';
  text: string;
  timestamp: number;
  // Optional inline event card describing a graph mutation.
  event?: { label: string };
};
