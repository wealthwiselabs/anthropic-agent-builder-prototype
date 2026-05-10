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
  Square,
  ListChecks,
  ArrowLeftRight,
  Variable,
} from 'lucide-react';
import type { NodeKind, AnyNodeData } from '../types';

// Each palette entry knows how to mint a fresh node of its kind.
type PaletteEntry = {
  kind: NodeKind;
  label: string;
  icon: React.ReactNode;
  defaults: () => AnyNodeData;
  bg: string;
};

const ENTRIES: { group: string; items: PaletteEntry[] }[] = [
  {
    group: 'Core',
    items: [
      {
        kind: 'agent',
        label: 'Agent',
        icon: <Bot className="w-4 h-4 text-blue-700" />,
        bg: '#EDF1FA',
        defaults: () => ({
          kind: 'agent',
          label: 'New agent',
          prompt: 'You are a helpful assistant.',
          model: 'claude-sonnet-4-6',
          tools: [],
        }),
      },
      {
        kind: 'classify',
        label: 'Classify',
        icon: <ListChecks className="w-4 h-4 text-amber-700" />,
        bg: '#FCEFD5',
        defaults: () => ({
          kind: 'classify',
          label: 'Classify',
          intents: ['option a', 'option b'],
        }),
      },
      {
        kind: 'end',
        label: 'End',
        icon: <Square className="w-4 h-4 text-emerald-700" />,
        bg: '#E8F3EB',
        defaults: () => ({ kind: 'end', label: 'End' }),
      },
      {
        kind: 'note',
        label: 'Note',
        icon: <StickyNote className="w-4 h-4 text-yellow-700" />,
        bg: '#FFF8DD',
        defaults: () => ({ kind: 'note', label: 'Note', body: 'Your note…' }),
      },
    ],
  },
  {
    group: 'Tools',
    items: [
      {
        kind: 'fileSearch',
        label: 'File search',
        icon: <Search className="w-4 h-4 text-amber-900" />,
        bg: '#F4ECE0',
        defaults: () => ({ kind: 'fileSearch', label: 'File search', source: 'docs' }),
      },
      {
        kind: 'memory',
        label: 'Memory store',
        icon: <Database className="w-4 h-4 text-amber-900" />,
        bg: '#F4ECE0',
        defaults: () => ({ kind: 'memory', label: 'Memory store', storeName: 'default' }),
      },
      {
        kind: 'guardrails',
        label: 'Guardrails',
        icon: <Shield className="w-4 h-4 text-amber-900" />,
        bg: '#F4ECE0',
        defaults: () => ({
          kind: 'guardrails',
          label: 'Guardrails',
          rules: ['no PII leakage'],
        }),
      },
      {
        kind: 'mcp',
        label: 'MCP',
        icon: <Boxes className="w-4 h-4 text-amber-900" />,
        bg: '#F4ECE0',
        defaults: () => ({ kind: 'mcp', label: 'MCP', server: 'mcp:server' }),
      },
    ],
  },
  {
    group: 'Logic',
    items: [
      {
        kind: 'ifelse',
        label: 'If / else',
        icon: <GitBranch className="w-4 h-4 text-amber-700" />,
        bg: '#FCEFD5',
        defaults: () => ({
          kind: 'ifelse',
          label: 'If / else',
          branches: ['if', 'else'],
        }),
      },
      {
        kind: 'while',
        label: 'While',
        icon: <Repeat className="w-4 h-4 text-amber-700" />,
        bg: '#FCEFD5',
        defaults: () => ({ kind: 'while', label: 'While', condition: 'continue?' }),
      },
      {
        kind: 'approval',
        label: 'User approval',
        icon: <CheckSquare className="w-4 h-4 text-amber-700" />,
        bg: '#FCEFD5',
        defaults: () => ({ kind: 'approval', label: 'User approval' }),
      },
      {
        kind: 'skill',
        label: 'Skill',
        icon: <Sparkles className="w-4 h-4 text-zinc-700" />,
        bg: '#EFEFEF',
        defaults: () => ({
          kind: 'skill',
          label: 'New skill',
          description: 'Describe what this skill does.',
        }),
      },
    ],
  },
  {
    group: 'Data',
    items: [
      {
        kind: 'agent',
        label: 'Transform',
        icon: <ArrowLeftRight className="w-4 h-4 text-purple-700" />,
        bg: '#F2EEFB',
        defaults: () => ({
          kind: 'agent',
          label: 'Transform',
          prompt: 'Transform input.',
          model: 'claude-haiku-4-5',
          tools: [],
        }),
      },
      {
        kind: 'agent',
        label: 'Set state',
        icon: <Variable className="w-4 h-4 text-purple-700" />,
        bg: '#F2EEFB',
        defaults: () => ({
          kind: 'agent',
          label: 'Set state',
          prompt: 'Set state.',
          model: 'claude-haiku-4-5',
          tools: [],
        }),
      },
    ],
  },
];

export function NodePalette() {
  return (
    <aside className="w-[210px] shrink-0 border-r border-border bg-chrome p-3 overflow-y-auto">
      {ENTRIES.map((g) => (
        <div key={g.group} className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-muted px-1 mb-1">
            {g.group}
          </div>
          {g.items.map((it) => (
            <PaletteRow key={`${g.group}-${it.label}`} entry={it} />
          ))}
        </div>
      ))}
    </aside>
  );
}

function PaletteRow({ entry }: { entry: PaletteEntry }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/x-node',
      JSON.stringify({ kind: entry.kind, defaults: entry.defaults() })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 text-sm text-ink/85 px-2 py-1.5 rounded-md hover:bg-canvas cursor-grab active:cursor-grabbing"
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ background: entry.bg }}
      >
        {entry.icon}
      </span>
      {entry.label}
    </div>
  );
}
