"use client";

import { useEffect, useMemo, useState } from "react";
import { Accessibility, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type A11ySettings = {
  reducedMotion: boolean;
  largerText: boolean;
  strongerFocus: boolean;
};

const STORAGE_KEYS = {
  reducedMotion: "snips.a11y.reduced-motion",
  largerText: "snips.a11y.larger-text",
  strongerFocus: "snips.a11y.stronger-focus",
} as const;

function readBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeBool(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}

function applyRootClass(className: string, enabled: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (enabled) {
    root.classList.add(className);
  } else {
    root.classList.remove(className);
  }
}

export function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>({
    reducedMotion: false,
    largerText: false,
    strongerFocus: false,
  });

  useEffect(() => {
    const next: A11ySettings = {
      reducedMotion: readBool(STORAGE_KEYS.reducedMotion),
      largerText: readBool(STORAGE_KEYS.largerText),
      strongerFocus: readBool(STORAGE_KEYS.strongerFocus),
    };

    setSettings(next);
    applyRootClass("a11y-reduce-motion", next.reducedMotion);
    applyRootClass("a11y-large-text", next.largerText);
    applyRootClass("a11y-strong-focus", next.strongerFocus);
  }, []);

  const enabledCount = useMemo(() => Object.values(settings).filter(Boolean).length, [settings]);

  function toggleSetting<K extends keyof A11ySettings>(key: K) {
    setSettings((current) => {
      const nextValue = !current[key];
      const next = { ...current, [key]: nextValue };

      if (key === "reducedMotion") {
        writeBool(STORAGE_KEYS.reducedMotion, nextValue);
        applyRootClass("a11y-reduce-motion", nextValue);
      }

      if (key === "largerText") {
        writeBool(STORAGE_KEYS.largerText, nextValue);
        applyRootClass("a11y-large-text", nextValue);
      }

      if (key === "strongerFocus") {
        writeBool(STORAGE_KEYS.strongerFocus, nextValue);
        applyRootClass("a11y-strong-focus", nextValue);
      }

      return next;
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-16 z-[60] rounded-full border-border/70 bg-card/90 shadow-lg backdrop-blur"
        onClick={() => setOpen(true)}
        aria-label="open accessibility settings"
        title="accessibility settings"
      >
        <Accessibility className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>accessibility settings</DialogTitle>
            <DialogDescription>
              adjust interaction and readability preferences for this app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => toggleSetting("reducedMotion")}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">reduced ui motion</p>
                <p className="text-xs text-muted-foreground">reduce animations and transitions globally</p>
              </div>
              {settings.reducedMotion ? <Check className="size-4 text-foreground" /> : null}
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("largerText")}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">larger text</p>
                <p className="text-xs text-muted-foreground">increase base text size for readability</p>
              </div>
              {settings.largerText ? <Check className="size-4 text-foreground" /> : null}
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("strongerFocus")}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">stronger focus outlines</p>
                <p className="text-xs text-muted-foreground">make keyboard focus states more visible</p>
              </div>
              {settings.strongerFocus ? <Check className="size-4 text-foreground" /> : null}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{enabledCount} setting{enabledCount === 1 ? "" : "s"} enabled</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
