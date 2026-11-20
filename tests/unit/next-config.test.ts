import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { DEFAULT_DEMOS_ORIGIN, DEMOS_PATH } from "@/config/demos";
// next.config.ts sits at the repository root, outside src/, so the @/ alias cannot reach it.
// eslint-disable-next-line no-restricted-imports
import nextConfig from "../../next.config";

// The matcher Next.js builds for every custom rewrite (server/lib/router-utils/filesystem.js),
// with the same options. It ships without type declarations.
const { getPathMatch } = createRequire(import.meta.url)(
  "next/dist/shared/lib/router/utils/path-match",
) as {
  getPathMatch: (
    path: string,
    options: { strict: boolean; removeUnnamedParams: boolean },
  ) => (pathname: string) => false | Record<string, unknown>;
};

async function siteHeaders(): Promise<Record<string, string>> {
  const rules = (await nextConfig.headers?.()) ?? [];
  const rule = rules.find((r) => r.source === "/:path*");
  expect(rule).toBeDefined();
  return Object.fromEntries(rule!.headers.map((h) => [h.key, h.value]));
}

/*
 * These headers also reach the browser on /demos, merged with the demos app's own copy
 * (GetwithUs/demos, tests/security-headers.test.ts pins that side). Both must allow the same
 * things, so this pins the parts the two share: changing one of them here should fail a test
 * and send you to the demos repo too. See docs/decisions/0002-security-headers.md.
 */
describe("security headers on every route", () => {
  it("never allow framing", async () => {
    const h = await siteHeaders();
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("allow only this origin for data, fonts, objects, base and forms", async () => {
    const csp = (await siteHeaders())["Content-Security-Policy"];
    for (const directive of [
      "default-src 'self'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]) {
      expect(csp).toContain(directive);
    }
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'/);
  });

  it("keep the other headers the demos app copies", async () => {
    const h = await siteHeaders();
    expect(h["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains; preload");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });
});

describe("demo website rewrites", () => {
  async function demoRewrites() {
    const rewrites = await nextConfig.rewrites?.();
    const list = Array.isArray(rewrites) ? rewrites : (rewrites?.afterFiles ?? []);
    return list.filter((r) => r.destination.startsWith(DEFAULT_DEMOS_ORIGIN));
  }

  it("send the index, every page under it, and an index prefetch to the demos app", async () => {
    const rules = await demoRewrites();
    const matches = (path: string) =>
      rules.filter((r) =>
        getPathMatch(r.source, { strict: true, removeUnnamedParams: true })(path),
      );
    for (const path of [
      DEMOS_PATH,
      `${DEMOS_PATH}/skincare/shop`,
      `${DEMOS_PATH}/_next/static/chunks/app.js`,
      `${DEMOS_PATH}.segments/_tree.segment.rsc`,
    ]) {
      expect(matches(path), path).toHaveLength(1);
    }
    expect(matches("/demosx")).toHaveLength(0);
  });

  it("forward an index prefetch only as an RSC request, to the index", async () => {
    const rule = (await demoRewrites()).find((r) => r.source.includes(".segments"));
    expect(rule?.has).toEqual([{ type: "header", key: "rsc", value: "1" }]);
    expect(rule?.destination).toBe(`${DEFAULT_DEMOS_ORIGIN}${DEMOS_PATH}`);
  });

  it("keep the demos out of search results", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    for (const source of [DEMOS_PATH, `${DEMOS_PATH}/:path+`]) {
      const rule = rules.find((r) => r.source === source);
      expect(rule?.headers, source).toContainEqual({
        key: "X-Robots-Tag",
        value: "noindex, nofollow",
      });
    }
  });
});
