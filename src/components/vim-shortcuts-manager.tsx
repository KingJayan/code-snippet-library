"use client";

import { useEffect } from "react";
import { readBoolSetting, SETTINGS_KEYS } from "@/lib/settings";

type VimMode = "insert" | "normal";

function getEditorTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  if (!(target instanceof HTMLTextAreaElement)) return null;
  if (target.dataset.vimEditor !== "1") return null;
  return target;
}

function getMode(element: HTMLTextAreaElement): VimMode {
  return element.dataset.vimMode === "normal" ? "normal" : "insert";
}

function setMode(element: HTMLTextAreaElement, mode: VimMode) {
  element.dataset.vimMode = mode;
}

function lineStart(code: string, index: number) {
  const i = Math.max(0, Math.min(index, code.length));
  const prev = code.lastIndexOf("\n", i - 1);
  return prev === -1 ? 0 : prev + 1;
}

function lineEnd(code: string, index: number) {
  const i = Math.max(0, Math.min(index, code.length));
  const next = code.indexOf("\n", i);
  return next === -1 ? code.length : next;
}

function moveCursorLine(element: HTMLTextAreaElement, direction: -1 | 1) {
  const code = element.value;
  const pos = element.selectionStart ?? 0;

  const currentStart = lineStart(code, pos);
  const currentColumn = pos - currentStart;

  if (direction < 0) {
    if (currentStart === 0) return;
    const prevEnd = currentStart - 1;
    const prevStart = lineStart(code, prevEnd);
    const prevLineLength = prevEnd - prevStart;
    const nextPos = prevStart + Math.min(currentColumn, prevLineLength);
    element.setSelectionRange(nextPos, nextPos);
    return;
  }

  const currentEnd = lineEnd(code, pos);
  if (currentEnd >= code.length) return;

  const nextStart = currentEnd + 1;
  const nextEnd = lineEnd(code, nextStart);
  const nextLineLength = nextEnd - nextStart;
  const nextPos = nextStart + Math.min(currentColumn, nextLineLength);
  element.setSelectionRange(nextPos, nextPos);
}

export function VimShortcutsManager() {
  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      if (!readBoolSetting(SETTINGS_KEYS.vimShortcuts, false)) return;
      const target = getEditorTarget(event.target);
      if (!target) return;
      if (!target.dataset.vimMode) {
        setMode(target, "normal");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!readBoolSetting(SETTINGS_KEYS.vimShortcuts, false)) return;

      const target = getEditorTarget(event.target);
      if (!target) return;

      const mode = getMode(target);
      const key = event.key.toLowerCase();

      if (mode === "insert") {
        if (key === "escape") {
          event.preventDefault();
          setMode(target, "normal");
        }
        return;
      }

      if (key === "i") {
        event.preventDefault();
        setMode(target, "insert");
        return;
      }

      if (key === "j" || key === "arrowdown") {
        event.preventDefault();
        moveCursorLine(target, 1);
        return;
      }

      if (key === "k" || key === "arrowup") {
        event.preventDefault();
        moveCursorLine(target, -1);
        return;
      }

      if (key.length === 1) {
        event.preventDefault();
      }
    }

    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
