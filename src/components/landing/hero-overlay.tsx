"use client";

import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";

export function HeroOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 58% 52% at 50% 50%, rgba(9,9,11,0.78) 0%, transparent 68%)",
        }}
      />

      {/* txt layer */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
        <div className="pointer-events-auto flex max-w-3xl flex-col items-center text-center">
          <div
            className="mb-7 animate-subtle-fade-up"
            style={{ animationFillMode: "both" }}
          >
            <AppLogo />
          </div>

          {/* eyebrow pill */}
          <div
            className="animate-subtle-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/70 px-3 py-1 text-[10px] tracking-widest text-zinc-500 uppercase backdrop-blur-sm"
            style={{ animationDelay: "60ms", animationFillMode: "both" }}
          >
            <span className="inline-block size-1.5 rounded-full bg-indigo-500 opacity-90" />
            code snippet vault &amp; playground
          </div>

          {/* headline */}
          <h1
            className="animate-subtle-fade-up"
            style={{
              animationDelay: "140ms",
              animationFillMode: "both",
              fontFamily: "var(--font-display)",
            }}
          >
            <span
              className="block text-[clamp(2.4rem,5.8vw,4rem)] font-light leading-[1.1] text-zinc-400"
              style={{ letterSpacing: "0.055em" }}
            >
              stop losing
            </span>
            <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.92] tracking-tight text-white">
              the good&nbsp;<span className="text-indigo-500">stuff.</span>
            </span>
          </h1>

          <p
            className="animate-subtle-fade-up mt-6 max-w-xs text-[13px] leading-relaxed text-zinc-500"
            style={{
              animationDelay: "280ms",
              animationFillMode: "both",
            }}
          >
            one place for every snippet worth keeping — with AI, workspaces, and a live playground.
          </p>

          {/* cta */}
          <div
            className="animate-subtle-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "400ms", animationFillMode: "both" }}
          >
            <Link href="/snippets">
              <Button
                size="lg"
                className="w-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto"
              >
                start for free
              </Button>
            </Link>
            <Link href="/snippets">
              <Button
                variant="ghost"
                size="lg"
                className="text-zinc-600 hover:text-zinc-300"
              >
                sign in
              </Button>
            </Link>
          </div>

          {/* trust line */}
          <p
            className="animate-subtle-fade-up mt-5 text-[11px] text-zinc-700"
            style={{ animationDelay: "520ms", animationFillMode: "both" }}
          >
            no card required &middot; free forever
          </p>
        </div>
      </div>
    </>
  );
}
