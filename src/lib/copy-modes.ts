export type SnippetCopyMode = "raw" | "markdown" | "line-numbers";

export function formatSnippetForCopy(params: {
  code: string;
  language: string;
  mode: SnippetCopyMode;
}) {
  const code = params.code ?? "";

  if (params.mode === "markdown") {
    const language = params.language || "";
    return ["```" + language, code, "```"].join("\n");
  }

  if (params.mode === "line-numbers") {
    return code
      .split("\n")
      .map((line, index) => `${index + 1} | ${line}`)
      .join("\n");
  }

  return code;
}
