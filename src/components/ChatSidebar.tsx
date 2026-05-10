import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Wand2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TEMPLATES } from '../data/templates';
import { matchEntry, fallbackEntry, CHAT_ENTRIES } from '../data/chatScript';
import clsx from 'clsx';

export function ChatSidebar() {
  const chat = useStore((s) => s.chat);
  const pushChat = useStore((s) => s.pushChat);
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  const submit = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    pushChat({ role: 'user', text });
    setInput('');

    // Defer slightly so the user message renders first.
    setTimeout(() => {
      // Pick a matched entry if any keyword overlaps; otherwise pick a
      // generic fallback that still mutates the graph.
      const entry = matchEntry(text) ?? fallbackEntry(text);
      const result = entry.mutation(graph);
      if (result) {
        setGraph(result.graph);
        pushChat({
          role: 'copilot',
          text: entry.reply,
          event: { label: result.eventLabel },
        });
      } else {
        // Mutation refused (e.g. no Agent node exists in the graph).
        pushChat({
          role: 'copilot',
          text: `${entry.reply.replace(/\.$/, '')} — but the current graph doesn't have the right shape for this edit, so nothing changed.`,
        });
      }
    }, 320);
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
}: {
  role: 'user' | 'copilot';
  text: string;
  eventLabel?: string;
}) {
  const isUser = role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] text-sm leading-snug rounded-2xl px-3 py-2',
          isUser
            ? 'bg-coral/10 text-ink rounded-br-sm'
            : 'bg-white border border-border text-ink rounded-bl-sm'
        )}
      >
        <div>{text}</div>
        {eventLabel && (
          <div className="mt-1.5 text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-canvas border border-border rounded-full text-muted">
            ✨ {eventLabel}
          </div>
        )}
      </div>
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
