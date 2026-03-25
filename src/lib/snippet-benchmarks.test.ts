import { describe, expect, it } from "vitest";
import { computeSnippetBenchmarks } from "./snippet-benchmarks";

describe("computeSnippetBenchmarks", () => {
  it("computes chars bytes bits and lines", () => {
    const code = "print('hi')\nprint('bye')";
    const result = computeSnippetBenchmarks(code);

    expect(result.benchmark_chars).toBe(code.length);
    expect(result.benchmark_bytes).toBe(new TextEncoder().encode(code).length);
    expect(result.benchmark_bits).toBe(result.benchmark_bytes * 8);
    expect(result.benchmark_lines).toBe(2);
  });

  it("handles empty code", () => {
    const result = computeSnippetBenchmarks("");
    expect(result.benchmark_chars).toBe(0);
    expect(result.benchmark_bytes).toBe(0);
    expect(result.benchmark_bits).toBe(0);
    expect(result.benchmark_lines).toBe(0);
  });
});
