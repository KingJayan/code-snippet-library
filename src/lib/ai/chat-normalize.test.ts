import { describe, expect, it } from "vitest";
import { normalizeMessages } from "./chat-normalize";

describe("normalizeMessages", () => {
  it("injects system and snippet context messages", () => {
    const messages = normalizeMessages({
      mode: "improve",
      messages: [{ role: "user", content: "improve this" }],
      snippet: {
        title: "demo",
        language: "typescript",
        description: "sample",
        code: "const x = 1;",
      },
    });

    expect(messages[0]?.role).toBe("system");
    expect(messages[1]?.content).toContain("Here is the code snippet context:");
    expect(messages[2]?.content).toBe("improve this");
  });

  it("drops invalid and system messages from user payload", () => {
    const messages = normalizeMessages({
      mode: "debug",
      messages: [
        { role: "system", content: "ignore" },
        { role: "assistant", content: "ok" },
        { role: "user", content: "  " },
      ],
    });

    expect(messages[0]?.role).toBe("system");
    expect(messages.some((message) => message.content === "ignore")).toBe(false);
    expect(messages.some((message) => message.content.trim().length === 0)).toBe(false);
  });
});
