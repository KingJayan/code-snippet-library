import { describe, expect, it } from "vitest";
import { executeCode } from "./sandbox";

describe("executeCode", () => {
  it("returns passthrough output for txt", async () => {
    const result = await executeCode({
      language: "txt",
      code: "hello world",
      stdin: "",
    });

    expect(result.stdout).toBe("hello world");
    expect(result.stderr).toBe("");
    expect(result.runtimeMs).toBe(0);
    expect(result.memoryKb).toBe(0);
  });

  it("returns passthrough output for md", async () => {
    const result = await executeCode({
      language: "md",
      code: "# title",
    });

    expect(result.stdout).toBe("# title");
    expect(result.stderr).toBe("");
  });
});
