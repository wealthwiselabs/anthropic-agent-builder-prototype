import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LeftNav } from './LeftNav';
import { DisclaimerFooter } from './DisclaimerFooter';

// Wraps every route in the Console chrome (left nav + main area + footer).
// On the /builder route the chrome hides its top header — Builder renders its own.
export function ConsoleChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isBuilder = pathname.startsWith('/builder');

  return (
    <div className="flex h-full min-h-screen w-full bg-canvas">
      <LeftNav />
      <main className="flex-1 flex flex-col min-w-0 relative">
        {!isBuilder && <TopBar />}
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <DisclaimerFooter />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="h-12 flex items-center px-6 border-b border-border bg-chrome">
      <span className="text-sm text-muted">Quickstart</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 text-sm">
        <Step n={1} active />
        <Sep />
        <Step n={2} />
        <Sep />
        <Step n={3} />
        <Sep />
        <Step n={4} />
      </div>
      <div className="flex-1" />
    </header>
  );
}

function Step({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs ' +
        (active
          ? 'border-ink text-ink bg-white'
          : 'border-border text-muted bg-transparent')
      }
    >
      {n}
    </span>
  );
}

function Sep() {
  return <span className="w-6 h-px bg-border mx-1" />;
}
