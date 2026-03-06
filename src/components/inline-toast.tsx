import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

type InlineToastProps = {
  message: string | null;
  tone?: ToastTone;
};

export function InlineToast({ message, tone = "info" }: InlineToastProps) {
  if (!message) {
    return null;
  }

  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;

  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "info" && "border-border/70 bg-muted/40 text-muted-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="size-3.5" />
      {message}
    </p>
  );
}
