import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { useStore } from '../../store/useStore';
import type { NodeKind, AnyNodeData } from '../../types';

// Wrap React Flow, plumb nodes/edges from Zustand, persist position changes back.
//
// Important: only sync user-meaningful changes (position, selection, removal) back
// into our store. Internal React Flow events like "dimensions" updates fire on
// every layout pass — feeding them back into Zustand causes a re-render loop
// (and shows up in Vite as ResizeObserver loop warnings, with empty canvas).
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function CanvasInner() {
  const graph = useStore((s) => s.graph);
  const setGraph = useStore((s) => s.setGraph);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const removeNode = useStore((s) => s.removeNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const addEdge = useStore((s) => s.addEdge);
  const addNode = useStore((s) => s.addNode);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
        selected: n.id === selectedNodeId,
      })),
    [graph.nodes, selectedNodeId]
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        label: e.label,
        labelStyle: { fontSize: 11, fill: '#6B6862' },
        labelBgStyle: { fill: '#FAFAF7' },
        labelBgPadding: [4, 2] as [number, number],
        animated: e.animated,
        type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9C988E', width: 16, height: 16 },
        style: { stroke: '#B8B3A8', strokeWidth: 1.5 },
      })),
    [graph.edges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Collect just the changes we care about. Skip dimensions/internal events.
      let posUpdates: Map<string, { x: number; y: number }> | null = null;
      const removals: string[] = [];
      let selection: { id: string; selected: boolean } | null = null;

      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          posUpdates ??= new Map();
          posUpdates.set(c.id, c.position);
        } else if (c.type === 'remove') {
          removals.push(c.id);
        } else if (c.type === 'select') {
          selection = { id: c.id, selected: c.selected };
        }
      }

      if (posUpdates && posUpdates.size > 0) {
        setGraph({
          ...graph,
          nodes: graph.nodes.map((n) =>
            posUpdates!.has(n.id)
              ? { ...n, position: posUpdates!.get(n.id)! }
              : n
          ),
        });
      }
      for (const id of removals) removeNode(id);
      if (selection) {
        selectNode(selection.selected ? selection.id : null);
      }
    },
    [graph, setGraph, selectNode, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Only persist removals; position/animated changes don't apply to edges in our model.
      for (const c of changes) {
        if (c.type === 'remove') removeEdge(c.id);
      }
    },
    [removeEdge]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      const id = `e-${crypto.randomUUID().slice(0, 8)}`;
      addEdge({
        id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle ?? undefined,
      });
    },
    [addEdge]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/x-node');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw) as { kind: NodeKind; defaults: AnyNodeData };
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const id = `n-${crypto.randomUUID().slice(0, 8)}`;
        addNode({
          id,
          type: payload.kind,
          position,
          data: payload.defaults,
        });
      } catch {
        /* ignore malformed drop */
      }
    },
    [addNode, screenToFlowPosition]
  );

  return (
    <div className="w-full h-full" ref={wrapperRef} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.08, maxZoom: 1.2, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        // Forgiving connection drop radius so users don't need precision aim.
        connectionRadius={50}
        // Left-click is dedicated to nodes + handles (selecting, moving,
        // connecting). Pan only with middle-click (1) or right-click (2),
        // so the pan gesture can never hijack a connection drag started
        // just outside a handle. Scroll-wheel still zooms.
        panOnDrag={[1, 2]}
        defaultEdgeOptions={{
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9C988E', width: 16, height: 16 },
          style: { stroke: '#B8B3A8', strokeWidth: 1.5 },
        }}
      >
        <Background gap={16} size={1} color="#E8E5DD" />
        <Controls position="bottom-center" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
