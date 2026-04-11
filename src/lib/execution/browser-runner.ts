export type BrowserExecutionLanguage = "python" | "cpp" | "txt" | "md";

export type BrowserExecutionRequest = {
  language: BrowserExecutionLanguage;
  code: string;
  stdin?: string;
};

export type BrowserExecutionResult = {
  stdout: string;
  stderr: string;
  runtimeMs: number | null;
  memoryKb: number | null;
};

type PyodideModule = {
  loadPyodide: () => Promise<PyodideRuntime>;
};

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
};

let pyodideRuntimePromise: Promise<PyodideRuntime> | null = null;
let pyodideScriptPromise: Promise<void> | null = null;

declare global {
  interface Window {
    loadPyodide?: () => Promise<PyodideRuntime>;
  }
}

function nowMs() {
  if (typeof performance !== "undefined") {
    return performance.now();
  }
  return Date.now();
}

function plainTextResult(code: string): BrowserExecutionResult {
  return {
    stdout: code,
    stderr: "",
    runtimeMs: 0,
    memoryKb: 0,
  };
}

async function getPyodideRuntime() {
  if (typeof window === "undefined") {
    throw new Error("python execution is only available in the browser");
  }

  if (!pyodideRuntimePromise) {
    pyodideRuntimePromise = (async () => {
      const mod = await loadPyodideModule();
      return mod.loadPyodide();
    })();
  }

  return pyodideRuntimePromise;
}

async function loadPyodideModule(): Promise<PyodideModule> {
  if (typeof window.loadPyodide === "function") {
    return { loadPyodide: window.loadPyodide };
  }

  if (!pyodideScriptPromise) {
    pyodideScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("failed to load python runtime"));
      document.head.appendChild(script);
    });
  }

  await pyodideScriptPromise;

  if (typeof window.loadPyodide !== "function") {
    throw new Error("python runtime is unavailable");
  }

  return { loadPyodide: window.loadPyodide };
}

function normalizeBatchedOutput(text: string) {
  return text.endsWith("\n") ? text : `${text}\n`;
}

async function executePython(request: BrowserExecutionRequest): Promise<BrowserExecutionResult> {
  const startedAt = nowMs();
  const runtime = await getPyodideRuntime();
  let stdout = "";
  let stderr = "";

  runtime.setStdout({
    batched: (text) => {
      stdout += normalizeBatchedOutput(text);
    },
  });

  runtime.setStderr({
    batched: (text) => {
      stderr += normalizeBatchedOutput(text);
    },
  });

  const stdinValue = JSON.stringify(request.stdin ?? "");

  try {
    await runtime.runPythonAsync(`import io\nimport sys\nsys.stdin = io.StringIO(${stdinValue})`);
    await runtime.runPythonAsync(request.code);
  } catch (error) {
    const message = error instanceof Error ? error.message : "python execution failed";
    stderr = stderr ? `${stderr}${message}` : message;
  }

  return {
    stdout,
    stderr,
    runtimeMs: Math.round(nowMs() - startedAt),
    memoryKb: null,
  };
}

export async function executeInBrowser(
  request: BrowserExecutionRequest
): Promise<BrowserExecutionResult> {
  if (request.language === "txt" || request.language === "md") {
    return plainTextResult(request.code);
  }

  if (request.language === "cpp") {
    throw new Error("c++ execution is unavailable in hosted free mode. run it locally.");
  }

  return executePython(request);
}