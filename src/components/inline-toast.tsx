"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

type InlineToastProps = {
  message: string | null;
  tone?: ToastTone;
  durationMs?: number;
};

const EXIT_MS = 220;

export function InlineToast({
  message,
  tone = "info",
  durationMs = 1800,
}: InlineToastProps) {
  const [activeMessage, setActiveMessage] = useState<string | null>(message);
  const [activeTone, setActiveTone] = useState<ToastTone>(tone);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (message) {
      setActiveMessage(message);
      setActiveTone(tone);
      setVisible(true);
      setProgress(100);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        setProgress(0);
      });

      return () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
        }
      };
    }

    if (!activeMessage) {
      return;
    }

    setVisible(false);
    const timeout = window.setTimeout(() => {
      setActiveMessage(null);
      setProgress(100);
    }, EXIT_MS);

    return () => window.clearTimeout(timeout);
  }, [activeMessage, message, tone]);

  if (!activeMessage) {
    return null;
  }

  const Icon =
    activeTone === "success"
      ? CheckCircle2
      : activeTone === "error"
        ? AlertCircle
        : Info;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[70]" aria-live="polite">
      <div
        className={cn(
          "pointer-events-auto min-w-60 max-w-[min(92vw,24rem)] overflow-hidden rounded-lg border shadow-lg backdrop-blur transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          activeTone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
          activeTone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
          activeTone === "info" && "border-border/70 bg-card/95 text-foreground"
        )}
        role="status"
      >
        <div className="flex items-start gap-2 px-3 py-2.5 text-xs">
          <Icon className="mt-0.5 size-3.5 shrink-0" />
          <span className="leading-relaxed">{activeMessage}</span>
        </div>
        <div className="h-1 w-full bg-black/10 dark:bg-white/10">
          <div
            className={cn(
              "h-full",
              activeTone === "success" && "bg-emerald-500/70",
              activeTone === "error" && "bg-destructive/70",
              activeTone === "info" && "bg-foreground/40"
            )}
            style={{
              width: `${progress}%`,
              transition: visible ? `width ${durationMs}ms linear` : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}
