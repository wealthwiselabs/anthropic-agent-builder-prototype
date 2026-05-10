import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { useStore } from '../../store/useStore';
import type { GraphNode, NodeKind, AnyNodeData } from '../../types';

// Wrap React Flow, plumb nodes/edges from Zustand, persist position changes back.
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
        animated: e.animated,
        type: 'smoothstep',
      })),
    [graph.edges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setGraph({
        nodes: updated.map(
          (u): GraphNode => {
            const original = graph.nodes.find((g) => g.id === u.id);
            return {
              id: u.id,
              type: (original?.type ?? 'agent'),
              position: u.position ?? original?.position ?? { x: 0, y: 0 },
              data: original?.data ?? ({} as GraphNode['data']),
            };
          }
        ),
        edges: graph.edges,
      });

      // Track selection
      const selectionChange = changes.find(
        (c) => c.type === 'select'
      );
      if (selectionChange && selectionChange.type === 'select') {
        selectNode(selectionChange.selected ? selectionChange.id : null);
      }
    },
    [graph, nodes, setGraph, selectNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges) as Edge[];
      setGraph({
        nodes: graph.nodes,
        edges: updated.map((u) => {
          const original = graph.edges.find((g) => g.id === u.id);
          return {
            id: u.id,
            source: u.source,
            target: u.target,
            sourceHandle: u.sourceHandle ?? original?.sourceHandle,
            label: original?.label,
            animated: original?.animated,
          };
        }),
      });
    },
    [graph, edges, setGraph]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      const id = `e-${crypto.randomUUID().slice(0, 8)}`;
      setGraph({
        nodes: graph.nodes,
        edges: [
          ...graph.edges,
          {
            id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle ?? undefined,
          },
        ],
      });
    },
    [graph, setGraph]
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
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background gap={16} size={1} color="#E8E5DD" />
        <Controls position="bottom-center" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={() => '#EDF1FA'}
          maskColor="rgba(247, 245, 240, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
