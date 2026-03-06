import { useCallback, useState } from "react";
import type { ToastTone } from "@/components/inline-toast";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ToastTone>("info");

  const show = useCallback((msg: string, t: ToastTone = "info", duration = 1800) => {
    setMessage(msg);
    setTone(t);
    setTimeout(() => {
      setMessage((current) => (current === msg ? null : current));
    }, duration);
  }, []);

  return { message, tone, show };
}
