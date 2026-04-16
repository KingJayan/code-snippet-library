import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <>
      {/* divider line */}
      <div className="border-t border-zinc-800/50 bg-zinc-950">
        <div className="mx-auto max-w-5xl">
          {/* cta band */}
          <section className="px-8 py-24">
            <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="mb-3 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">get started</p>
                <h2
                  className="text-3xl font-bold tracking-tight text-white leading-[1.05]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  your snippets deserve
                  <br />
                  <span className="text-zinc-500">a better home.</span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500 max-w-xs">
                  free, open, no vendor lock-in. sign up in ten seconds and start saving the code you keep rewriting.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end shrink-0">
                <Link href="/snippets">
                  <Button
                    size="lg"
                    className="bg-white text-zinc-950 hover:bg-zinc-100"
                  >
                    open the vault
                  </Button>
                </Link>
                <p className="text-xs text-zinc-700">just click the button already</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* footer */}
      <footer className="border-t border-zinc-800/40 bg-zinc-950 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8">
          <AppLogo />
          <div className="flex items-center gap-6">
            <Link href="/public" className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
              explore public snippets
            </Link>
            <p className="text-xs text-zinc-700">
              &copy; {new Date().getFullYear()} Snips
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
