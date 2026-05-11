import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LeftNav } from './LeftNav';
import { DisclaimerFooter } from './DisclaimerFooter';
import { WizardSteps, type WizardMode } from './WizardSteps';
import { useStore } from '../store/useStore';

// Wraps every route in the Console chrome (left nav + main area + footer).
// On the /builder route the chrome hides its top header — Builder renders its own.
// On /deploy/* routes the top header shows the wizard breadcrumb (with step 3
// active) so the navigation stays consistent with Build/Test.
export function ConsoleChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isBuilder = pathname.startsWith('/builder');
  const isDeploySuccess = pathname.startsWith('/deploy/');

  return (
    <div className="flex h-full min-h-screen w-full bg-canvas">
      <LeftNav />
      <main className="flex-1 flex flex-col min-w-0 relative">
        {!isBuilder && (isDeploySuccess ? <WizardTopBar /> : <PlaceholderTopBar />)}
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <DisclaimerFooter />
      </main>
    </div>
  );
}

// Generic placeholder for non-builder, non-deploy pages (currently just the
// landing route).
function PlaceholderTopBar() {
  return (
    <header className="h-12 flex items-center px-6 border-b border-border bg-chrome">
      <span className="text-sm text-muted">Quickstart</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 text-sm">
        <PlaceholderStep n={1} active />
        <Sep />
        <PlaceholderStep n={2} />
        <Sep />
        <PlaceholderStep n={3} />
        <Sep />
        <PlaceholderStep n={4} />
      </div>
      <div className="flex-1" />
    </header>
  );
}

// Wizard breadcrumb rendered on deploy-success routes. Steps 1 & 2 navigate
// back into the Builder at the corresponding mode (preserving the template
// the user picked).
function WizardTopBar() {
  const navigate = useNavigate();
  const currentTemplate = useStore((s) => s.currentTemplate);
  const goBuilder = (mode: WizardMode) => {
    const q = currentTemplate ? `?template=${currentTemplate}&mode=${mode}` : `?mode=${mode}`;
    navigate(`/builder${q}`);
  };
  return (
    <header className="h-14 flex items-center px-4 border-b border-border bg-chrome">
      <div className="flex-1" />
      <WizardSteps current="deploy" onChange={goBuilder} />
      <div className="flex-1" />
    </header>
  );
}

function PlaceholderStep({ n, active }: { n: number; active?: boolean }) {
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
