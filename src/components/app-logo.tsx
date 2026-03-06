import { Braces, Sparkles } from "lucide-react";

export function AppLogo() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative grid size-8 place-items-center overflow-hidden rounded-lg border border-border/70 bg-card shadow-xs">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-200/40 via-transparent to-zinc-400/20 dark:from-zinc-700/30 dark:to-zinc-900/10" />
        <Braces className="relative z-10 size-4" />
        <Sparkles className="absolute top-1 right-1 size-2.5 text-muted-foreground" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">snips</p>
        <p className="text-[10px] text-muted-foreground">code snippet library</p>
      </div>
    </div>
  );
}
