import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp, Sparkles, Wand2, FastForward } from 'lucide-react';
import { useStore } from '../store/useStore';
import { matchEntry, fallbackEntry } from '../data/chatScript';
import {
  EMAIL_DEMO_PROMPT,
  EMAIL_DEMO_STEPS,
  EMAIL_FINAL,
  type DemoStep,
} from '../data/emailDemo';
import type { Graph, TemplateId } from '../types';
import clsx from 'clsx';

// Empty-state suggestion chips per template. Each chip's text routes
// through the same matchEntry → mutation pipeline that handles typed
// chat input, so chips and free-form prompts converge on the same logic.
const TEMPLATE_CHIPS: Partial<Record<TemplateId, string[]>> = {
  travel: [
    'Add a budget guardrail',
    'Switch the coordinator to Opus',
    'Add a memory store for past trips',
    'Add web search to the coordinator',
  ],
  support: [
    'Add a sentiment guardrail before End',
    'Use Sonnet for all branches',
    'Enable dreaming on the refund agent',
    'Escalate to a human on low confidence',
  ],
  blank: [
    'Add a memory store',
    'Parallelize this agent',
    'Add web search',
    'Add a guardrail',
  ],
};

// Timing constants — the "AI working" feel comes from these spaced-out steps.
const THINK_MS = 700;
const NODES_MS = 250;
const EDGES_MS = 500;

// Per-demo-step pacing.
const STEP_GAP_MS = 600;        // pause between consecutive demo steps
const STEP_THINK_MS = 650;      // thinking dots before reply text appears

// Module-level guard that survives unmount/remount cycles. Tracks the
// (template, prompt) pair we've already auto-dispatched for, so the
// effect can't push the user message + start the demo more than once
// for the same URL state — even if Builder's template-load effect
// fires twice and wipes/repopulates the chat.
let autoplayedFor: string | null = null;

