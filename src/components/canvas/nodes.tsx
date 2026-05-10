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
} from 'lucide-react';
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
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  children?: React.ReactNode;
  width?: number;
};

function NodeShell({ icon, iconBg, title, subtitle, selected, children, width }: ShellProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl px-3 py-2.5 transition-shadow flex items-center gap-2.5 select-none',
        selected ? 'shadow-node-selected' : 'shadow-node'
      )}
      style={{ width: width ?? 200 }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-[13px] text-ink truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-muted truncate">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

// ----- Concrete node components -----

export function StartNode({ data, selected }: NodeProps) {
  const d = data as unknown as StartEndNodeData;
  return (
    <>
      <NodeShell
        icon={<Play className="w-4 h-4 text-emerald-700" />}
        iconBg="#E8F3EB"
        title={d.label || 'Start'}
        selected={selected}
        width={140}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function EndNode({ data, selected }: NodeProps) {
  const d = data as unknown as StartEndNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Square className="w-4 h-4 text-emerald-700" />}
        iconBg="#E8F3EB"
        title={d.label || 'End'}
        selected={selected}
        width={120}
      />
    </>
  );
}

export function AgentNode({ data, selected }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Bot className="w-4 h-4 text-blue-700" />}
        iconBg="#EDF1FA"
        title={d.label}
        subtitle={d.kind === 'agent' ? 'Agent' : 'Subagent'}
        selected={selected}
        width={220}
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
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function SubagentNode(props: NodeProps) {
  // Visually distinct from Agent — softer purple background.
  const d = props.data as unknown as AgentNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Bot className="w-4 h-4 text-purple-700" />}
        iconBg="#F2EEFB"
        title={d.label}
        subtitle="Subagent"
        selected={props.selected}
        width={200}
      >
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <Pill>{d.model.replace('claude-', '')}</Pill>
        </div>
      </NodeShell>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function ClassifyNode({ data, selected, id }: NodeProps) {
  const d = data as unknown as ClassifyNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<ListChecks className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="Classify"
        selected={selected}
        width={220}
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
          position={Position.Right}
          id={label}
          style={{ top: 60 + i * 22 }}
        />
      ))}
    </>
  );
}

export function IfElseNode({ data, selected, id }: NodeProps) {
  const d = data as unknown as IfElseNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<GitBranch className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="If / else"
        selected={selected}
        width={200}
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
          position={Position.Right}
          id={label}
          style={{ top: 60 + i * 22 }}
        />
      ))}
    </>
  );
}

export function WhileNode({ data, selected }: NodeProps) {
  const d = data as unknown as WhileNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Repeat className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="While"
        selected={selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function ApprovalNode({ data, selected }: NodeProps) {
  const d = data as unknown as ApprovalNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<CheckSquare className="w-4 h-4 text-amber-700" />}
        iconBg="#FCEFD5"
        title={d.label}
        subtitle="User approval"
        selected={selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function MemoryNode({ data, selected }: NodeProps) {
  const d = data as unknown as MemoryNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Database className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={`store: ${d.storeName}`}
        selected={selected}
        width={200}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function GuardrailsNode({ data, selected }: NodeProps) {
  const d = data as unknown as GuardrailsNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Shield className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={`${d.rules.length} rule${d.rules.length === 1 ? '' : 's'}`}
        selected={selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function MCPNode({ data, selected }: NodeProps) {
  const d = data as unknown as MCPNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Boxes className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={d.server}
        selected={selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function FileSearchNode({ data, selected }: NodeProps) {
  const d = data as unknown as FileSearchNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Search className="w-4 h-4 text-amber-900" />}
        iconBg="#F4ECE0"
        title={d.label}
        subtitle={d.source}
        selected={selected}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function SkillNode({ data, selected }: NodeProps) {
  const d = data as unknown as SkillNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell
        icon={<Sparkles className="w-4 h-4 text-zinc-700" />}
        iconBg="#EFEFEF"
        title={d.label}
        subtitle="Skill"
        selected={selected}
        width={200}
      />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function NoteNode({ data, selected }: NodeProps) {
  const d = data as unknown as NoteNodeData;
  return (
    <NodeShell
      icon={<StickyNote className="w-4 h-4 text-yellow-700" />}
      iconBg="#FFF8DD"
      title={d.label}
      subtitle={d.body}
      selected={selected}
    />
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
    <div className="flex items-center justify-between text-[11px] bg-canvas/70 px-2 py-1 rounded">
      <span className="text-ink/80 truncate">{label}</span>
      <span className="w-2 h-2 rounded-full border border-border bg-white shrink-0" />
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
