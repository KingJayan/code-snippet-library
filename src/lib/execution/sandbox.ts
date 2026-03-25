export type SupportedExecutionLanguage = "python" | "cpp" | "txt" | "md";

export type ExecuteCodeRequest = {
  language: SupportedExecutionLanguage;
  code: string;
  stdin?: string;
};

export type ExecuteCodeResult = {
  stdout: string;
  stderr: string;
  runtimeMs: number | null;
  memoryKb: number | null;
};

type SandboxProvider = "piston" | "judge0" | "container";

function getProvider(): SandboxProvider {
  const raw = (process.env.SNIPS_EXEC_PROVIDER ?? "piston").trim().toLowerCase();
  if (raw === "judge0" || raw === "container") {
    return raw;
  }
  return "piston";
}

function normalizeLanguage(language: SupportedExecutionLanguage) {
  if (language === "python") {
    return { pistonLanguage: "python", version: "3.10.0" };
  }

  if (language === "cpp") {
    return { pistonLanguage: "cpp", version: "10.2.0" };
  }

  return null;
}

function plainTextResult(code: string): ExecuteCodeResult {
  return {
    stdout: code,
    stderr: "",
    runtimeMs: 0,
    memoryKb: 0,
  };
}

async function executeWithPiston(request: ExecuteCodeRequest): Promise<ExecuteCodeResult> {
  const languageConfig = normalizeLanguage(request.language);
  if (!languageConfig) {
    return plainTextResult(request.code);
  }

  const endpoint = (process.env.SNIPS_EXEC_PISTON_URL ?? "https://emkc.org/api/v2/piston/execute").trim();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      language: languageConfig.pistonLanguage,
      version: languageConfig.version,
      files: [{ content: request.code }],
      stdin: request.stdin ?? "",
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    run?: {
      stdout?: string;
      stderr?: string;
      code?: number;
      signal?: string;
      time?: number;
      memory?: number;
    };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? `execution failed with status ${response.status}`);
  }

  const run = payload.run;
  if (!run) {
    throw new Error("execution service returned empty run payload");
  }

  return {
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? (typeof run.code === "number" && run.code !== 0 ? `exit code: ${run.code}` : ""),
    runtimeMs: typeof run.time === "number" ? Math.round(run.time * 1000) : null,
    memoryKb: typeof run.memory === "number" ? run.memory : null,
  };
}

export async function executeCode(request: ExecuteCodeRequest): Promise<ExecuteCodeResult> {
  const provider = getProvider();

  if (request.language === "txt" || request.language === "md") {
    return plainTextResult(request.code);
  }

  if (provider === "judge0") {
    throw new Error("judge0 provider is not configured yet. set SNIPS_EXEC_PROVIDER=piston.");
  }

  if (provider === "container") {
    throw new Error("container runner provider is not configured yet. set SNIPS_EXEC_PROVIDER=piston.");
  }

  return executeWithPiston(request);
}
