import { useStore } from '../store/useStore';
import { TEMPLATE_TESTS, type ContextItem } from '../data/testResponses';
import { Database, Plane, Mail, Calendar } from 'lucide-react';
import clsx from 'clsx';

// Right-side panel during Test mode. Shows the data sources / context the
// agent has access to. In the real product these are sources the user
// connected via OAuth or credentials (Gmail, CRM, calendar, etc.); the
// prototype's content is illustrative.
export function ContextPanel() {
  const currentTemplate = useStore((s) => s.currentTemplate);
  const tpl = TEMPLATE_TESTS[currentTemplate ?? 'blank'];

  // Brand icon per template — Gmail logo for email, Google Calendar for
  // travel, generic Database for support (CRM isn't tied to a specific
  // brand in our copy).
  const headerIcon = renderHeaderIcon(currentTemplate);

  return (
    <div className="h-full bg-chrome flex flex-col min-h-0">
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {headerIcon}
          <div className="font-medium text-ink leading-none">{tpl.contextTitle}</div>
        </div>
        <div className="text-[11px] text-muted mt-1">{tpl.contextSubtitle}</div>
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {tpl.context.map((item, i) => (
          <ContextCard key={i} item={item} template={currentTemplate ?? 'blank'} />
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border text-[11px] text-muted">
        Connected sources the agent reads from. Edit connections in Build.
      </div>
    </div>
  );
}

function renderHeaderIcon(template: string | null) {
  if (template === 'email') {
    return (
      <img
        src={`${import.meta.env.BASE_URL}logos/gmail.svg`}
        alt="Gmail"
        className="w-5 h-5"
        style={{ filter: 'invert(33%) sepia(86%) saturate(2050%) hue-rotate(345deg) brightness(95%) contrast(89%)' }}
      />
    );
  }
  if (template === 'travel') {
    return (
      <img
        src={`${import.meta.env.BASE_URL}logos/google-calendar.svg`}
        alt="Google Calendar"
        className="w-5 h-5"
        style={{ filter: 'invert(34%) sepia(60%) saturate(2200%) hue-rotate(202deg) brightness(95%) contrast(95%)' }}
      />
    );
  }
  return <Database className="w-4 h-4 text-muted" />;
}

function ContextCard({ item, template }: { item: ContextItem; template: string }) {
  const itemIcon = renderItemIcon(item.label, template);
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2.5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink truncate">
          {itemIcon}
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && <Badge tone={item.badgeTone}>{item.badge}</Badge>}
      </div>
      <div className="text-[12px] text-muted leading-snug">{item.body}</div>
    </div>
  );
}

// Item-level icons: brand logo where it adds clarity, generic Lucide
// elsewhere. We don't try to match every item to a brand — overkill and
// risks looking like we're claiming partnerships.
function renderItemIcon(label: string, template: string) {
  if (template === 'email' && /Sarah|Bob|Newsletter|grants|brief/i.test(label)) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}logos/gmail.svg`}
        alt=""
        className="w-3.5 h-3.5 opacity-60"
        style={{ filter: 'grayscale(1)' }}
      />
    );
  }
  if (template === 'travel' && /Active trips|trip/i.test(label)) {
    return <Calendar className="w-3.5 h-3.5 text-muted" />;
  }
  if (template === 'travel' && /Hotel|Seating|Diet|Loyalty/i.test(label)) {
    return <Plane className="w-3.5 h-3.5 text-muted" />;
  }
  if (template === 'email') {
    return <Mail className="w-3.5 h-3.5 text-muted" />;
  }
  return null;
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
