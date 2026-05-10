import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, ChevronDown, ChevronUp, Sparkles, User, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TEMPLATE_TESTS, pickTestResponse, type TestResponse } from '../data/testResponses';
import clsx from 'clsx';

type TestMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'agent';
      thinking: string[];
      reply: string;
      // Animation state for staged reveal.
      stage: 'thinking' | 'replying' | 'done';
      thinkingShown: number; // how many thinking lines have been revealed
      thinkingOpen: boolean; // user-controlled collapse
    };

// Test interface: send messages to the agent, see thinking + response.
// All responses are scripted from `data/testResponses.ts`.
//
// As each scripted thinking line streams in, we also pulse-highlight the
// corresponding node on the canvas via `setActiveNode` so the user sees
// the agent traversing the graph (LangGraph-Studio-style live trace).
export function TestPanel() {
  const currentTemplate = useStore((s) => s.currentTemplate);
  const agentName = useStore((s) => s.agentName);
  const setActiveNode = useStore((s) => s.setActiveNode);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const tpl = TEMPLATE_TESTS[currentTemplate ?? 'blank'];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Clear active node when leaving Test mode or switching templates.
  useEffect(() => {
    return () => setActiveNode(null);
  }, [setActiveNode]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setInput('');
    const userMsg: TestMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };
    const response: TestResponse = pickTestResponse(currentTemplate, text);
    const agentId = crypto.randomUUID();
    const agentMsg: TestMessage = {
      id: agentId,
      role: 'agent',
      thinking: response.thinking,
      reply: response.reply,
      stage: 'thinking',
      thinkingShown: 0,
      thinkingOpen: true,
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);

    // Stagger reveal: each thinking line ~450ms, then reply. As lines
    // reveal, advance the active node through nodeSequence in proportion.
    const totalThinking = response.thinking.length;
    const seq = response.nodeSequence ?? [];
    let i = 0;
    const tick = () => {
      i++;
      if (i <= totalThinking) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId && m.role === 'agent'
              ? { ...m, thinkingShown: i }
              : m
          )
        );
        // Map line index → node index by interpolating across the sequence.
        if (seq.length > 0) {
          const seqIdx = Math.min(
            seq.length - 1,
            Math.floor(((i - 1) / Math.max(1, totalThinking - 1)) * (seq.length - 1)),
          );
          setActiveNode(seq[seqIdx]);
        }
        setTimeout(tick, 450);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId && m.role === 'agent'
              ? { ...m, stage: 'done', thinkingOpen: false }
              : m
          )
        );
        // Land on the last node briefly, then clear the highlight.
        if (seq.length > 0) {
          setActiveNode(seq[seq.length - 1]);
          setTimeout(() => setActiveNode(null), 900);
        }
      }
    };
    setTimeout(tick, 350);
  };

  const toggleThinking = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.role === 'agent'
          ? { ...m, thinkingOpen: !m.thinkingOpen }
          : m
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink leading-none truncate">
            Test {agentName}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            Scripted demo · responses below are hard-coded for the prototype
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <EmptyState
            intro={tpl.intro}
            suggestions={tpl.suggestions}
            onPick={send}
          />
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <UserBubble key={m.id} text={m.text} />
          ) : (
            <AgentBubble
              key={m.id}
              msg={m}
              onToggle={() => toggleThinking(m.id)}
            />
          )
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-full focus-within:border-ink/40"
        >
          <Play className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message to the agent…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40"
            aria-label="Run"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  intro,
  suggestions,
  onPick,
}: {
  intro: string;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="text-sm">
      <div className="bg-white border border-border rounded-lg p-3 text-ink/85 mb-3">
        {intro}
      </div>
      <div className="text-[11px] text-muted mb-1.5">Try one:</div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-[12px] px-2.5 py-1 bg-white border border-border rounded-full text-ink/80 hover:border-ink/30"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 justify-end">
      <div className="max-w-[88%] bg-coral/10 text-ink rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
        {text}
      </div>
      <span className="w-6 h-6 rounded-full bg-canvas border border-border flex items-center justify-center shrink-0 mt-0.5">
        <User className="w-3 h-3 text-muted" />
      </span>
    </div>
  );
}

function AgentBubble({
  msg,
  onToggle,
}: {
  msg: Extract<TestMessage, { role: 'agent' }>;
  onToggle: () => void;
}) {
  const isThinking = msg.stage === 'thinking';
  const visibleThinking = msg.thinking.slice(0, msg.thinkingShown);
  return (
    <div className="flex gap-2.5">
      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3 h-3" />
      </span>
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Thinking section */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted hover:bg-canvas"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-coral" />
              {isThinking ? 'Thinking…' : `Thought for ${msg.thinking.length} step${msg.thinking.length === 1 ? '' : 's'}`}
            </span>
            {msg.thinkingOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {msg.thinkingOpen && (
            <div className="px-3 py-2 border-t border-border space-y-1 text-[12px] text-muted/90 font-mono leading-relaxed">
              {visibleThinking.map((line, i) => (
                <div key={i} className="animate-fade-in">
                  {line}
                </div>
              ))}
              {isThinking && (
                <div className="text-coral/80">
                  <span className="inline-block w-1 h-1 bg-coral rounded-full mr-1 animate-pulse" />
                  …
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reply */}
        {msg.stage === 'done' && (
          <div
            className={clsx(
              'bg-white border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed text-ink whitespace-pre-wrap',
              'animate-fade-in'
            )}
          >
            {msg.reply}
          </div>
        )}
      </div>
    </div>
  );
}
