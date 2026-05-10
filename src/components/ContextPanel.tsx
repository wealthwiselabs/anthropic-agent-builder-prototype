import { useStore } from '../store/useStore';
import { TEMPLATE_TESTS, type ContextItem } from '../data/testResponses';
import { Database } from 'lucide-react';
import clsx from 'clsx';

// Right-side panel during Test mode. Shows the data sources / context the
// agent "has access to" — mocked Gmail inbox for the email assistant, customer
// record for support, travel preferences for the travel agent, etc.
//
// This stands in for what would, in production, be live tool access (Gmail
// API, customer DB, etc.). Crucial for the demo: it makes the test feel
// concrete instead of abstract.
export function ContextPanel() {
  const currentTemplate = useStore((s) => s.currentTemplate);
  const tpl = TEMPLATE_TESTS[currentTemplate ?? 'blank'];

  return (
    <div className="h-full bg-chrome flex flex-col min-h-0">
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted" />
          <div className="font-medium text-ink leading-none">{tpl.contextTitle}</div>
        </div>
        <div className="text-[11px] text-muted mt-1">{tpl.contextSubtitle}</div>
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {tpl.context.map((item, i) => (
          <ContextCard key={i} item={item} />
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border text-[11px] text-muted">
        Mocked for the prototype. Switch to Build to change what the agent reads.
      </div>
    </div>
  );
}

function ContextCard({ item }: { item: ContextItem }) {
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2.5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="text-[12px] font-medium text-ink truncate">{item.label}</div>
        {item.badge && <Badge tone={item.badgeTone}>{item.badge}</Badge>}
      </div>
      <div className="text-[12px] text-muted leading-snug">{item.body}</div>
    </div>
  );
}

function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'warn' | 'spam' | 'info';
}) {
  return (
    <span
      className={clsx(
        'shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
        tone === 'warn' && 'bg-coral/15 text-coral',
        tone === 'info' && 'bg-blue-50 text-blue-700',
        tone === 'spam' && 'bg-muted/15 text-muted',
        tone === 'default' && 'bg-canvas text-muted'
      )}
    >
      {children}
    </span>
  );
}
