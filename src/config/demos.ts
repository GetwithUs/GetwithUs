/**
 * The demo websites we show clients (repo GetwithUs/demos): a separate Next.js app on
 * Vercel with basePath "/demos", served on this domain under DEMOS_PATH (Next.js
 * multi-zones; rewrites in next.config.ts). No `@/` imports: next.config.ts loads this file.
 *
 * The demos run as this origin, so their code can do anything this site's own code can.
 * See docs/decisions/0002-security-headers.md for the tradeoff and how it is contained.
 */
export const DEMOS_PATH = "/demos";

/**
 * Where the demos are served from, unless DEMOS_ORIGIN overrides it (for example
 * http://localhost:3100 to work on both apps locally).
 *
 * WARNING: this is Vercel's automatic production address for the "demos" project, not a
 * domain we own. It stays ours only while that project exists with this domain. Never
 * delete or rename the project, or remove this domain from it, while this site still
 * rewrites to it: someone else could claim the address and their pages would be served
 * at getwithus.in/demos. Remove the rewrites first.
 */
export const DEFAULT_DEMOS_ORIGIN = "https://demos-blond-pi.vercel.app";
