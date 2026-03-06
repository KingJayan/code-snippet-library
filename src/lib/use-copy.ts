import { useState, useCallback } from "react";

type CopyState = "idle" | "done" | "failed";

export function useCopy() {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("done");
      const timeout = setTimeout(() => setCopyState("idle"), 1800);
      return () => clearTimeout(timeout);
    } catch {
      setCopyState("failed");
      const timeout = setTimeout(() => setCopyState("idle"), 1800);
      return () => clearTimeout(timeout);
    }
  }, []);

  return { copyState, copy };
}
