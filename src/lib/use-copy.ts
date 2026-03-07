import { useState, useCallback, useEffect, useRef } from "react";

type CopyState = "idle" | "done" | "failed";

export function useCopy() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setCopyState("idle"), 1800);
  }, []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("done");
      scheduleReset();
      return true;
    } catch {
      setCopyState("failed");
      scheduleReset();
      return false;
    }
  }, [scheduleReset]);

  return { copyState, copy };
}
