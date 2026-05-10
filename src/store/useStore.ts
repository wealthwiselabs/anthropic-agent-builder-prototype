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
  setGraph: (g: Graph) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<GraphNode['data']>) => void;
  addNode: (n: GraphNode) => void;
  removeNode: (id: string) => void;
  addEdge: (e: GraphEdge) => void;
  removeEdge: (id: string) => void;

  // Chat
  chat: ChatMessage[];
  pushChat: (m: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // View state
  view: 'graph' | 'code';
  setView: (v: 'graph' | 'code') => void;

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
  setGraph: (g) => set({ graph: g }),
  selectNode: (id) => set({ selectedNodeId: id }),
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
  pushChat: (m) =>
    set((s) => ({
      chat: [
        ...s.chat,
        { ...m, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  clearChat: () => set({ chat: [] }),

  view: 'graph',
  setView: (v) => set({ view: v }),

  lastDeployTarget: null,
  setLastDeployTarget: (t) => set({ lastDeployTarget: t }),

  currentTemplate: null,
  agentName: 'New agent',
  setAgentName: (n) => set({ agentName: n }),
  setCurrentTemplate: (t) => set({ currentTemplate: t }),
}));
