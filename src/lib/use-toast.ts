import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastTone } from "@/components/inline-toast";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ToastTone>("info");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const show = useCallback((msg: string, t: ToastTone = "info", duration = 1800) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setMessage(msg);
    setTone(t);
    timeoutRef.current = window.setTimeout(() => {
      setMessage((current) => (current === msg ? null : current));
    }, duration);
  }, []);

  return { message, tone, show };
}
