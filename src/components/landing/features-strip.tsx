const FEATURES = [
  {
    num: "01",
    name: "Workspaces",
    desc: "Organize by project. Invite teammates with editor or viewer roles — keep everything exactly where it belongs.",
  },
  {
    num: "02",
    name: "AI Assistant",
    desc: "Ask your library anything. Refactor, explain, or improve code with context-aware AI that knows your snippets.",
  },
  {
    num: "03",
    name: "Instant Search",
    desc: "Find any snippet by title, tag, language, or content. Keyboard-first navigation, zero latency.",
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
              <p className="mb-2 text-sm font-semibold text-white">{name}</p>
              <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
