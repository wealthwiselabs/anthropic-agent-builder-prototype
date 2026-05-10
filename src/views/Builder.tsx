import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Pencil,
  Play,
  Settings,
  ClipboardCheck,
  Code2,
  MoreHorizontal,
} from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import type { TemplateId } from '../types';
import { useStore } from '../store/useStore';
import { Canvas } from '../components/canvas/Canvas';
import { NodePalette } from '../components/NodePalette';
import { NodeInspector } from '../components/NodeInspector';
import { ChatSidebar } from '../components/ChatSidebar';
import { CodeView } from '../components/CodeView';
import clsx from 'clsx';

export function Builder() {
  const [params] = useSearchParams();
  const templateId = (params.get('template') as TemplateId) || 'blank';
  const setGraph = useStore((s) => s.setGraph);
  const setCurrentTemplate = useStore((s) => s.setCurrentTemplate);
  const setAgentName = useStore((s) => s.setAgentName);
  const agentName = useStore((s) => s.agentName);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const navigate = useNavigate();
  const [deployOpen, setDeployOpen] = useState(false);

  useEffect(() => {
    const tpl = TEMPLATES[templateId] ?? TEMPLATES.blank;
    setGraph(tpl.graph);
    setCurrentTemplate(templateId);
    setAgentName(tpl.name);
  }, [templateId, setGraph, setCurrentTemplate, setAgentName]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-border bg-chrome shrink-0">
        <Link
          to="/"
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-canvas text-muted hover:text-ink"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <span className="ml-2 font-medium text-ink truncate max-w-[260px]">
          {agentName}
        </span>
        <span className="ml-2 text-[11px] uppercase tracking-wide bg-canvas text-muted px-1.5 py-0.5 rounded">
          Draft
        </span>

        <div className="flex-1 flex justify-center">
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton title="More"><MoreHorizontal className="w-4 h-4" /></IconButton>
          <IconButton title="Settings"><Settings className="w-4 h-4" /></IconButton>
          <button
            disabled
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted/70 cursor-not-allowed"
            title="Mocked in this prototype"
          >
            <ClipboardCheck className="w-4 h-4" /> Evaluate
          </button>
          <button
            onClick={() => setView('code')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm hover:bg-canvas text-ink"
          >
            <Code2 className="w-4 h-4" /> Code
          </button>
          <button
            onClick={() => setDeployOpen(true)}
            className="ml-1 px-3.5 py-1.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink/90"
          >
            Deploy
          </button>
        </div>
      </header>

      {/* Body: palette | canvas | sidebar */}
      <div className="flex-1 flex min-h-0">
        <NodePalette />
        <div className="flex-1 min-w-0 relative bg-canvas">
          {view === 'graph' ? (
            <Canvas />
          ) : (
            <CodeView onClose={() => setView('graph')} />
          )}
        </div>
        <RightSidebar />
      </div>

      {deployOpen && (
        <DeployModal
          onClose={() => setDeployOpen(false)}
          onPick={(target) => {
            setDeployOpen(false);
            navigate(`/deploy/${target}`);
          }}
        />
      )}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: 'graph' | 'code';
  onChange: (v: 'graph' | 'code') => void;
}) {
  return (
    <div className="inline-flex items-center bg-white border border-border rounded-full p-0.5">
      <button
        onClick={() => onChange('graph')}
        className={clsx(
          'flex items-center gap-1 px-3 py-1 rounded-full text-xs',
          view === 'graph' ? 'bg-canvas text-ink' : 'text-muted'
        )}
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
      <button
        onClick={() => onChange('code')}
        className={clsx(
          'flex items-center gap-1 px-3 py-1 rounded-full text-xs',
          view === 'code' ? 'bg-canvas text-ink' : 'text-muted'
        )}
      >
        <Play className="w-3 h-3" /> Code
      </button>
    </div>
  );
}

function IconButton({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-canvas text-muted"
    >
      {children}
    </button>
  );
}

// Right sidebar: shows NodeInspector when a node is selected, otherwise
// the chat copilot stub (Block 7 will fill in the chat).
function RightSidebar() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  if (selectedNodeId) {
    return (
      <aside className="w-[360px] shrink-0 border-l border-border bg-chrome">
        <NodeInspector
          nodeId={selectedNodeId}
          onClose={() => selectNode(null)}
        />
      </aside>
    );
  }
  return (
    <aside className="w-[360px] shrink-0 border-l border-border bg-chrome">
      <ChatSidebar />
    </aside>
  );
}

function DeployModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (target: 'managed' | 'github' | 'download') => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl mb-1">Deploy this agent</h2>
        <p className="text-sm text-muted mb-5">
          Same agent, same build. Pick where it runs.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <DeployCard
            title="Managed Agent"
            body="Run on Anthropic's managed runtime. Get an agent ID + endpoint."
            onClick={() => onPick('managed')}
          />
          <DeployCard
            title="Sync to GitHub"
            body="Create a repo with the generated code and push the first commit."
            onClick={() => onPick('github')}
          />
          <DeployCard
            title="Download code"
            body="Get a zip with agent.py, README, requirements, and .env.example."
            onClick={() => onPick('download')}
          />
        </div>
        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-ink px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeployCard({
  title,
  body,
  onClick,
}: {
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 border border-border rounded-lg hover:border-ink/30 hover:shadow-sm transition-all bg-white"
    >
      <div className="font-medium text-ink mb-1">{title}</div>
      <div className="text-[12px] text-muted leading-snug">{body}</div>
    </button>
  );
}
