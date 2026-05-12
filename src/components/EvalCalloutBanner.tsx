import { useState } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import type { EvalSuggestion } from '../data/evalSuggestions';

// Banner that sits above the Builder canvas when the user arrives from an
// Eval (B1) suggestion CTA. Surfaces the cluster's pain point and a
// node-level hint, but does NOT auto-mutate the graph — the suggestion
// is advisory; the user (or copilot) decides what to change.

type Props = {
  suggestion: EvalSuggestion;
  project?: string | null;
  evalBackUrl?: string;
};

export function EvalCalloutBanner({ suggestion, project, evalBackUrl }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="border-b border-coral/30 bg-coral/5 px-6 py-3 flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium text-ink">{suggestion.callout.headline}</span>
          <span className="text-ink/80"> {suggestion.callout.body}</span>
        </div>
        <div className="text-xs text-muted mt-1.5">
          <span className="font-medium">Suggested change:</span> {suggestion.callout.hint}
          {project && (
            <span>
              {' '}
              · Source: <span className="font-mono">{project}</span>
            </span>
          )}
        </div>
        {evalBackUrl && (
          <a
            href={evalBackUrl}
            className="text-xs text-coral hover:underline inline-flex items-center gap-1 mt-1.5"
          >
            View source cluster in Eval <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted hover:text-ink transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
