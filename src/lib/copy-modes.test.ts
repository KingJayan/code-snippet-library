import { describe, expect, it } from "vitest";
import { formatSnippetForCopy } from "./copy-modes";

describe("formatSnippetForCopy", () => {
  it("returns raw code", () => {
    const code = "int mid = l + (r-l)/2;";
    const out = formatSnippetForCopy({ code, language: "cpp", mode: "raw" });
    expect(out).toBe(code);
  });

  it("returns markdown code block", () => {
    const code = "int mid = l + (r-l)/2;";
    const out = formatSnippetForCopy({ code, language: "cpp", mode: "markdown" });
    expect(out).toBe("```cpp\nint mid = l + (r-l)/2;\n```");
  });

  it("returns numbered lines", () => {
    const code = "line a\nline b";
    const out = formatSnippetForCopy({ code, language: "txt", mode: "with-line-numbers" });
    expect(out).toBe("1 | line a\n2 | line b");
  });
});
