import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Wand2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TEMPLATES } from '../data/templates';
import { matchEntry, fallbackEntry, CHAT_ENTRIES } from '../data/chatScript';
import type { Graph } from '../types';
import clsx from 'clsx';

// Timing constants — the "AI working" feel comes from these spaced-out steps.
const THINK_MS = 700;   // how long the thinking dots show before the reply appears
const NODES_MS = 250;   // delay between reply text and new nodes spawning
const EDGES_MS = 500;   // delay between nodes and the edges connecting them

export function ChatSidebar() {
  const chat = useStore((s) => s.chat);
  const pushChat = useStore((s) => s.pushChat);
  const updateChat = useStore((s) => s.updateChat);
  const graph = useStore((s) => s.graph);
  const setGraph = useStore((s) => s.setGraph);
  const currentTemplate = useStore((s) => s.currentTemplate);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greet on template load if chat is empty.
  useEffect(() => {
    if (chat.length === 0 && currentTemplate) {
      pushChat({
        role: 'copilot',
        text: greetingFor(currentTemplate),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate]);

  // Autoscroll to bottom on new message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chat]);

  const submit = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    pushChat({ role: 'user', text });
    setInput('');

    // 1. Show a "thinking" bubble immediately.
    const placeholderId = pushChat({ role: 'copilot', text: '', thinking: true });

    // 2. After THINK_MS, resolve the entry and reveal the reply.
    setTimeout(() => {
      const entry = matchEntry(text) ?? fallbackEntry(text);
      const result = entry.mutation(graph);

      if (!result) {
        updateChat(placeholderId, {
          text: `${entry.reply.replace(/\.$/, '')} — but the current graph doesn't have the right shape for this edit, so nothing changed.`,
          thinking: false,
        });
        return;
      }

      // Reply text shows first.
      updateChat(placeholderId, { text: entry.reply, thinking: false });

      // 3. Apply the mutation in stages so it feels like the AI is building
      // the graph in real time: new nodes first, then edges that connect them.
      const stages = stageMutation(graph, result.graph);

      setTimeout(() => {
        setGraph(stages.afterNodes);
        setTimeout(() => {
          setGraph(stages.afterEdges);
          // Event card shows after the edges land, summarising what changed.
          updateChat(placeholderId, { event: { label: result.eventLabel } });
        }, EDGES_MS);
      }, NODES_MS);
    }, THINK_MS);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-coral" />
        <div>
          <div className="font-medium text-ink leading-none">Copilot</div>
          <div className="text-[11px] text-muted mt-0.5">
            Scripted demo — try a suggestion below
          </div>
        </div>
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
        {chat.length <= 1 && <SuggestionChips onPick={submit} />}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the copilot to edit the graph…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!input.trim()}
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
//   1. afterNodes: previous edges + everything else from the new graph (nodes appear, edges to new nodes still missing)
//   2. afterEdges: the final new graph
//
// If no new nodes were added, both snapshots are identical (just the final state).
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

  // afterNodes: include the final nodes but exclude any new edges that touch a brand-new node.
  const newNodeSet = new Set(newNodeIds);
  const afterNodes: Graph = {
    nodes: newGraph.nodes,
    edges: newGraph.edges.filter(
      (e) => !newNodeSet.has(e.source) && !newNodeSet.has(e.target)
    ),
  };

  return { afterNodes, afterEdges: newGraph };
}

function greetingFor(t: string) {
  if (t === 'travel')
    return "I built a travel agent with three specialist subagents running in parallel — flight, hotel, itinerary. The lead coordinator fans out and merges results. Want to tweak it?";
  if (t === 'support')
    return "Classify-then-route support agent. The refund branch reads from a Memory store of past tickets; the technical branch searches your docs. Want to add a tone-matching guardrail?";
  if (t === 'email')
    return "Triage-first inbox: each email is classified as request / info-sharing / meeting / spam, then routed. Drafts and meetings go through human approval before sending; spam is deleted; info-sharing gets summarized. Want to add a tone-matching guardrail or a custom Skill?";
  if (t === 'blank')
    return "Blank graph loaded. Try \"add a memory store\" or \"parallelize this\" to bootstrap something interesting.";
  return TEMPLATES.blank.description;
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
          'max-w-[85%] text-sm leading-snug rounded-2xl px-3 py-2 transition-[background] animate-fade-in',
          isUser
            ? 'bg-coral/10 text-ink rounded-br-sm'
            : 'bg-white border border-border text-ink rounded-bl-sm'
        )}
      >
        {thinking ? <ThinkingDots /> : <div>{text}</div>}
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

function SuggestionChips({ onPick }: { onPick: (s: string) => void }) {
  const suggestions = CHAT_ENTRIES.slice(0, 6).map((e) => e.keywords[0]);
  return (
    <div className="pt-2">
      <div className="text-[11px] text-muted mb-1.5">Try:</div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-[11px] px-2 py-0.5 bg-white border border-border rounded-full text-ink/80 hover:border-ink/30"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
