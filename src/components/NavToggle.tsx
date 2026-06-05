import { PanelLeftOpen } from 'lucide-react';
import { useStore } from '../store/useStore';

// Reveals the left Console nav after it's been collapsed. Renders nothing
// while the nav is visible — there the nav carries its own collapse button.
// Dropped into each route's header so the nav can always be brought back
// (mirrors Cmd/Ctrl+B). Counterpart to LeftNav's PanelLeftClose.
export function NavRevealButton() {
  const navHidden = useStore((s) => s.navHidden);
  const toggleNav = useStore((s) => s.toggleNav);
  if (!navHidden) return null;
  return (
    <button
      onClick={toggleNav}
      title="Show sidebar (⌘B)"
      aria-label="Show sidebar"
      className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-canvas shrink-0"
    >
      <PanelLeftOpen className="w-4 h-4" />
    </button>
  );
}
