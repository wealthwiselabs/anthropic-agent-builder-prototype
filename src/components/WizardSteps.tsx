import { Wrench, PlayCircle, Rocket } from 'lucide-react';
import clsx from 'clsx';

export type WizardMode = 'build' | 'test' | 'deploy';

// Build → Test → Deploy breadcrumb used in the Builder header AND in the
// deploy-success pages' chrome so the navigation is consistent across the
// whole flow.
export function WizardSteps({
  current,
  onChange,
}: {
  current: WizardMode;
  onChange: (next: WizardMode) => void;
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
        active={current === 'deploy'} onClick={() => onChange('deploy')} />
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
        active ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'
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
