const DEFAULT_MAX_PROXY_BYTES = 100 * 1024 * 1024;

function hostnameFromEnvUrl(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isPrivateIPv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isBlockedHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  const isIPv6 = lower.includes(":");
  return (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower === "::1" ||
    lower === "[::1]" ||
    (isIPv6 && (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80"))) ||
    isPrivateIPv4(lower)
  );
}

function allowedConfiguredHosts() {
  return [
    hostnameFromEnvUrl(process.env.NEXT_PUBLIC_R2_PUBLIC_URL),
    hostnameFromEnvUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  ].filter((host): host is string => Boolean(host));
}

export function maxProxyBytes() {
  const configured = Number(process.env.MEDIA_PROXY_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_PROXY_BYTES;
}

export function parseAllowedMediaUrl(rawUrl: string) {
  let sourceUrl: URL;

  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return { error: "URL invalida" as const };
  }

  if (!["http:", "https:"].includes(sourceUrl.protocol)) {
    return { error: "Protocolo no permitido" as const };
  }

  if (sourceUrl.username || sourceUrl.password) {
    return { error: "URL con credenciales no permitida" as const };
  }

  const hostname = sourceUrl.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    return { error: "Destino no permitido" as const };
  }

  const configuredHosts = allowedConfiguredHosts();
  const isAllowedHost =
    configuredHosts.includes(hostname) ||
    hostname.endsWith(".r2.dev") ||
    hostname.endsWith(".supabase.co") ||
    hostname.endsWith(".supabase.in") ||
    hostname.endsWith(".r2.cloudflarestorage.com") ||
    hostname.endsWith(".amazonaws.com");

  if (!isAllowedHost) {
    return { error: "Dominio no permitido" as const };
  }

  return { sourceUrl };
}

export function responseExceedsLimit(response: Response) {
  const length = response.headers.get("content-length");
  if (!length) return false;

  const bytes = Number(length);
  return Number.isFinite(bytes) && bytes > maxProxyBytes();
}

export function safeDownloadFilename(value: string | null) {
  const clean = (value || "descarga-tinyworld")
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/:*?<>|]+/g, "-")
    .trim();

  return clean || "descarga-tinyworld";
}
