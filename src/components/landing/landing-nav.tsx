"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              backgroundColor: "rgba(9,9,11,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(39,39,42,0.6)",
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <AppLogo />
        <Link href="/snippets">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Sign in
          </Button>
        </Link>
      </div>
    </nav>
  );
}
