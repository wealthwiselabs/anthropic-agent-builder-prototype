import { Link } from 'react-router-dom';
import { Check, Download, FileCode, FileText, FileType, Settings } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { downloadAgentZip } from '../data/zipExport';

export function DeployDownloadSuccess() {
  const graph = useStore((s) => s.graph);
  const agentName = useStore((s) => s.agentName);
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void downloadAgentZip(graph, agentName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slug =
    agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    'my-agent';

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="bg-white border border-border rounded-xl p-8 max-w-xl w-full shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 text-sm mb-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          Code downloaded
        </div>
        <h1 className="font-serif text-2xl mb-2">{slug}.zip</h1>
        <p className="text-muted text-sm mb-5">
          Your generated code has been downloaded. Open the zip and follow the
          README to run it locally.
        </p>

        <div className="bg-canvas border border-border rounded-md p-4 mb-5 text-sm font-mono">
          <div className="text-muted text-[11px] mb-2">Contents</div>
          <FileRow icon={<FileCode className="w-3.5 h-3.5" />} name="agent.py" />
          <FileRow icon={<FileText className="w-3.5 h-3.5" />} name="README.md" />
          <FileRow icon={<FileType className="w-3.5 h-3.5" />} name="requirements.txt" />
          <FileRow icon={<Settings className="w-3.5 h-3.5" />} name=".env.example" />
        </div>

        <div className="text-sm text-muted mb-5">
          Run with:
          <pre className="mt-1.5 bg-canvas border border-border rounded-md p-3 text-[12px] font-mono text-ink">
{`pip install -r requirements.txt
cp .env.example .env  # add ANTHROPIC_API_KEY
python agent.py`}
          </pre>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadAgentZip(graph, agentName)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-ink text-white text-sm hover:bg-ink/90"
          >
            <Download className="w-4 h-4" /> Download again
          </button>
          <Link to="/builder" className="text-sm text-coral hover:underline">
            ← Back to builder
          </Link>
        </div>
      </div>
    </div>
  );
}

function FileRow({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-ink">
      <span className="text-muted">{icon}</span> {name}
    </div>
  );
}
