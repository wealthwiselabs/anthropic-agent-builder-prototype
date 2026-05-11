import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Code2,
  Wrench,
  PlayCircle,
  Rocket,
  Settings,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import { EMAIL_FINAL } from '../data/emailDemo';
import type { TemplateId } from '../types';
import { useStore } from '../store/useStore';
import { Canvas } from '../components/canvas/Canvas';
import { NodePalette } from '../components/NodePalette';
import { NodeInspector } from '../components/NodeInspector';
import { ChatSidebar } from '../components/ChatSidebar';
import { TestPanel } from '../components/TestPanel';
import { ContextPanel } from '../components/ContextPanel';
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
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const navigate = useNavigate();
  const [deployOpen, setDeployOpen] = useState(false);

  const setHasTested = useStore((s) => s.setHasTested);
  useEffect(() => {
    const tpl = TEMPLATES[templateId] ?? TEMPLATES.blank;
    setGraph(tpl.graph);
    setCurrentTemplate(templateId);
    setAgentName(tpl.name);
    // Always reset to Build when a new template loads.
    setMode('build');
    setHasTested(false);
  }, [templateId, setGraph, setCurrentTemplate, setAgentName, setMode, setHasTested]);

  // Clicking the "Deploy" wizard step opens the deploy modal.
  // It doesn't permanently switch into a 'deploy' mode panel — the modal IS the deploy step.
  const onWizardChange = (next: 'build' | 'test' | 'deploy') => {
    if (next === 'deploy') {
      setDeployOpen(true);
      return;
    }
    // If the reviewer jumps to Test while the Email graph is still in its
    // blank demo-shell state, fast-forward to the finished graph so Test
    // responses have real nodes to reference and highlight.
    if (
      next === 'test' &&
      templateId === 'email' &&
      useStore.getState().graph.nodes.length <= 2
    ) {
      setGraph(EMAIL_FINAL);
    }
    setMode(next);
  };

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
          <WizardSteps current={mode} onChange={onWizardChange} />
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton title="More"><MoreHorizontal className="w-4 h-4" /></IconButton>
          <IconButton title="Settings"><Settings className="w-4 h-4" /></IconButton>
          {mode === 'build' && (
            <button
              onClick={() => setView(view === 'graph' ? 'code' : 'graph')}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm hover:bg-canvas',
                view === 'code' ? 'text-coral' : 'text-ink'
              )}
              title="Toggle Code view"
            >
              <Code2 className="w-4 h-4" /> Code
            </button>
          )}
          <button
            onClick={() => setDeployOpen(true)}
            className="ml-1 px-3.5 py-1.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink/90"
          >
            Deploy
          </button>
        </div>
      </header>

      {/* Body switches based on wizard mode. */}
      {mode === 'build' ? (
        <BuildBody
          view={view}
          onCloseCode={() => setView('graph')}
          onAdvance={() => onWizardChange('test')}
        />
      ) : (
        <TestBody onAdvance={() => onWizardChange('deploy')} />
      )}

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

// ---- Build mode ----
//
// Three-pane layout: chat copilot (primary, left) | canvas / code view (center)
// | palette by default (right), swapped to inspector when a node is selected.
function BuildBody({
  view,
  onCloseCode,
  onAdvance,
}: {
  view: 'graph' | 'code';
  onCloseCode: () => void;
  onAdvance: () => void;
}) {
  const graph = useStore((s) => s.graph);
  const chat = useStore((s) => s.chat);
  const demoRunning = useStore((s) => s.demoRunning);
  // Show the "Next: Test" CTA once the graph has real content
  // (more than just Start + End) and the demo isn't actively building.
  const showAdvance = view === 'graph' && graph.nodes.length > 2 && !demoRunning;
  // Promote to primary once the user (or completed demo) has actually
  // engaged with Build: more than the initial copilot greeting in chat
  // OR substantial graph content beyond a barebones template.
  const primary = chat.length > 1 || graph.nodes.length > 4;
  return (
    <div className="flex-1 flex min-h-0">
      <aside className="w-[320px] shrink-0 border-r border-border bg-chrome">
        <ChatSidebar />
      </aside>
      <div className="flex-1 min-w-0 relative bg-canvas">
        {view === 'graph' ? <Canvas /> : <CodeView onClose={onCloseCode} />}
        {showAdvance && (
          <NextStepCTA label="Next: Test" onClick={onAdvance} primary={primary} />
        )}
      </div>
      <RightContextPanel />
    </div>
  );
}

function RightContextPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  if (selectedNodeId) {
    return (
      <aside className="w-[340px] shrink-0 border-l border-border bg-chrome">
        <NodeInspector
          nodeId={selectedNodeId}
          onClose={() => selectNode(null)}
        />
      </aside>
    );
  }
  return <NodePalette />;
}

// ---- Test mode ----
//
// Chat-with-agent takes the main column. Right column stacks a small
// read-only graph preview (active node pulses as the agent "executes")
// on top of the Context panel (data sources the agent has access to).
// To edit the graph, click "1 Build" in the wizard breadcrumb.
function TestBody({ onAdvance }: { onAdvance: () => void }) {
  const hasTested = useStore((s) => s.hasTested);
  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 min-w-0 bg-chrome relative">
        <TestPanel />
        <NextStepCTA label="Next: Deploy" onClick={onAdvance} primary={hasTested} />
      </div>
      <aside className="w-[340px] shrink-0 border-l border-border bg-chrome flex flex-col min-h-0">
        <div className="h-[44%] min-h-[260px] border-b border-border relative bg-canvas">
          <div className="absolute top-2 left-3 z-10 text-[11px] text-muted bg-white/90 border border-border rounded-full px-2 py-0.5 shadow-sm">
            Execution trace
          </div>
          <Canvas />
        </div>
        <div className="flex-1 min-h-0">
          <ContextPanel />
        </div>
      </aside>
    </div>
  );
}

// ---- Wizard breadcrumb ----

function WizardSteps({
  current,
  onChange,
}: {
  current: 'build' | 'test' | 'deploy';
  onChange: (next: 'build' | 'test' | 'deploy') => void;
}) {
  return (
    <div className="inline-flex items-center bg-white border border-border rounded-full p-0.5">
      <Step n={1} icon={<Wrench className="w-3 h-3" />} label="Build"
        active={current === 'build'} onClick={() => onChange('build')} />
      <Sep />
      <Step n={2} icon={<PlayCircle className="w-3 h-3" />} label="Test"
        active={current === 'test'} onClick={() => onChange('test')} />
      <Sep />
      <Step n={3} icon={<Rocket className="w-3 h-3" />} label="Deploy"
        active={false} onClick={() => onChange('deploy')} />
    </div>
  );
}

function Step({
  n,
  icon,
  label,
  active,
  onClick,
}: {
  n: number;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors',
        active
          ? 'bg-canvas text-ink'
          : 'text-muted hover:text-ink'
      )}
    >
      <span
        className={clsx(
          'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium',
          active ? 'bg-ink text-white' : 'bg-border/60 text-muted'
        )}
      >
        {n}
      </span>
      {icon}
      {label}
    </button>
  );
}

function Sep() {
  return <span className="w-3 h-px bg-border mx-0.5" />;
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

// Floating call-to-action that nudges the reviewer to the next wizard step.
// Sits at the top-right of the active body region, directly below the header's
// Deploy button. Starts in secondary (outlined white) styling and promotes to
// primary (solid ink) once the user has taken meaningful action in the
// current step — built something in Build mode, or sent a test prompt in
// Test mode. The promotion is a subtle "yes, this is the next thing to do".
function NextStepCTA({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all animate-fade-in ' +
        (primary
          ? 'bg-ink text-white shadow-md hover:bg-ink/90 hover:shadow-lg hover:-translate-y-px'
          : 'bg-white border border-ink/80 text-ink shadow-sm hover:shadow-md hover:bg-canvas')
      }
    >
      {label} <ArrowRight className="w-4 h-4" />
    </button>
  );
}

// ---- Deploy modal (unchanged from before) ----

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
