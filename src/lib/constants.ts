// language display map + shiki grammar ids

export const LANGUAGES: Record<string, { label: string; shiki: string }> = {
  typescript:  { label: "ts",       shiki: "typescript" },
  javascript:  { label: "js",       shiki: "javascript" },
  python:      { label: "py",       shiki: "python" },
  rust:        { label: "rs",       shiki: "rust" },
  go:          { label: "go",       shiki: "go" },
  cpp:         { label: "c++",      shiki: "cpp" },
  c:           { label: "c",        shiki: "c" },
  java:        { label: "java",     shiki: "java" },
  html:        { label: "html",     shiki: "html" },
  css:         { label: "css",      shiki: "css" },
  sql:         { label: "sql",      shiki: "sql" },
  bash:        { label: "sh",       shiki: "bash" },
  json:        { label: "json",     shiki: "json" },
  yaml:        { label: "yaml",     shiki: "yaml" },
  markdown:    { label: "md",       shiki: "markdown" },
  plaintext:   { label: "txt",      shiki: "plaintext" },
};

export const LANGUAGE_OPTIONS = Object.entries(LANGUAGES).map(
  ([value, { label }]) => ({ value, label })
);
