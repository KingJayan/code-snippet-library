"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "snips.theme";

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(next: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (next === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, next);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed right-4 bottom-4 z-[60] rounded-full border-border/70 bg-card/90 shadow-lg backdrop-blur"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "switch to light mode" : "switch to dark mode"}
      title={theme === "dark" ? "switch to light mode" : "switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
