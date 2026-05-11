import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

export function DeployManagedSuccess() {
  const agentName = useStore((s) => s.agentName);
  const agentId = useMemo(
    () => `agt_${randomHex(24)}`,
    [] // generated once on mount
  );
  const endpoint = `https://api.anthropic.com/v1/agents/${agentId}`;

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="bg-white border border-border rounded-xl p-8 max-w-xl w-full shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 text-sm mb-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          Deployed to Managed Agents
        </div>
        <h1 className="font-serif text-2xl mb-2">{agentName} is live</h1>
        <p className="text-muted text-sm mb-6">
          Your agent is running on Anthropic's managed runtime. Use the
          endpoint below to invoke it. (This success state is mocked for the
          prototype.)
        </p>

        <CopyRow label="Agent ID" value={agentId} mono />
        <CopyRow label="Endpoint" value={endpoint} mono />

        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-ink text-white text-sm hover:bg-ink/90"
            title="Mocked — would open the Managed Agents dashboard. Returns to landing in the prototype."
          >
            <ExternalLink className="w-4 h-4" /> Open in Managed Agents
          </Link>
          <Link to="/builder" className="text-sm text-coral hover:underline">
            ← Back to builder
          </Link>
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2 bg-canvas border border-border rounded-md px-3 py-2">
        <code className={mono ? 'flex-1 truncate text-sm font-mono' : 'flex-1 truncate text-sm'}>
          {value}
        </code>
        <button
          onClick={copy}
          className="text-muted hover:text-ink"
          aria-label="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function randomHex(n: number): string {
  const arr = new Uint8Array(n / 2);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}
