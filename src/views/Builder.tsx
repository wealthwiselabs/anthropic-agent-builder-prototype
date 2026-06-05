import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Code2,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import { EMAIL_FINAL } from '../data/emailDemo';
import { evalSuggestions } from '../data/evalSuggestions';
import type { TemplateId } from '../types';
import { useStore } from '../store/useStore';
import { Canvas } from '../components/canvas/Canvas';
import { NavRevealButton } from '../components/NavToggle';
import { NodePalette } from '../components/NodePalette';
import { NodeInspector } from '../components/NodeInspector';
import { ChatSidebar } from '../components/ChatSidebar';
import { TestPanel } from '../components/TestPanel';
import { ContextPanel } from '../components/ContextPanel';
import { CodeView } from '../components/CodeView';
import { EvalCalloutBanner } from '../components/EvalCalloutBanner';
import { WizardSteps, type WizardMode } from '../components/WizardSteps';

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

  const setHasTested = useStore((s) => s.setHasTested);
  const clearChat = useStore((s) => s.clearChat);

  // Eval (B1) deep-link context. Presence of `from=eval` activates the
  // callout banner; the suggestion key picks the copy from evalSuggestions.
  const fromEval = params.get('from') === 'eval';
  const suggestionKey = params.get('suggestion');
  const project = params.get('project');
  // Prefill text for the chat input — set when B1 deep-links a suggestion
  // CTA so the user just reviews + hits Send (no auto-submit).
  const prefill = params.get('prefill') ?? '';
  const evalSuggestion =
    fromEval && suggestionKey ? evalSuggestions[suggestionKey] : undefined;
  const evalBackUrl = evalSuggestion
    ? `https://wealthwiselabs.github.io/anthropic-eval-prototype/eval/travel-agent/clusters/${evalSuggestion.clusterId}`
    : undefined;

  useEffect(() => {
    const tpl = TEMPLATES[templateId] ?? TEMPLATES.blank;
    setGraph(tpl.graph);
    setCurrentTemplate(templateId);
    setAgentName(tpl.name);
    // Default to Build, but allow the URL to pin to Test or Deploy so the
    // deploy-success pages can deep-link the user back to the right step.
    const urlMode = (params.get('mode') as WizardMode) || 'build';
    const allowedMode: WizardMode =
      urlMode === 'test' || urlMode === 'deploy' ? urlMode : 'build';
    setMode(allowedMode);
    setHasTested(false);
    // Reset chat too — otherwise messages from the previous agent leak into
    // a new build session.
    clearChat();
  }, [templateId, params, setGraph, setCurrentTemplate, setAgentName, setMode, setHasTested, clearChat]);

  // The wizard switches the body region between Build, Test, and Deploy.
  // Deploy is its own embedded panel (not a modal) so the three-step flow
  // reads as a real journey, not a side-trip.
  const onWizardChange = (next: 'build' | 'test' | 'deploy') => {
    // If the reviewer jumps past Build on the Email cold-start, fast-forward
    // to the finished graph so Test/Deploy have real content to operate on.
    if (
      (next === 'test' || next === 'deploy') &&
      templateId === 'email' &&
      useStore.getState().graph.nodes.length <= 2
    ) {
      setGraph(EMAIL_FINAL);
    }
    setMode(next);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Eval-handoff callout — only when the user lands via a B1 suggestion CTA. */}
      {evalSuggestion && (
        <EvalCalloutBanner
          suggestion={evalSuggestion}
          project={project}
          evalBackUrl={evalBackUrl}
        />
      )}
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-border bg-chrome shrink-0">
        <NavRevealButton />
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
          {mode !== 'deploy' && (
            <button
              onClick={() => onWizardChange('deploy')}
              className="ml-1 px-3.5 py-1.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink/90"
            >
              Deploy
            </button>
          )}
        </div>
      </header>

      {/* Body switches based on wizard mode. */}
      {mode === 'build' && (
        <BuildBody
          view={view}
          setView={setView}
          onCloseCode={() => setView('graph')}
          onAdvance={() => onWizardChange('test')}
          prefill={prefill}
        />
      )}
      {mode === 'test' && (
        <TestBody onAdvance={() => onWizardChange('deploy')} />
      )}
      {mode === 'deploy' && (
        <DeployBody
          onPick={(target) => navigate(`/deploy/${target}`)}
          onBack={() => onWizardChange('test')}
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
  setView,
  prefill,
}: {
  view: 'graph' | 'code';
  onCloseCode: () => void;
  onAdvance: () => void;
  setView: (v: 'graph' | 'code') => void;
  prefill: string;
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
        <ChatSidebar initialDraft={prefill} />
      </aside>
      <div className="flex-1 min-w-0 relative bg-canvas">
        {view === 'graph' ? <Canvas /> : <CodeView onClose={onCloseCode} />}
        {view === 'graph' && <CodeChip onClick={() => setView('code')} />}
        {showAdvance && (
          <NextStepCTA label="Next: Test" onClick={onAdvance} primary={primary} />
        )}
      </div>
      <RightContextPanel />
    </div>
  );
}

