type BaseUrlValidationMode = "openai-compatible" | "ollama";

type ValidationResult = {
  ok: true;
  normalized: string;
} | {
  ok: false;
  error: string;
};

function isLoopbackHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    return false;
  }

  const octets = parts.map((part) => Number(part));
  if (octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  if (octets[0] === 10) return true;
  if (octets[0] === 127) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;
  if (octets[0] === 169 && octets[1] === 254) return true;

  return false;
}

function isPrivateIpv6(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
}

function isPrivateHost(hostname: string) {
  return isLoopbackHost(hostname) || isPrivateIpv4(hostname) || isPrivateIpv6(hostname);
}

export function validateAiBaseUrl(rawBaseUrl: string, mode: BaseUrlValidationMode): ValidationResult {
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "base url is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "invalid base url" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "base url must not include credentials" };
  }

  const protocol = parsed.protocol.toLowerCase();
  const host = parsed.hostname.toLowerCase();

  if (mode === "openai-compatible") {
    if (protocol !== "https:") {
      return { ok: false, error: "openai-compatible base url must use https" };
    }

    if (isPrivateHost(host)) {
      return { ok: false, error: "openai-compatible base url cannot target private or loopback hosts" };
    }
  }

  if (mode === "ollama") {
    if (protocol !== "http:" && protocol !== "https:") {
      return { ok: false, error: "ollama base url must use http or https" };
    }

    const allowRemote = process.env.SNIPS_AI_ALLOW_REMOTE_OLLAMA === "1";
    if (!allowRemote && !isLoopbackHost(host)) {
      return { ok: false, error: "ollama base url must be localhost unless SNIPS_AI_ALLOW_REMOTE_OLLAMA=1" };
    }
  }

  const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
  const normalized = `${parsed.protocol}//${parsed.host}${pathname}`;
  return { ok: true, normalized };
}
