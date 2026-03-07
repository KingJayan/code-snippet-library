"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, supabase } from "@/lib/supabase";

const OWNER_EMAIL = "jayanp0202@gmail.com";

type RuntimeStats = {
  heapUsedMb: number | null;
  sessionItems: number;
  localItems: number;
};

function readRuntimeStats(): RuntimeStats {
  let heapUsedMb: number | null = null;
  const memory = (performance as Performance & {
    memory?: { usedJSHeapSize?: number };
  }).memory;

  if (typeof memory?.usedJSHeapSize === "number") {
    heapUsedMb = Math.round((memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
  }

  return {
    heapUsedMb,
    sessionItems: window.sessionStorage.length,
    localItems: window.localStorage.length,
  };
}

export function DevDebugPanel() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<RuntimeStats | null>(null);

  const modeLabel = useMemo(() => process.env.NODE_ENV ?? "unknown", []);

  useEffect(() => {
    let mounted = true;

    async function syncOwnerAccess() {
      const user = await getCurrentUser();
      if (!mounted) return;

      const email = user?.email?.toLowerCase().trim();
      const isOwner = email === OWNER_EMAIL;
      setAllowed(isOwner);
      if (isOwner) {
        setStats(readRuntimeStats());
      }
    }

    void syncOwnerAccess();

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase().trim();
      const isOwner = email === OWNER_EMAIL;
      setAllowed(isOwner);
      if (isOwner) {
        setStats(readRuntimeStats());
      }
    }).data.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!allowed || !open) return;

    const interval = window.setInterval(() => {
      setStats(readRuntimeStats());
    }, 2500);

    return () => window.clearInterval(interval);
  }, [allowed, open]);

  if (!allowed) {
    return null;
  }

  function refreshStats() {
    setStats(readRuntimeStats());
  }

  function clearSessionCache() {
    const keysToDelete: string[] = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith("snips.")) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
    refreshStats();
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[85]">
      {!open ? (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="pointer-events-auto vfx-icon-chip"
          onClick={() => setOpen(true)}
          aria-label="open dev panel"
          title="open dev panel"
        >
          <Bug className="size-4" />
        </Button>
      ) : (
        <section className="pointer-events-auto w-[300px] rounded-xl border border-border/70 bg-card/95 p-3 text-xs shadow-lg backdrop-blur vfx-surface vfx-edge-light vfx-float-shadow">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 font-medium">
              <Bug className="size-3.5" />
              dev panel
            </h2>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="close dev panel"
            >
              <ChevronUp className="size-3" />
            </Button>
          </header>

          <div className="space-y-1.5 text-muted-foreground">
            <p><span className="text-foreground">mode:</span> {modeLabel}</p>
            <p><span className="text-foreground">route:</span> {pathname || "-"}</p>
            <p>
              <span className="text-foreground">heap:</span>{" "}
              {stats?.heapUsedMb !== null && stats?.heapUsedMb !== undefined ? `${stats.heapUsedMb} MB` : "n/a"}
            </p>
            <p><span className="text-foreground">session keys:</span> {stats?.sessionItems ?? 0}</p>
            <p><span className="text-foreground">local keys:</span> {stats?.localItems ?? 0}</p>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <Button type="button" size="xs" variant="outline" onClick={refreshStats}>
              <RefreshCw className="size-3" />
              refresh
            </Button>
            <Button type="button" size="xs" variant="outline" onClick={clearSessionCache}>
              <Trash2 className="size-3" />
              clear session
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