// Subtle top-left "Code" chip that opens the read-only Python view.
// Lives on the canvas (not the header) so reviewers can ignore it unless
// they're curious about what the graph compiles to.
function CodeChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="See the SDK code this graph compiles to"
      className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-border text-muted text-[12px] hover:text-ink hover:border-ink/30 shadow-sm transition-colors"
    >
      <Code2 className="w-3.5 h-3.5" /> Code
    </button>
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
        'absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all animate-fade-in ' +
        (primary
          ? 'bg-ink text-white shadow-md hover:bg-ink/90 hover:shadow-lg hover:-translate-y-px'
          : 'bg-white border border-ink/80 text-ink shadow-sm hover:shadow-md hover:bg-canvas')
      }
    >
      {label}
    </button>
  );
}

// ---- Deploy mode ----
//
// Step 3 of the wizard: a full embedded panel with the three deploy targets
// as cards (no modal). Picking a target navigates to the corresponding
// success route which renders inside the Console chrome.
function DeployBody({
  onPick,
  onBack,
}: {
  onPick: (target: 'managed' | 'github' | 'download') => void;
  onBack: () => void;
}) {
  const agentName = useStore((s) => s.agentName);
  const graph = useStore((s) => s.graph);
  return (
    <div className="flex-1 overflow-y-auto bg-canvas">
      <div className="max-w-4xl mx-auto px-10 py-12">
        <h1 className="font-serif text-3xl text-ink mb-2">
          Where should <span className="italic">{agentName}</span> run?
        </h1>
        <p className="text-muted mb-8 max-w-xl">
          Same agent, same build. Pick a target — managed runtime,
          your own repo, or a downloadable zip you can run locally.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <DeployCard
            title="Managed Agent"
            body="Run on Anthropic's managed runtime. Get an agent ID and an HTTPS endpoint you can call from anywhere."
            cta="Deploy as managed"
            onClick={() => onPick('managed')}
          />
          <DeployCard
            title="Sync to GitHub"
            body="Create a repo with the generated code and push the first commit. Future changes deploy via your CI."
            cta="Push to GitHub"
            onClick={() => onPick('github')}
          />
          <DeployCard
            title="Download code"
            body="Get a zip with agent.py, README, requirements.txt, and .env.example — run locally with your own infra."
            cta="Download .zip"
            onClick={() => onPick('download')}
          />
        </div>

        <div className="bg-white border border-border rounded-lg p-4 mb-6 text-[12px] text-muted">
          <span className="text-ink">Graph summary:</span>{' '}
          {graph.nodes.length} nodes · {graph.edges.length} edges. Switch back
          to Build to adjust before deploying.
        </div>

        <button
          onClick={onBack}
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to Test
        </button>
      </div>
    </div>
  );
}

function DeployCard({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 border border-border rounded-xl hover:border-ink/30 hover:shadow-md transition-all bg-white flex flex-col gap-3 min-h-[200px]"
    >
      <div>
        <div className="font-medium text-ink mb-1.5">{title}</div>
        <div className="text-[12px] text-muted leading-snug">{body}</div>
      </div>
      <div className="mt-auto inline-flex items-center self-start text-[12px] text-coral font-medium">
        {cta} →
      </div>
    </button>
  );
}
