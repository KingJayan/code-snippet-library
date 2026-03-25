export type SnippetBenchmarks = {
  benchmark_chars: number;
  benchmark_bytes: number;
  benchmark_bits: number;
  benchmark_lines: number;
};

export function computeSnippetBenchmarks(code: string): SnippetBenchmarks {
  const safeCode = code ?? "";
  const chars = safeCode.length;
  const bytes = new TextEncoder().encode(safeCode).length;
  const lines = safeCode.length === 0 ? 0 : safeCode.split("\n").length;

  return {
    benchmark_chars: chars,
    benchmark_bytes: bytes,
    benchmark_bits: bytes * 8,
    benchmark_lines: lines,
  };
}
