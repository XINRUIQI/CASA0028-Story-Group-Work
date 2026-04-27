/**
 * Public URL root for static export (e.g. GitHub Pages with project subpath).
 * Next injects `NEXT_PUBLIC_BASE_PATH` from `next.config` when `BASE_PATH` is set at build.
 * If the build omits it, infer `/<first-segment>` on `*.github.io` so `/REPO/.../compare`
 * still loads `/REPO/static-data/...` instead of `/static-data/...` (which 404s).
 */
const GITHUB_IO_TOP = new Set([
  "compare",
  "fairness",
  "overview",
  "reflection",
  "ending",
  "_next",
]);

export function getPublicBasePath(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return "";
  if (!/\.github\.io$/i.test(window.location.hostname)) return "";

  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length < 1) return "";
  const first = parts[0]!;
  if (GITHUB_IO_TOP.has(first)) return "";
  return `/${first}`;
}

export function getStaticDataRoot(): string {
  return `${getPublicBasePath()}/static-data`;
}
