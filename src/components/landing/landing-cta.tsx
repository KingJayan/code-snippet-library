import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <>
      {/* cta band */}
      <section className="border-t border-zinc-800/50 bg-zinc-950 py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
            that&apos;s pretty much it.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            completely free, no card, no nonsense.
          </p>
          <div className="mt-7">
            <Link href="/snippets">
              <Button
                size="lg"
                className="w-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto"
              >
                get started
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-zinc-700">seriously, click the button already</p>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-zinc-800/40 bg-zinc-950 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <AppLogo />
          <p className="text-xs text-zinc-700">
            © {new Date().getFullYear()} Snips
          </p>
        </div>
      </footer>
    </>
  );
}
