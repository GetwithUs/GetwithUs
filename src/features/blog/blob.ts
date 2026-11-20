/**
 * Server-only helpers for the one supported image store. The database keeps
 * URLs; Blob keeps bytes. Rejecting foreign URLs here stops the admin form
 * from pointing a post at an arbitrary remote image.
 */
const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

export function isBlogBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && BLOB_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

function blogFilePath(url: string): string | null {
  if (!isBlogBlobUrl(url)) return null;
  const parsed = new URL(url);
  const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  return path.startsWith("blog/") ? path : null;
}

/** Best-effort cleanup: a missing/foreign file must never block a post write. */
export async function deleteBlogImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const path = blogFilePath(url);
  if (!path) return;
  const { del } = await import("@vercel/blob");
  await del(path);
}
