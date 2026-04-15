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
            "radial-gradient(ellipse 58% 52% at 50% 50%, rgba(9,9,11,0.72) 0%, transparent 72%)",
        }}
      />

      {/* txt layer */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
        <div className="pointer-events-auto flex max-w-3xl flex-col items-center text-center">
          <div
            className="mb-8 animate-subtle-fade-up"
            style={{ animationFillMode: "both" }}
          >
            <AppLogo />
          </div>

          {/* headline — two-line typographic treatment */}
          <h1
            className="animate-subtle-fade-up"
            style={{
              animationDelay: "110ms",
              animationFillMode: "both",
              fontFamily: "var(--font-display)",
            }}
          >
            {/* line 1: light, wide-tracked */}
            <span
              className="block text-[clamp(2.6rem,6.5vw,4.5rem)] font-light tracking-[0.04em] text-zinc-300"
              style={{ letterSpacing: "0.06em" }}
            >
              Your&nbsp;code,
            </span>
            {/* line 2: bold, accent word in muted indigo */}
            <span
              className="block text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-white"
            >
              always&nbsp;at{" "}
              <span className="text-indigo-600">hand.</span>
            </span>
          </h1>

          <p
            className="animate-subtle-fade-up mt-7 max-w-sm text-[13px] leading-relaxed text-zinc-600"
            style={{
              animationDelay: "260ms",
              animationFillMode: "both",
            }}
          >
            snippets, workspaces, AI — all in one place.
          </p>

          {/* cta */}
          <div
            className="animate-subtle-fade-up mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "400ms", animationFillMode: "both" }}
          >
            <Link href="/snippets">
              <Button
                size="lg"
                className="w-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto"
              >
                get started
              </Button>
            </Link>
            <Link href="/snippets">
              <Button
                variant="ghost"
                size="lg"
                className="text-zinc-600 hover:text-zinc-400"
              >
                sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
