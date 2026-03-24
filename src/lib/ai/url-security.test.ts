import { describe, expect, it } from "vitest";
import { validateAiBaseUrl } from "./url-security";

describe("validateAiBaseUrl", () => {
  it("accepts secure public openai-compatible endpoints", () => {
    const result = validateAiBaseUrl("https://api.example.com/v1", "openai-compatible");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized).toBe("https://api.example.com/v1");
    }
  });

  it("rejects private openai-compatible endpoints", () => {
    const result = validateAiBaseUrl("https://127.0.0.1:9999/v1", "openai-compatible");
    expect(result.ok).toBe(false);
  });

  it("accepts localhost ollama endpoint", () => {
    const result = validateAiBaseUrl("http://localhost:11434", "ollama");
    expect(result.ok).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = validateAiBaseUrl("not-a-url", "ollama");
    expect(result.ok).toBe(false);
  });
});
