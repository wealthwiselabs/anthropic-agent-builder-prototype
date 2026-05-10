// Always-visible footer disclaiming the prototype.
export function DisclaimerFooter() {
  return (
    <div className="fixed bottom-2 right-3 z-40 text-[10px] text-muted/80 bg-chrome/80 backdrop-blur px-2 py-1 rounded border border-border/60">
      Prototype for Anthropic Growth PM take-home — not affiliated with Anthropic.
    </div>
  );
}
