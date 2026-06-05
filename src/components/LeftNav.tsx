import { NavLink } from 'react-router-dom';
import {
  Wrench,
  Workflow,
  BarChart3,
  Code2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Box,
  PanelLeftClose,
} from 'lucide-react';
import { useStore } from '../store/useStore';

// Visual-only Console nav. Only "Agent Builder" links to a real route.
// Everything else is rendered for fidelity — cursor: default, no behavior.
export function LeftNav() {
  const toggleNav = useStore((s) => s.toggleNav);
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-chrome flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-2">
        <div className="font-serif text-[19px] tracking-tight text-ink">
          Claude Console
        </div>
        <button
          onClick={toggleNav}
          title="Hide sidebar (⌘B)"
          aria-label="Hide sidebar"
          className="w-7 h-7 -mr-1 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-canvas shrink-0"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-4">
        <button
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-white text-sm cursor-default"
          tabIndex={-1}
        >
          <span className="flex items-center gap-2">
            <Box className="w-4 h-4 text-coral" /> Default
          </span>
          <ChevronDown className="w-4 h-4 text-muted" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 text-sm">
        <Group icon={<Wrench className="w-4 h-4" />} label="Build" defaultOpen>
          <NavRow label="Agent Builder" to="/" badge="NEW" linked active />
          <NavRow label="Files" />
          <NavRow label="Skills" />
          <NavRow label="Memory stores" badge="Beta" />
          <NavRow label="Batches" />
        </Group>

        <Group icon={<Workflow className="w-4 h-4" />} label="Managed Agents">
          <NavRow label="Agents" />
          <NavRow label="Sessions" />
          <NavRow label="Environments" />
          <NavRow label="Credential vaults" />
        </Group>

        <Group icon={<BarChart3 className="w-4 h-4" />} label="Analytics">
          <NavRow label="Usage" />
          <NavRow label="Caching" />
          <NavRow label="Cost" />
        </Group>

        <Group icon={<Code2 className="w-4 h-4" />} label="Claude Code" />
        <Group icon={<Briefcase className="w-4 h-4" />} label="Manage" />
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted cursor-default">
          <BookOpen className="w-4 h-4" /> Documentation
        </div>
        <div className="flex items-center justify-between text-muted cursor-default">
          <span>Credits</span>
          <span className="font-mono text-xs">USD 16.66</span>
        </div>
        <div className="flex items-center gap-2 pt-2 cursor-default">
          <div className="w-8 h-8 rounded-md bg-coral/20 text-coral flex items-center justify-center font-medium">
            E
          </div>
          <div className="leading-tight">
            <div className="text-ink">Eric</div>
            <div className="text-xs text-muted">Admin · Eric's Indi…</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Group({
  icon,
  label,
  children,
  defaultOpen,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-2 py-1.5 cursor-default">
        <span className="flex items-center gap-2 text-ink/85">
          {icon}
          {label}
        </span>
        {children ? (
          defaultOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
          )
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted/60" />
        )}
      </div>
      {children && defaultOpen && <div className="pl-3">{children}</div>}
    </div>
  );
}

function NavRow({
  label,
  to,
  badge,
  active,
  linked,
}: {
  label: string;
  to?: string;
  badge?: string;
  active?: boolean;
  linked?: boolean;
}) {
  if (linked && to) {
    return (
      <NavLink
        to={to}
        end
        className={({ isActive }) =>
          'flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ' +
          ((isActive || active)
            ? 'bg-white text-ink shadow-sm'
            : 'text-ink/75 hover:bg-white/60')
        }
      >
        <span>{label}</span>
        {badge && <Badge>{badge}</Badge>}
      </NavLink>
    );
  }
  return (
    <div className="flex items-center justify-between px-2 py-1.5 text-muted/90 cursor-default">
      <span>{label}</span>
      {badge && <Badge muted>{badge}</Badge>}
    </div>
  );
}

function Badge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ' +
        (muted
          ? 'bg-border/50 text-muted'
          : 'bg-coral/15 text-coral font-medium')
      }
    >
      {children}
    </span>
  );
}
