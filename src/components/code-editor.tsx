"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  rectangularSelection,
  dropCursor,
  crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { yaml } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

// Map our language identifiers to CodeMirror language extensions
function getLanguageExtension(language: string) {
  switch (language) {
    case "typescript": return javascript({ typescript: true, jsx: false });
    case "javascript": return javascript({ typescript: false, jsx: false });
    case "python":     return python();
    case "rust":       return rust();
    case "java":       return java();
    case "cpp":
    case "c":          return cpp();
    case "html":       return html();
    case "css":        return css();
    case "sql":        return sql();
    case "json":       return json();
    case "yaml":       return yaml();
    case "markdown":   return markdown();
    case "bash":
    case "plaintext":
    default:           return [];
  }
}

// Minimal theme that uses CSS variables to match the app's design system
const appTheme = EditorView.theme({
  "&": {
    fontSize: "12px",
    fontFamily: "var(--font-jetbrains-mono, monospace)",
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-jetbrains-mono, monospace)",
    lineHeight: "1.65",
    overflow: "auto",
  },
  "&.cm-editor": {
    borderRadius: "inherit",
    height: "100%",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid var(--border-color, rgba(255,255,255,0.06))",
    color: "var(--gutter-color, rgba(255,255,255,0.18))",
    minWidth: "2.8em",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--gutter-active-color, rgba(255,255,255,0.45))",
  },
  ".cm-lineNumbers": {
    minWidth: "2.8em",
  },
  ".cm-foldGutter": {
    minWidth: "1em",
  },
  ".cm-foldGutter .cm-gutterElement": {
    padding: "0 2px",
  },
  ".cm-content": {
    padding: "8px 4px",
    caretColor: "var(--caret-color, #e2e8f0)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--active-line-bg, rgba(255,255,255,0.03))",
    borderRadius: "2px",
  },
  ".cm-selectionBackground, .cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--selection-bg, rgba(99,102,241,0.25)) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--caret-color, #e2e8f0)",
    borderLeftWidth: "2px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(99,102,241,0.2)",
    outline: "1px solid rgba(99,102,241,0.4)",
    borderRadius: "2px",
  },
  ".cm-tooltip": {
    border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
    borderRadius: "6px",
    backgroundColor: "var(--tooltip-bg, #1c1c1e)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li": {
      padding: "3px 10px",
      fontSize: "11px",
      lineHeight: "1.5",
      fontFamily: "var(--font-jetbrains-mono, monospace)",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "rgba(99,102,241,0.25)",
      color: "#e2e8f0",
    },
  },
  ".cm-completionIcon": {
    opacity: "0.6",
  },
});

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
};

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  className,
  placeholder,
  readOnly = false,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Track the last value we programmatically set so we don't loop onChange → setState → update → onChange
  const internalValueRef = useRef(value);

  // Initialize editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const langExtension = getLanguageExtension(language);

    const startState = EditorState.create({
      doc: value,
      extensions: [
        // Theme first so language themes can override
        oneDark,
        appTheme,

        // Core editing
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightActiveLineGutter(),

        // Line numbers + fold gutter
        lineNumbers(),
        foldGutter(),

        // Autocomplete
        autocompletion(),

        // Language
        ...(Array.isArray(langExtension) ? langExtension : [langExtension]),

        // Syntax highlighting fallback
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

        // Keymaps
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),

        // Read-only if needed
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),

        // Dispatch changes back to React
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) {
            const newValue = update.state.doc.toString();
            internalValueRef.current = newValue;
            onChange(newValue);
          }
        }),

        // Placeholder text
        ...(placeholder
          ? [EditorView.contentAttributes.of({ "aria-placeholder": placeholder })]
          : []),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    internalValueRef.current = value;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount — language changes handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. when parent resets state)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value === internalValueRef.current) return; // came from our own onChange
    // Replace entire document
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
    internalValueRef.current = value;
  }, [value]);

  // Recreate editor when language changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !containerRef.current) return;

    const langExtension = getLanguageExtension(language);
    const currentDoc = view.state.doc.toString();

    view.destroy();

    const newState = EditorState.create({
      doc: currentDoc,
      extensions: [
        oneDark,
        appTheme,
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        lineNumbers(),
        foldGutter(),
        autocompletion(),
        ...(Array.isArray(langExtension) ? langExtension : [langExtension]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) {
            const newValue = update.state.doc.toString();
            internalValueRef.current = newValue;
            onChange(newValue);
          }
        }),
        ...(placeholder
          ? [EditorView.contentAttributes.of({ "aria-placeholder": placeholder })]
          : []),
      ],
    });

    const newView = new EditorView({
      state: newState,
      parent: containerRef.current,
    });

    viewRef.current = newView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-code-editor="1"
    />
  );
}
