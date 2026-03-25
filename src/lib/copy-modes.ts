export type SnippetCopyMode = "raw" | "markdown" | "with-line-numbers";

export function formatSnippetForCopy(params: {
  code: string;
  language: string;
  mode: SnippetCopyMode;
}) {
  const code = params.code ?? "";

  if (params.mode === "markdown") {
    return `\
\`\`\`${params.language || ""}
${code}
\`\`\``;
  }

  if (params.mode === "with-line-numbers") {
    return code
      .split("\n")
      .map((line, index) => `${index + 1} | ${line}`)
      .join("\n");
  }

  return code;
}
