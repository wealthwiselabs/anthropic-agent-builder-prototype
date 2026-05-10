import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import type {
  AgentNodeData,
  AnyNodeData,
  ClassifyNodeData,
  GuardrailsNodeData,
  IfElseNodeData,
  MemoryNodeData,
  ModelId,
  NoteNodeData,
  SkillNodeData,
} from '../types';
import {
  Trash2, X, Moon, Plus,
  Boxes, Search, Globe, Code2, Terminal, Image as ImageIcon,
  FunctionSquare, Settings,
} from 'lucide-react';

const MODELS: ModelId[] = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];

export function NodeInspector({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}) {
  const node = useStore((s) => s.graph.nodes.find((n) => n.id === nodeId));
  const updateNodeData = useStore((s) => s.updateNodeData);
  const removeNode = useStore((s) => s.removeNode);

  if (!node) {
    return (
      <div className="p-4 text-sm text-muted">
        Node not found. Click the canvas to dismiss.
      </div>
    );
  }

  const data = node.data as AnyNodeData;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            {labelForKind(data.kind)}
          </div>
          <input
            value={data.label}
            onChange={(e) =>
              updateNodeData(nodeId, { label: e.target.value } as Partial<AgentNodeData>)
            }
            className="font-medium text-ink bg-transparent outline-none w-full"
          />
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-canvas text-muted"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {(data.kind === 'agent' || data.kind === 'subagent') && (
          <AgentFields nodeId={nodeId} data={data as AgentNodeData} />
        )}
        {data.kind === 'classify' && (
          <ClassifyFields
            nodeId={nodeId}
            data={data as ClassifyNodeData}
          />
        )}
        {data.kind === 'ifelse' && (
          <IfElseFields nodeId={nodeId} data={data as IfElseNodeData} />
        )}
        {data.kind === 'memory' && (
          <MemoryFields nodeId={nodeId} data={data as MemoryNodeData} />
        )}
        {data.kind === 'guardrails' && (
          <GuardrailsFields nodeId={nodeId} data={data as GuardrailsNodeData} />
        )}
        {data.kind === 'skill' && (
          <SkillFields nodeId={nodeId} data={data as SkillNodeData} />
        )}
        {data.kind === 'note' && (
          <NoteFields nodeId={nodeId} data={data as NoteNodeData} />
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={() => {
            removeNode(nodeId);
            onClose();
          }}
          className="flex items-center gap-1.5 text-sm text-red-700 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" /> Delete node
        </button>
      </div>
    </div>
  );
}

function labelForKind(kind: AnyNodeData['kind']): string {
  return (
    {
      agent: 'Agent',
      subagent: 'Subagent',
      classify: 'Classify',
      ifelse: 'If / else',
      while: 'While',
      approval: 'User approval',
      memory: 'Memory store',
      guardrails: 'Guardrails',
      mcp: 'MCP server',
      fileSearch: 'File search',
      skill: 'Skill',
      note: 'Note',
      start: 'Start',
      end: 'End',
    } as Record<AnyNodeData['kind'], string>
  )[kind];
}

