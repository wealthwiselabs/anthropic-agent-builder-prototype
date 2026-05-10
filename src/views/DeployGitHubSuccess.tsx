import { Link } from 'react-router-dom';
import { Check, ExternalLink, GitCommit } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';

const STEPS = [
  'Authorizing GitHub…',
  'Creating repository…',
  'Pushing initial commit…',
];

// "Open in GitHub" link target. Points at the prototype's own repo so the
// click doesn't 404. In a real product this would be the freshly created
// per-agent repo.
const SAMPLE_REPO_URL = 'https://github.com/wealthwiselabs/anthropic-agent-builder-prototype';

export function DeployGitHubSuccess() {
  const agentName = useStore((s) => s.agentName);
  const slug = agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-agent';
  const repoName = `wealthwiselabs/${slug}`;
  const commitHash = useMemo(() => randomHex(7), []);

  const [doneStep, setDoneStep] = useState(-1);
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      setDoneStep(i);
      i++;
      if (i < STEPS.length) setTimeout(tick, 600);
    };
    setTimeout(tick, 200);
    return () => {
      cancelled = true;
    };
  }, []);

  const allDone = doneStep >= STEPS.length - 1;

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="bg-white border border-border rounded-xl p-8 max-w-xl w-full shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 text-sm mb-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          Synced to GitHub
        </div>
        <h1 className="font-serif text-2xl mb-2">
          {allDone ? `Pushed to ${repoName}` : `Syncing to GitHub…`}
        </h1>
        <p className="text-muted text-sm mb-6">
          (Visual mock — the link below points to a real sample scaffold repo.)
        </p>

        <ol className="space-y-2 mb-6">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={
                'flex items-center gap-2 text-sm transition-colors ' +
                (i <= doneStep ? 'text-ink' : 'text-muted/60')
              }
            >
              {i <= doneStep ? (
                <Check className="w-4 h-4 text-emerald-700" />
              ) : (
                <Spinner />
              )}
              {s}
            </li>
          ))}
        </ol>

        {allDone && (
          <>
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                Repository
              </div>
              <div className="bg-canvas border border-border rounded-md px-3 py-2 flex items-center gap-2">
                <code className="flex-1 truncate text-sm font-mono">
                  github.com/{repoName}
                </code>
              </div>
            </div>
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                Initial commit
              </div>
              <div className="bg-canvas border border-border rounded-md px-3 py-2 flex items-center gap-2 text-sm">
                <GitCommit className="w-4 h-4 text-muted" />
                <code className="font-mono">{commitHash}</code>
                <span className="text-muted">— Initial scaffold from Agent Builder</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={SAMPLE_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-ink text-white text-sm hover:bg-ink/90"
              >
                <ExternalLink className="w-4 h-4" /> Open in GitHub
              </a>
              <Link to="/builder" className="text-sm text-coral hover:underline">
                ← Back to builder
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 inline-flex items-center justify-center">
      <span className="w-3 h-3 border-2 border-border border-t-coral rounded-full animate-spin" />
    </span>
  );
}

function randomHex(n: number): string {
  const arr = new Uint8Array(Math.ceil(n / 2));
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, n);
}
