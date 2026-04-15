const FEATURES = [
  {
    num: "01",
    name: "workspaces",
    desc: "keep things separated. share with teammates if you want.",
  },
  {
    num: "02",
    name: "ai",
    desc: "ask it to explain, rewrite, or just vibe-check your code.",
  },
  {
    num: "03",
    name: "search",
    desc: "find anything, fast. by name, tag, language, whatever.",
  },
] as const;

export function FeaturesStrip() {
  return (
    <section className="border-t border-zinc-800/50 bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 border-b border-zinc-800/50 md:grid-cols-3">
          {FEATURES.map(({ num, name, desc }, i) => (
            <div
              key={num}
              className={[
                "group px-8 py-11 transition-colors duration-200",
                i < FEATURES.length - 1 ? "border-b border-r border-zinc-800/50" : "",
              ].join(" ")}
            >
              <p className="mb-3 font-mono text-[10px] tracking-widest text-zinc-600">
                {num}
              </p>
              <p className="mb-2 text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>{name}</p>
              <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
