import type { NextConfig } from "next";
import { ANALYTICS_PATH, posthogHosts } from "./src/config/analytics";
import { DEFAULT_DEMOS_ORIGIN, DEMOS_PATH } from "./src/config/demos";
import { env } from "./src/config/env";
import { flags } from "./src/config/flags";
import { siteContent } from "./src/content/site";

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
/** The canonical production address (no www). */
const CANONICAL = new URL(siteContent.url);
/** The demos app (see src/config/demos.ts, including the warning about this address). */
const DEMOS_ORIGIN = env.DEMOS_ORIGIN ?? DEFAULT_DEMOS_ORIGIN;

/**
 * One static Content-Security-Policy for every route. A per-request nonce would
 * force every marketing page to render dynamically, so scripts use 'unsafe-inline'
 * (needed for the inline scripts Next.js emits) and nothing else is loosened.
 * Analytics needs nothing here: PostHog is loaded and reached through
 * ANALYTICS_PATH on this origin. See docs/decisions/0002-security-headers.md.
 */
function contentSecurityPolicy(): string {
  const isDev = env.NODE_ENV === "development";
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  const connectSrc = ["'self'"];
  // Turnstile draws its challenge in an iframe; without this the widget is blocked and every form fails.
  const frameSrc: string[] = [];

  if (isDev) scriptSrc.push("'unsafe-eval'");
  if (flags.turnstile) {
    scriptSrc.push(TURNSTILE_ORIGIN);
    connectSrc.push(TURNSTILE_ORIGIN);
    frameSrc.push(TURNSTILE_ORIGIN);
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob:",
    frameSrc.length ? `frame-src ${frameSrc.join(" ")}` : "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(env.NEXT_PUBLIC_SITE_URL.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // PostHog calls paths that end in "/" (such as /e/), which the automatic redirect that
  // removes trailing slashes would break. redirects() below keeps that redirect for every
  // page, so /about/ still goes to /about; only the analytics path is left alone.
  skipTrailingSlashRedirect: true,
  // Inline every public variable from the validated env, including unset ones as "", so client
  // code never falls back to a runtime `process.env` lookup (which ships a process polyfill).
  env: {
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    NEXT_PUBLIC_POSTHOG_KEY: env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
    NEXT_PUBLIC_POSTHOG_REGION: env.NEXT_PUBLIC_POSTHOG_REGION,
    NEXT_PUBLIC_SCHEDULING_URL: env.NEXT_PUBLIC_SCHEDULING_URL ?? "",
    NEXT_PUBLIC_TEST_HOOKS: env.NEXT_PUBLIC_TEST_HOOKS ?? "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // One address for search engines and links: www redirects to the canonical apex domain.
      // Never also redirect the apex to www in Vercel, or the two loop (docs/launch-checklist.md, step 5).
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${CANONICAL.host}` }],
        destination: `${CANONICAL.origin}/:path*`,
        permanent: true,
      },
      // The trailing slash redirect Next.js would do (see skipTrailingSlashRedirect), minus the
      // analytics path. Like Next's own rule, every segment must be non-empty: "//evil.com/" must
      // never become a redirect to "//evil.com", which browsers read as another site.
      {
        source: `/:path((?!${ANALYTICS_PATH.slice(1)}/)(?:[^/]+/)*[^/]+)/`,
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  // Two kinds of rewrites, and src/proxy.ts removes this site's cookies from both, so no
  // admin session leaves this site:
  // - The demo websites (DEMOS_PATH), always: served from the demos app (src/config/demos.ts).
  //   That app sends the same restrictions as below, minus the Turnstile sources and the
  //   HTTPS upgrade it does not need, so either copy of a header gives the same result when
  //   the two responses are merged (docs/decisions/0002-security-headers.md).
  // - Analytics, only while it is on: through this site to PostHog, so ad blockers that
  //   block PostHog's domains do not drop it. Vercel passes the visitor's IP on
  //   (x-forwarded-for), which PostHog needs for its cookieless visitor count.
  async rewrites() {
    const demos = [
      // Client navigations and prefetches of the demos index. On Vercel every rewrite here
      // also matches an RSC suffix (.rsc, .prefetch.rsc or .segments/<segment>.segment.rsc)
      // and appends it to the destination (vercel/vercel, packages/next/src/server-build.ts).
      // For the index that would forward /demos.rsc or /demos.segments/..., outside the demos
      // app's basePath, which 404s there. This rule comes first and spells the suffix out, so
      // nothing is left to append: the request goes to /demos with its headers, and the demos
      // app serves the right payload. Deeper pages keep their suffix on purpose (the demos app
      // handles /demos/<page>.segments/..., GetwithUs/demos#2). The suffix itself arrives as
      // an unused query parameter, which the demos app ignores.
      {
        source: `${DEMOS_PATH}:suffix(\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)`,
        has: [{ type: "header" as const, key: "rsc", value: "1" }],
        destination: `${DEMOS_ORIGIN}${DEMOS_PATH}`,
      },
      { source: DEMOS_PATH, destination: `${DEMOS_ORIGIN}${DEMOS_PATH}` },
      { source: `${DEMOS_PATH}/:path+`, destination: `${DEMOS_ORIGIN}${DEMOS_PATH}/:path+` },
    ];
    if (!flags.analytics) return demos;
    const hosts = posthogHosts(env.NEXT_PUBLIC_POSTHOG_REGION);
    return [
      ...demos,
      { source: `${ANALYTICS_PATH}/static/:path*`, destination: `${hosts.assets}/static/:path*` },
      { source: `${ANALYTICS_PATH}/array/:path*`, destination: `${hosts.assets}/array/:path*` },
      { source: `${ANALYTICS_PATH}/:path*`, destination: `${hosts.ingest}/:path*` },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Belt and braces with the admin metadata: never index the admin area.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The demo businesses are made up. The demos app sends this too; repeating it here
      // keeps them out of search results even if that app's headers ever change.
      { source: DEMOS_PATH, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      {
        source: `${DEMOS_PATH}/:path+`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
