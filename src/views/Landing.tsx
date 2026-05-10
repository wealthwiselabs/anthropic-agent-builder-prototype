import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, FileSearch, MessagesSquare, Mail, Plane, Headphones } from 'lucide-react';
import { TEMPLATES, routePromptToTemplate } from '../data/templates';
import type { TemplateId } from '../types';

// Landing: chat input on the left, template grid on the right.
// Mirrors the "Quickstart — What do you want to build?" layout from the real Console.
export function Landing() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const submit = () => {
    if (!prompt.trim()) return;
    const id = routePromptToTemplate(prompt);
    navigate(`/builder?template=${id}&prompt=${encodeURIComponent(prompt)}`);
  };

  const goTemplate = (id: TemplateId) => navigate(`/builder?template=${id}`);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 grid grid-cols-2 gap-12 px-12 py-10 max-w-[1400px] mx-auto w-full">
        {/* Left: chat-input column */}
        <div className="flex flex-col items-center justify-center text-center pr-4">
          <h1 className="font-serif text-[26px] text-ink mb-2">
            What do you want to build?
          </h1>
          <p className="text-muted mb-8">
            Describe your agent or start with a template.
          </p>
          <div className="w-full max-w-[440px]">
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-2xl shadow-sm">
              <input
                className="flex-1 outline-none text-ink placeholder:text-muted/80 bg-transparent"
                placeholder="Describe your agent…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
              <button
                onClick={submit}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-coral/90 hover:bg-coral text-white disabled:opacity-40"
                disabled={!prompt.trim()}
                aria-label="Submit prompt"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Try: <ExamplePill onClick={() => setPrompt('Plan a 5-day trip to Tokyo')}>Plan a 5-day trip to Tokyo</ExamplePill>{' '}
              <ExamplePill onClick={() => setPrompt('Build a customer support bot')}>Build a customer support bot</ExamplePill>
            </p>
          </div>
        </div>

        {/* Right: template grid */}
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-[19px]">Browse templates</h2>
          </div>
          <div className="mb-3">
            <input
              className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sm outline-none focus:border-ink/40"
              placeholder="🔍   Search templates"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TemplateCard
              icon={<Plane className="w-4 h-4" />}
              name={TEMPLATES.travel.name}
              description={TEMPLATES.travel.description}
              accent="Multi-agent orchestration"
              onClick={() => goTemplate('travel')}
            />
            <TemplateCard
              icon={<Headphones className="w-4 h-4" />}
              name={TEMPLATES.support.name}
              description={TEMPLATES.support.description}
              accent="Memory stores · File search"
              onClick={() => goTemplate('support')}
            />
            <TemplateCard
              icon={<Mail className="w-4 h-4" />}
              name={TEMPLATES.email.name}
              description={TEMPLATES.email.description}
              accent="Skills · User approval"
              onClick={() => goTemplate('email')}
            />
            <TemplateCard
              icon={<FileSearch className="w-4 h-4" />}
              name={TEMPLATES.blank.name}
              description={TEMPLATES.blank.description}
              onClick={() => goTemplate('blank')}
            />
            <TemplateCard
              icon={<MessagesSquare className="w-4 h-4 text-muted" />}
              name="More templates"
              description="Deep researcher · Structured extractor · Field monitor · Incident commander · Sprint retro · Data analyst …"
              muted
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 bg-white border border-border rounded-full text-[11px] text-muted hover:text-ink hover:border-ink/30"
    >
      {children}
    </button>
  );
}

function TemplateCard({
  icon,
  name,
  description,
  accent,
  onClick,
  muted,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  accent?: string;
  onClick?: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={muted}
      className={
        'text-left p-4 rounded-lg border transition-all min-h-[124px] ' +
        (muted
          ? 'bg-canvas border-border/60 cursor-default opacity-70'
          : 'bg-white border-border hover:border-ink/30 hover:shadow-sm cursor-pointer')
      }
    >
      <div className="flex items-center gap-2 mb-1.5 text-ink">
        <span className="w-6 h-6 rounded bg-canvas flex items-center justify-center">
          {icon}
        </span>
        <span className="font-medium text-[13px]">{name}</span>
      </div>
      <p className="text-[12px] leading-snug text-muted">{description}</p>
      {accent && (
        <div className="mt-2 inline-block text-[10px] uppercase tracking-wide text-coral/90 font-medium">
          {accent}
        </div>
      )}
    </button>
  );
}
