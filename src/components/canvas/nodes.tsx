import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Bot,
  GitBranch,
  Repeat,
  CheckSquare,
  Database,
  Shield,
  Boxes,
  Search,
  Sparkles,
  StickyNote,
  Play,
  Square,
  ListChecks,
  Moon,
  Pause,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type {
  AgentNodeData,
  ClassifyNodeData,
  IfElseNodeData,
  WhileNodeData,
  ApprovalNodeData,
  MemoryNodeData,
  SkillNodeData,
  GuardrailsNodeData,
  MCPNodeData,
  FileSearchNodeData,
  StartEndNodeData,
  NoteNodeData,
  NodeKind,
} from '../../types';
import clsx from 'clsx';

// ----- Shared node shell -----
//
// Renders a consistent rounded card. Targets/sources are handled per-kind
// because some nodes (Start, End) only have one side, and Classify/IfElse
// have multiple labeled output handles.

type ShellProps = {
  // The React Flow node id is passed through so the shell can subscribe to
  // activeNodeId from the store and pulse when it's the executing node.
  nodeId: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode; // small marker rendered top-right (e.g. interrupt glyph)
  selected?: boolean;
  children?: React.ReactNode;
  width?: number;
};

function NodeShell({ nodeId, icon, iconBg, title, subtitle, badge, selected, children, width }: ShellProps) {
  const isActive = useStore((s) => s.activeNodeId === nodeId);
  return (
    <div
      className={clsx(
        'relative bg-white rounded-xl px-2.5 py-2 transition-shadow flex items-center gap-2 select-none animate-node-spawn',
        isActive
          ? 'node-active shadow-node'
          : selected ? 'shadow-node-selected' : 'shadow-node'
      )}
      style={{ width: width ?? 172 }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-[12px] text-ink truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-muted truncate">{subtitle}</div>}
        {children}
      </div>
      {badge && (
        <span className="absolute -top-1.5 -right-1.5">{badge}</span>
      )}
    </div>
  );
}

// ----- Concrete node components -----

export function StartNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as StartEndNodeData;
  return (
    <>
      <NodeShell
        nodeId={id}
        icon={<Play className="w-4 h-4 text-emerald-700" />}
        iconBg="#E8F3EB"
        title={d.label || 'Start'}
        selected={selected}
        width={120}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function EndNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as StartEndNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Square className="w-4 h-4 text-emerald-700" />}
        iconBg="#E8F3EB"
        title={d.label || 'End'}
        selected={selected}
        width={108}
      />
    </>
  );
}

export function AgentNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Bot className="w-4 h-4 text-blue-700" />}
        iconBg="#EDF1FA"
        title={d.label}
        subtitle={d.kind === 'agent' ? 'Agent' : 'Subagent'}
        selected={selected}
        width={188}
      >
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <Pill>{d.model.replace('claude-', '')}</Pill>
          {d.dreaming && (
            <Pill accent>
              <Moon className="w-2.5 h-2.5 mr-0.5" /> dreaming
            </Pill>
          )}
        </div>
      </NodeShell>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function SubagentNode({ id, data, selected }: NodeProps) {
  // Visually distinct from Agent — softer purple background.
  const d = data as unknown as AgentNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Bot className="w-4 h-4 text-purple-700" />}
        iconBg="#F2EEFB"
        title={d.label}
        subtitle="Subagent"
        selected={selected}
        width={172}
      >
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <Pill>{d.model.replace('claude-', '')}</Pill>
        </div>
      </NodeShell>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function ClassifyNode({ data, selected, id }: NodeProps) {
  const d = data as unknown as ClassifyNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<ListChecks className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="Classify"
        selected={selected}
        width={190}
      >
        <div className="mt-1 space-y-0.5">
          {d.intents.map((label) => (
            <BranchRow key={`${id}-${label}`} label={label} />
          ))}
        </div>
      </NodeShell>
      {d.intents.map((label, i) => (
        <Handle
          key={`${id}-h-${label}`}
          type="source"
          position={Position.Bottom}
          id={label}
          // Spread sources evenly along the bottom edge so each branch
          // has its own visible handle.
          style={{ left: `${((i + 1) / (d.intents.length + 1)) * 100}%` }}
        />
      ))}
    </>
  );
}

export function IfElseNode({ data, selected, id }: NodeProps) {
  const d = data as unknown as IfElseNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<GitBranch className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="If / else"
        selected={selected}
        width={172}
      >
        <div className="mt-1 space-y-0.5">
          {d.branches.map((label) => (
            <BranchRow key={`${id}-${label}`} label={label} />
          ))}
        </div>
      </NodeShell>
      {d.branches.map((label, i) => (
        <Handle
          key={`${id}-h-${label}`}
          type="source"
          position={Position.Bottom}
          id={label}
          style={{ left: `${((i + 1) / (d.branches.length + 1)) * 100}%` }}
        />
      ))}
    </>
  );
}

export function WhileNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as WhileNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Repeat className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="While"
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function ApprovalNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as ApprovalNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<CheckSquare className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="Interrupt · waits for human input"
        selected={selected}
        badge={
          <span
            title="This node pauses the graph for human input — LangGraph-style interrupt() / checkpoint."
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-coral text-white shadow-sm ring-2 ring-chrome"
          >
            <Pause className="w-3 h-3" />
          </span>
        }
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function MemoryNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as MemoryNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Database className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={`store: ${d.storeName}`}
        selected={selected}
        width={172}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function GuardrailsNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as GuardrailsNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Shield className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={`${d.rules.length} rule${d.rules.length === 1 ? '' : 's'}`}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function MCPNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as MCPNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Boxes className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={d.server}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function FileSearchNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as FileSearchNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Search className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={d.source}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function SkillNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as SkillNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<Sparkles className="w-4 h-4 text-zinc-700" />}
        iconBg="#EFEFEF"
        title={d.label}
        subtitle="Skill"
        selected={selected}
        width={172}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export function NoteNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as NoteNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeShell
        nodeId={id}
        icon={<StickyNote className="w-4 h-4 text-yellow-700" />}
        iconBg="#FFF8DD"
        title={d.label}
        subtitle={d.body}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

// ----- Helpers -----

function Pill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
        accent
          ? 'bg-coral/15 text-coral font-medium'
          : 'bg-canvas text-muted'
      )}
    >
      {children}
    </span>
  );
}

function BranchRow({ label }: { label: string }) {
  return (
    <div className="text-[11px] bg-canvas/70 px-2 py-1 rounded">
      <span className="text-ink/80 truncate">{label}</span>
    </div>
  );
}

// React Flow expects a map of node-type-key → component.
export const nodeTypes: Record<NodeKind, React.ComponentType<NodeProps>> = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  subagent: SubagentNode,
  classify: ClassifyNode,
  ifelse: IfElseNode,
  while: WhileNode,
  approval: ApprovalNode,
  memory: MemoryNode,
  guardrails: GuardrailsNode,
  mcp: MCPNode,
  fileSearch: FileSearchNode,
  skill: SkillNode,
  note: NoteNode,
};
