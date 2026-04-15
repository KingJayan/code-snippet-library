"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getCurrentUser } from "@/lib/supabase";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroOverlay } from "@/components/landing/hero-overlay";
import { FeaturesStrip } from "@/components/landing/features-strip";
import { LandingCta } from "@/components/landing/landing-cta";

// Canvas is browser-only — never SSR
const HeroScene = dynamic(
  () =>
    import("@/components/landing/hero-scene").then((m) => ({
      default: m.HeroScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0" style={{ background: "#09090b" }} />
    ),
  }
);

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.replace("/snippets");
    });
  }, [router]);

  return (
    <main style={{ background: "#09090b", minHeight: "100svh" }}>
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative h-svh w-full overflow-hidden">
        {/* 3D canvas fills the full section */}
        <div className="absolute inset-0">
          <HeroScene />
        </div>

        {/* Headline + CTA overlaid above the canvas */}
        <HeroOverlay />

        {/* Bottom fade into the features section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36"
          style={{
            background:
              "linear-gradient(to top, #09090b 0%, transparent 100%)",
          }}
        />
      </section>

      {/* ── Features ── */}
      <FeaturesStrip />

      {/* ── CTA + Footer ── */}
      <LandingCta />
    </main>
  );
}