function AgentFields({ nodeId, data }: { nodeId: string; data: AgentNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  return (
    <>
      <Field label="Prompt">
        <textarea
          value={data.prompt}
          onChange={(e) =>
            updateNodeData(nodeId, { prompt: e.target.value } as Partial<AgentNodeData>)
          }
          rows={4}
          className="w-full text-sm bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-ink/40 font-mono"
        />
      </Field>
      <Field label="Model">
        <select
          value={data.model}
          onChange={(e) =>
            updateNodeData(nodeId, {
              model: e.target.value as ModelId,
            } as Partial<AgentNodeData>)
          }
          className="w-full text-sm bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-ink/40"
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tools">
        <div className="flex flex-wrap gap-1">
          {data.tools.length === 0 && (
            <span className="text-muted text-xs">None</span>
          )}
          {data.tools.map((t) => (
            <button
              key={t}
              onClick={() =>
                updateNodeData(nodeId, {
                  tools: data.tools.filter((x) => x !== t),
                } as Partial<AgentNodeData>)
              }
              className="inline-flex items-center gap-1 text-[11px] bg-canvas border border-border rounded-full px-2 py-0.5 hover:border-ink/30"
            >
              {t} <X className="w-3 h-3 text-muted" />
            </button>
          ))}
          <AddToolButton
            onAdd={(t) =>
              updateNodeData(nodeId, {
                tools: [...data.tools, t],
              } as Partial<AgentNodeData>)
            }
          />
        </div>
      </Field>
      <Field label="Memory & Dreaming">
        <ToggleRow
          checked={!!data.dreaming}
          onChange={(checked) =>
            updateNodeData(nodeId, { dreaming: checked } as Partial<AgentNodeData>)
          }
          icon={<Moon className="w-3.5 h-3.5" />}
          label="Enable dreaming"
          hint="Research preview. Background process reviews sessions and consolidates memory patterns."
        />
      </Field>
    </>
  );
}

// Tool picker — opens a popover with a categorized list of tools (modeled
// after the "Add tool" picker in mature agent builders). Picking an item
// adds it to the agent's `tools` array; "Custom" prompts for a free-form name.
type ToolEntry = { name: string; icon: React.ReactNode };
const TOOL_GROUPS: { label: string; items: ToolEntry[] }[] = [
  {
    label: 'Hosted',
    items: [
      { name: 'mcp_server',       icon: <Boxes className="w-3.5 h-3.5" /> },
      { name: 'file_search',      icon: <Search className="w-3.5 h-3.5" /> },
      { name: 'web_search',       icon: <Globe className="w-3.5 h-3.5" /> },
      { name: 'code_interpreter', icon: <Code2 className="w-3.5 h-3.5" /> },
      { name: 'shell',            icon: <Terminal className="w-3.5 h-3.5" /> },
      { name: 'image_generation', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Local',
    items: [
      { name: 'function', icon: <FunctionSquare className="w-3.5 h-3.5" /> },
      { name: 'custom',   icon: <Settings className="w-3.5 h-3.5" /> },
    ],
  },
];

function AddToolButton({ onAdd }: { onAdd: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside dismiss.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const pick = (name: string) => {
    if (name === 'custom') {
      const t = window.prompt('Custom tool name (e.g. mcp:notion)');
      if (t) onAdd(t);
    } else {
      onAdd(name);
    }
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 text-[11px] bg-white border border-dashed border-border rounded-full px-2 py-0.5 text-muted hover:text-ink hover:border-ink/30"
      >
        <Plus className="w-3 h-3" /> Add
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-white border border-border rounded-lg shadow-lg py-1.5 animate-fade-in">
          {TOOL_GROUPS.map((g, gi) => (
            <div key={g.label}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted">
                {g.label}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.name}
                  onClick={() => pick(it.name)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-ink hover:bg-canvas text-left"
                >
                  <span className="w-5 h-5 rounded bg-canvas text-muted flex items-center justify-center shrink-0">
                    {it.icon}
                  </span>
                  {it.name}
                </button>
              ))}
              {gi < TOOL_GROUPS.length - 1 && (
                <div className="my-1 border-t border-border" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassifyFields({ nodeId, data }: { nodeId: string; data: ClassifyNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const setBranch = (i: number, v: string) => {
    const next = [...data.intents];
    next[i] = v;
    updateNodeData(nodeId, { intents: next } as Partial<ClassifyNodeData>);
  };
  return (
    <Field label="Intents">
      <div className="space-y-1.5">
        {data.intents.map((it, i) => (
          <input
            key={i}
            value={it}
            onChange={(e) => setBranch(i, e.target.value)}
            className="w-full text-sm bg-white border border-border rounded-md px-3 py-1.5 outline-none focus:border-ink/40"
          />
        ))}
      </div>
    </Field>
  );
}

function IfElseFields({ nodeId, data }: { nodeId: string; data: IfElseNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const setBranch = (i: number, v: string) => {
    const next = [...data.branches];
    next[i] = v;
    updateNodeData(nodeId, { branches: next } as Partial<IfElseNodeData>);
  };
  return (
    <Field label="Branches">
      <div className="space-y-1.5">
        {data.branches.map((b, i) => (
          <input
            key={i}
            value={b}
            onChange={(e) => setBranch(i, e.target.value)}
            className="w-full text-sm bg-white border border-border rounded-md px-3 py-1.5 outline-none focus:border-ink/40"
          />
        ))}
      </div>
    </Field>
  );
}

function MemoryFields({ nodeId, data }: { nodeId: string; data: MemoryNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  return (
    <Field label="Store name">
      <input
        value={data.storeName}
        onChange={(e) =>
          updateNodeData(nodeId, { storeName: e.target.value } as Partial<MemoryNodeData>)
        }
        className="w-full text-sm bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-ink/40 font-mono"
      />
    </Field>
  );
}

function GuardrailsFields({ nodeId, data }: { nodeId: string; data: GuardrailsNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  return (
    <Field label="Rules">
      <div className="space-y-1.5">
        {data.rules.map((r, i) => (
          <input
            key={i}
            value={r}
            onChange={(e) => {
              const next = [...data.rules];
              next[i] = e.target.value;
              updateNodeData(nodeId, { rules: next } as Partial<GuardrailsNodeData>);
            }}
            className="w-full text-sm bg-white border border-border rounded-md px-3 py-1.5 outline-none focus:border-ink/40"
          />
        ))}
      </div>
    </Field>
  );
}

function SkillFields({ nodeId, data }: { nodeId: string; data: SkillNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  return (
    <Field label="Description">
      <textarea
        value={data.description}
        onChange={(e) =>
          updateNodeData(nodeId, { description: e.target.value } as Partial<SkillNodeData>)
        }
        rows={3}
        className="w-full text-sm bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-ink/40"
      />
    </Field>
  );
}

function NoteFields({ nodeId, data }: { nodeId: string; data: NoteNodeData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  return (
    <Field label="Body">
      <textarea
        value={data.body}
        onChange={(e) =>
          updateNodeData(nodeId, { body: e.target.value } as Partial<NoteNodeData>)
        }
        rows={4}
        className="w-full text-sm bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-ink/40"
      />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  icon,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          'relative shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors ' +
          (checked ? 'bg-coral' : 'bg-border')
        }
        role="switch"
        aria-checked={checked}
      >
        <span
          className={
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-[left] duration-150 ease-out ' +
            (checked ? 'left-[22px]' : 'left-0.5')
          }
        />
      </button>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5 text-sm text-ink">
          {icon} {label}
        </div>
        {hint && <div className="text-[11px] text-muted mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}
