import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type UserChipProps = {
  email: string;
};

function initialsFromEmail(email: string) {
  const clean = email.trim();
  if (!clean) return "u";

  const userPart = clean.split("@")[0] ?? clean;
  const parts = userPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return userPart.slice(0, 2).toUpperCase();
}

export function UserChip({ email }: UserChipProps) {
  const initials = initialsFromEmail(email);

  return (
    <Badge
      variant="outline"
      className="h-8 gap-2 rounded-full border-border/70 bg-card px-2 pr-3"
      aria-label={`signed in as ${email}`}
      title={email}
    >
      <span className="grid size-5 place-items-center rounded-full bg-muted text-[10px] font-semibold">
        {initials || <UserRound className="size-3" />}
      </span>
      <span className="max-w-40 truncate text-xs">{email}</span>
    </Badge>
  );
}