export function ChatSidebar({ initialDraft = '' }: { initialDraft?: string } = {}) {
  const chat = useStore((s) => s.chat);
  const pushChat = useStore((s) => s.pushChat);
  const updateChat = useStore((s) => s.updateChat);
  const graph = useStore((s) => s.graph);
  const setGraph = useStore((s) => s.setGraph);
  const currentTemplate = useStore((s) => s.currentTemplate);
  const demoRunning = useStore((s) => s.demoRunning);
  const setDemoRunning = useStore((s) => s.setDemoRunning);
  const [params] = useSearchParams();
  // Seed the chat draft from `initialDraft` (B1 eval prefill) so the user
  // just reviews + hits Send. Only the first-mount value matters; once the
  // user edits, the prop is ignored.
  const [input, setInput] = useState(initialDraft);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Demo state.
  // - demoRunning (in store): true while the staged build-up is playing.
  //   Lifted to the store so the Builder's "Next: Test" CTA can hide.
  // - demoPending: true when this Email session hasn't run the demo yet
  //   AND the graph is still in its blank-shell state.
  // - timeouts: collected so Skip can cancel pending steps cleanly.
  // - runDemoRef: lets the mount-time useEffect kick off the demo without
  //   a forward-reference to the runDemo function defined below.
  const demoPendingRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const runDemoRef = useRef<((g: Graph) => void) | null>(null);

  // On template load: Email keeps the cold-start demo flow; the other
  // templates land in a clean empty-state with curated suggestion chips
  // (no auto-pushed greeting — it was a wall of text reviewers had to
  // dismiss in their head before doing anything).
  useEffect(() => {
    if (!currentTemplate) return;
    // Reset the autoplay lock when leaving email so a future visit
    // re-fires the demo cleanly.
    if (currentTemplate !== 'email') {
      autoplayedFor = null;
      return;
    }

    if (chat.length !== 0) return;

    const autoplay = params.get('autoplay') === '1';
    const urlPrompt = params.get('prompt') || EMAIL_DEMO_PROMPT;
    const key = `${currentTemplate}:${urlPrompt}:${autoplay}`;
    if (autoplayedFor === key) return; // already dispatched for this URL state

    if (autoplay) {
      autoplayedFor = key;
      pushChat({ role: 'user', text: urlPrompt });
      demoPendingRef.current = false;
      runDemoRef.current?.(useStore.getState().graph);
    } else {
      autoplayedFor = key;
      demoPendingRef.current = true;
      setInput(EMAIL_DEMO_PROMPT);
      pushChat({
        role: 'copilot',
        text: "Watch me build an email assistant from scratch. I've pre-filled a prompt — hit send and I'll wire it up step by step. You can skip ahead at any point.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate]);

  // Reset demo timeouts on unmount / template switch.
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  // When B1 prefilled a draft, focus the chat input on mount so the user
  // can review + hit Enter (or click Send) immediately. We only auto-focus
  // when there's actually prefilled text — otherwise we'd steal focus on
  // every Builder load.
  useEffect(() => {
    if (initialDraft) {
      inputRef.current?.focus();
      // Put the caret at the end so editing feels natural.
      const el = inputRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }
    // Intentionally mount-only — re-running on prop change would fight the
    // user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoscroll to bottom on new message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chat]);

  const schedule = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timeoutsRef.current.push(t);
  };

  // Walk through the demo steps sequentially. Each step reuses the same
  // thinking → reply → staged graph mutation pipeline as the normal chat.
  // Stored on a ref so the mount-time useEffect can call it without a
  // forward-reference.
  const runDemo = (initialGraph: Graph) => {
    setDemoRunning(true);
    let acc = initialGraph;
    let delay = 0;

    EMAIL_DEMO_STEPS.forEach((step: DemoStep, idx) => {
      const stepStart = delay;
      const before = acc;
      const after = step.mutation(acc);
      acc = after;

      // a) Push a thinking bubble.
      schedule(() => {
        const placeholderId = pushChat({
          role: 'copilot',
          text: '',
          thinking: true,
        });

        // b) After STEP_THINK_MS, reveal the reply.
        schedule(() => {
          updateChat(placeholderId, { text: step.reply, thinking: false });

          // c) Stage the mutation: nodes first, then edges.
          const stages = stageMutation(before, after);
          schedule(() => {
            setGraph(stages.afterNodes);
            schedule(() => {
              setGraph(stages.afterEdges);
            }, EDGES_MS);
          }, NODES_MS);
        }, STEP_THINK_MS);
      }, stepStart);

      // The total time this step consumes:
      // thinking + reply + nodes + edges + a small gap before next.
      const stepDuration =
        STEP_THINK_MS + NODES_MS + EDGES_MS + STEP_GAP_MS + (step.dwellMs ?? 0);
      delay += stepDuration;

      // After the final step, drop demo flags.
      if (idx === EMAIL_DEMO_STEPS.length - 1) {
        schedule(() => {
          setDemoRunning(false);
          demoPendingRef.current = false;
        }, stepStart + stepDuration);
      }
    });
  };
  // Expose the latest runDemo via the ref so the mount-time effect can call it.
  runDemoRef.current = runDemo;

  const skipDemo = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    setGraph(EMAIL_FINAL);
    setDemoRunning(false);
    demoPendingRef.current = false;
    pushChat({
      role: 'copilot',
      text: "Skipped — loaded the finished graph. Switch to **Test** to try it.",
    });
  };

  const submit = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    pushChat({ role: 'user', text });
    setInput('');

    // First send on a cold-start Email session → play the build-up demo.
    if (demoPendingRef.current && currentTemplate === 'email') {
      demoPendingRef.current = false;
      runDemo(graph);
      return;
    }

    // 1. Show a "thinking" bubble immediately.
    const placeholderId = pushChat({ role: 'copilot', text: '', thinking: true });

    // 2. After THINK_MS, resolve the entry and reveal the reply.
    schedule(() => {
      const entry = matchEntry(text) ?? fallbackEntry(text);
      const result = entry.mutation(graph);

      if (!result) {
        updateChat(placeholderId, {
          text: `${entry.reply.replace(/\.$/, '')} — but the current graph doesn't have the right shape for this edit, so nothing changed.`,
          thinking: false,
        });
        return;
      }

      updateChat(placeholderId, { text: entry.reply, thinking: false });

      const stages = stageMutation(graph, result.graph);

      schedule(() => {
        setGraph(stages.afterNodes);
        schedule(() => {
          setGraph(stages.afterEdges);
          updateChat(placeholderId, { event: { label: result.eventLabel } });
        }, EDGES_MS);
      }, NODES_MS);
    }, THINK_MS);
  };

  const showSkip = demoRunning || (demoPendingRef.current && currentTemplate === 'email');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-coral" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink leading-none">Copilot</div>
          <div className="text-[11px] text-muted mt-0.5">
            {demoRunning
              ? 'Building your agent…'
              : 'Scripted demo — try a suggestion below'}
          </div>
        </div>
        {showSkip && (
          <button
            onClick={skipDemo}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-canvas border border-border text-muted hover:text-ink hover:border-ink/30"
            title="Skip the build animation and load the finished graph"
          >
            <FastForward className="w-3 h-3" /> Skip
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chat.map((m) => (
          <Message
            key={m.id}
            role={m.role}
            text={m.text}
            eventLabel={m.event?.label}
            thinking={m.thinking}
          />
        ))}
        {chat.length === 0 && currentTemplate && currentTemplate !== 'email' && (
          <EmptyStateChips
            template={currentTemplate}
            onPick={(t) => submit(t)}
          />
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-full focus-within:border-ink/40"
        >
          <Wand2 className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              demoPendingRef.current
                ? 'Press send to start the demo…'
                : 'Ask the copilot to edit the graph…'
            }
            disabled={demoRunning}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/70 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || demoRunning}
            className="w-7 h-7 rounded-full bg-coral/90 hover:bg-coral text-white flex items-center justify-center disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Split a graph mutation into two snapshots:
//   1. afterNodes: previous edges + everything else from the new graph
//   2. afterEdges: the final new graph
function stageMutation(oldGraph: Graph, newGraph: Graph): {
  afterNodes: Graph;
  afterEdges: Graph;
} {
  const oldNodeIds = new Set(oldGraph.nodes.map((n) => n.id));
  const newNodeIds = newGraph.nodes
    .filter((n) => !oldNodeIds.has(n.id))
    .map((n) => n.id);

  if (newNodeIds.length === 0) {
    return { afterNodes: newGraph, afterEdges: newGraph };
  }

  const newNodeSet = new Set(newNodeIds);
  const afterNodes: Graph = {
    nodes: newGraph.nodes,
    edges: newGraph.edges.filter(
      (e) => !newNodeSet.has(e.source) && !newNodeSet.has(e.target)
    ),
  };
  return { afterNodes, afterEdges: newGraph };
}

function Message({
  role,
  text,
  eventLabel,
  thinking,
}: {
  role: 'user' | 'copilot';
  text: string;
  eventLabel?: string;
  thinking?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[88%] text-sm leading-snug rounded-2xl px-3 py-2 transition-[background] animate-fade-in',
          isUser
            ? 'bg-coral/10 text-ink rounded-br-sm'
            : 'bg-white border border-border text-ink rounded-bl-sm'
        )}
      >
        {thinking ? <ThinkingDots /> : <div className="whitespace-pre-wrap">{text}</div>}
        {eventLabel && !thinking && (
          <div className="mt-1.5 text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-canvas border border-border rounded-full text-muted">
            ✨ {eventLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-0.5 py-1 px-0.5">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </div>
  );
}

// Empty-state suggestion chips for travel / support / blank. Click a chip
// to drop its text into the chat input (user reviews + hits send to run it).
function EmptyStateChips({
  template,
  onPick,
}: {
  template: TemplateId;
  onPick: (text: string) => void;
}) {
  const chips = TEMPLATE_CHIPS[template] ?? [];
  if (chips.length === 0) return null;
  return (
    <div className="pt-2 animate-fade-in">
      <div className="text-[11px] text-muted mb-2 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-coral" /> Suggested edits
      </div>
      <div className="flex flex-col gap-1.5">
        {chips.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left text-[12px] px-3 py-2 bg-white border border-border rounded-lg text-ink/85 hover:border-ink/30 hover:shadow-sm transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
