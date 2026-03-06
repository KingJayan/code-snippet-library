"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type FloatingActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function FloatingActionButton({ onClick, disabled }: FloatingActionButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg md:hidden"
      aria-label="new snippet"
    >
      <Plus className="size-6" />
    </Button>
  );
}
