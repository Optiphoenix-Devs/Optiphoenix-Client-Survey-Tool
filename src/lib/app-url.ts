/**
 * Public site origin for auth redirects, emails, and share links.
 *
 * Priority:
 * 1. AUTH_URL / APP_BASE_URL (if not localhost)
 * 2. VERCEL_URL (set automatically on Vercel)
 * 3. localhost (local `next dev` only)
 */
function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

export function getAppBaseUrl() {
  const configured = (
    process.env.AUTH_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    ""
  );

  if (configured) {
    try {
      const url = new URL(configured);
      // Ignore a leftover localhost AUTH_URL when the app is running on Vercel.
      if (!(process.env.VERCEL && isLocalhost(url.hostname))) {
        return normalizeOrigin(configured);
      }
    } catch {
      // fall through
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${normalizeOrigin(process.env.VERCEL_URL)}`;
  }

  return "http://localhost:3000";
}
