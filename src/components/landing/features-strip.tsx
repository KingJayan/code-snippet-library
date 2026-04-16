const FEATURES = [
  {
    num: "01",
    name: "collect",
    label: "snippet vault",
    desc: "tag, search, and pin snippets across languages. find anything in under two keystrokes.",
    detail: "python · typescript · sql · rust · bash · +more",
  },
  {
    num: "02",
    name: "collaborate",
    label: "workspaces",
    desc: "create isolated workspaces for projects or teams. share with fine-grained roles.",
    detail: "owner · editor · viewer",
  },
  {
    num: "03",
    name: "run",
    label: "live playground",
    desc: "execute python right in the browser — no setup, no server. paste and go.",
    detail: "pyodide in-browser runtime",
  },
  {
    num: "04",
    name: "ask",
    label: "AI assist",
    desc: "explain, rewrite, or debug any snippet. bring your own key or use the built-in.",
    detail: "claude · openai · gemini",
  },
] as const;

export function FeaturesStrip() {
  return (
    <section className="border-t border-zinc-800/50 bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        {/* section header */}
        <div className="border-b border-zinc-800/50 px-8 py-10">
          <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase mb-2">what&apos;s inside</p>
          <h2
            className="text-2xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            everything you actually need.
            <span className="text-zinc-600"> nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-zinc-800/50">
          {FEATURES.map(({ num, name, label, desc, detail }, i) => (
            <div
              key={num}
              className={[
                "group relative px-8 py-9 transition-colors duration-200 hover:bg-zinc-900/40",
                i % 2 === 0 ? "sm:border-r border-zinc-800/50" : "",
                i < FEATURES.length - 2 ? "border-b border-zinc-800/50" : "",
                i === FEATURES.length - 2 ? "border-b sm:border-b-0 border-zinc-800/50" : "",
              ].join(" ")}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-widest text-zinc-700">{num}</p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                  {label}
                </span>
              </div>
              <p
                className="mb-2 text-[15px] font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {name}
              </p>
              <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
              <p className="mt-3 font-mono text-[10px] text-zinc-700">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
