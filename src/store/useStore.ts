import { create } from 'zustand';
import type {
  Graph,
  GraphNode,
  GraphEdge,
  TemplateId,
  ChatMessage,
  AgentNodeData,
} from '../types';

type DeployTarget = 'managed' | 'github' | 'download';

type StoreState = {
  // Graph
  graph: Graph;
  selectedNodeId: string | null;
  // Used in Test mode to pulse-highlight the node the agent is "currently
  // executing" as scripted thinking lines reveal (LangGraph-Studio style).
  activeNodeId: string | null;
  setGraph: (g: Graph) => void;
  selectNode: (id: string | null) => void;
  setActiveNode: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<GraphNode['data']>) => void;
  addNode: (n: GraphNode) => void;
  removeNode: (id: string) => void;
  addEdge: (e: GraphEdge) => void;
  removeEdge: (id: string) => void;

  // Chat
  chat: ChatMessage[];
  pushChat: (m: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateChat: (id: string, patch: Partial<Omit<ChatMessage, 'id' | 'timestamp'>>) => void;
  clearChat: () => void;

  // View state (graph editor vs read-only code view, only used in build mode)
  view: 'graph' | 'code';
  setView: (v: 'graph' | 'code') => void;

  // Wizard mode: Build → Test → Deploy
  mode: 'build' | 'test' | 'deploy';
  setMode: (m: 'build' | 'test' | 'deploy') => void;

  // True while the cold-start Email build animation is running. Used to
  // hide the "Next: Test" CTA until the demo finishes.
  demoRunning: boolean;
  setDemoRunning: (b: boolean) => void;

  // Deploy
  lastDeployTarget: DeployTarget | null;
  setLastDeployTarget: (t: DeployTarget | null) => void;

  // Template metadata
  currentTemplate: TemplateId | null;
  agentName: string;
  setAgentName: (n: string) => void;
  setCurrentTemplate: (t: TemplateId | null) => void;
};

export const useStore = create<StoreState>((set) => ({
  graph: { nodes: [], edges: [] },
  selectedNodeId: null,
  activeNodeId: null,
  setGraph: (g) => set({ graph: g }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setActiveNode: (id) => set({ activeNodeId: id }),
  updateNodeData: (id, patch) =>
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } as AgentNodeData } : n
        ),
      },
    })),
  addNode: (n) =>
    set((s) => ({ graph: { ...s.graph, nodes: [...s.graph.nodes, n] } })),
  removeNode: (id) =>
    set((s) => ({
      graph: {
        nodes: s.graph.nodes.filter((n) => n.id !== id),
        edges: s.graph.edges.filter((e) => e.source !== id && e.target !== id),
      },
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),
  addEdge: (e) =>
    set((s) => ({ graph: { ...s.graph, edges: [...s.graph.edges, e] } })),
  removeEdge: (id) =>
    set((s) => ({ graph: { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== id) } })),

  chat: [],
  pushChat: (m) => {
    const id = crypto.randomUUID();
    set((s) => ({
      chat: [...s.chat, { ...m, id, timestamp: Date.now() }],
    }));
    return id;
  },
  updateChat: (id, patch) =>
    set((s) => ({
      chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  clearChat: () => set({ chat: [] }),

  view: 'graph',
  setView: (v) => set({ view: v }),

  mode: 'build',
  setMode: (m) => set({ mode: m }),

  demoRunning: false,
  setDemoRunning: (b) => set({ demoRunning: b }),

  lastDeployTarget: null,
  setLastDeployTarget: (t) => set({ lastDeployTarget: t }),

  currentTemplate: null,
  agentName: 'New agent',
  setAgentName: (n) => set({ agentName: n }),
  setCurrentTemplate: (t) => set({ currentTemplate: t }),
}));
