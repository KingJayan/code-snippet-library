
export function AppLogo() {
  return (
    <div className="inline-flex items-center gap-2 select-none group">
      <div className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm border border-border/50 bg-card group-hover:border-primary/20 transition-colors">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full p-0.5"
        >
          {/* Background Gradient */}
          <rect width="32" height="32" rx="6" className="fill-zinc-900 group-hover:fill-zinc-800 transition-colors dark:fill-zinc-950" />
          
          {/* Icon Paths Refined - Sharp and Neutral */}
          <path d="M8 16L12 12" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 16L12 20" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          
          <path d="M24 16L20 12" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24 16L20 20" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          
          <path d="M17 10L15 22" className="stroke-zinc-400 group-hover:stroke-white transition-colors" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">Snips</p>
        <p className="text-[10px] text-muted-foreground font-medium">Code Library</p>
      </div>
    </div>
  );
}
