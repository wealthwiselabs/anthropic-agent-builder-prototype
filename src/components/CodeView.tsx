import { useEffect, useMemo, useState } from 'react';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import githubLight from 'shiki/themes/github-light.mjs';
import python from 'shiki/langs/python.mjs';
import { useStore } from '../store/useStore';
import { generateCode } from '../data/codegen';
import { ChevronLeft, Copy, Check } from 'lucide-react';

// Slim Shiki: explicit Python lang + GitHub Light theme + JS regex engine
// (no WASM). Keeps the bundle reasonable for a static site.
let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight],
      langs: [python],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

export function CodeView({ onClose }: { onClose: () => void }) {
  const graph = useStore((s) => s.graph);
  const agentName = useStore((s) => s.agentName);
  const code = useMemo(() => generateCode(graph, agentName), [graph, agentName]);
  const [html, setHtml] = useState<string>('<pre>Loading…</pre>');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((hl) =>
        hl.codeToHtml(code, { lang: 'python', theme: 'github-light' })
      )
      .then((h) => {
        if (!cancelled) setHtml(h);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="absolute inset-0 bg-canvas flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-chrome">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ChevronLeft className="w-4 h-4" /> Back to graph
          </button>
          <div className="text-[11px] text-muted">
            Read-only in this prototype. Edits are made on the graph.
          </div>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md hover:bg-canvas text-ink border border-border bg-white"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-700" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <div
        className="flex-1 overflow-auto p-6 text-[13px] leading-relaxed font-mono"
        style={{ background: '#FFFFFF' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
