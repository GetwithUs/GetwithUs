import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { DEMOS_PATH } from "@/config/demos";
// next.config.ts sits at the repository root, outside src/, so the @/ alias cannot reach it.
// eslint-disable-next-line no-restricted-imports
import nextConfig from "../../next.config";

// The pattern compiler Next uses for custom routes (lib/build-custom-route.js); it gives the
// same regex the routes manifest carries, which is what Vercel matches. No type declarations.
const { buildCustomRoute } = createRequire(import.meta.url)("next/dist/lib/build-custom-route") as {
  buildCustomRoute: (type: "rewrite", route: Rule) => { regex: string };
};

type Rule = {
  source: string;
  destination: string;
  has?: { type: string; key?: string; value?: string }[];
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

/** This site's rewrites in order (all are afterFiles rewrites). */
async function rewrites(): Promise<Rule[]> {
  const result = await nextConfig.rewrites?.();
  return Array.isArray(result) ? result : (result?.afterFiles ?? []);
}

/**
 * Where Vercel sends a request, modelled on vercel/vercel packages/next/src/server-build.ts
 * (the isAfterFilesRewrite block). Each afterFiles rewrite's regex gets an optional RSC suffix
 * group in place of its trailing optional slash (with these suffixes because this site uses
 * Partial Prerendering and the client segment cache), and whatever that group matched is
 * appended to the destination. The first rule whose regex and `has` conditions match wins.
 */
const RSC_SUFFIX = String.raw`\.rsc|\.prefetch\.rsc|\.segments/.+\.segment\.rsc`;

function onVercel(rules: Rule[], path: string, headers: Record<string, string> = {}) {
  for (const rule of rules) {
    const hasOk = (rule.has ?? []).every(
      (h) =>
        h.type !== "header" ||
        (h.key !== undefined &&
          h.key in headers &&
          (h.value === undefined || headers[h.key] === h.value)),
    );
    if (!hasOk) continue;
    const regex = buildCustomRoute("rewrite", rule).regex.replace(
      /\/?\(\?:\/\)\?/,
      `(?:/)?(?<rscsuff>${RSC_SUFFIX})?`,
    );
    const match = new RegExp(regex).exec(path);
    if (match) return { rule, appended: match.groups?.rscsuff ?? "" };
  }
  return undefined;
}

describe("demo website rewrites", () => {
  const rsc = { rsc: "1" };

  it("send the index and every page under it to the demos app", async () => {
    const rules = await rewrites();
    expect(onVercel(rules, DEMOS_PATH)?.rule.source).toBe(DEMOS_PATH);
    expect(onVercel(rules, `${DEMOS_PATH}/skincare/shop`)?.rule.source).toBe(
      `${DEMOS_PATH}/:path+`,
    );
    expect(onVercel(rules, `${DEMOS_PATH}/_next/static/chunks/app.js`)?.rule.source).toBe(
      `${DEMOS_PATH}/:path+`,
    );
    expect(onVercel(rules, "/demosx")).toBeUndefined();
    expect(onVercel(rules, "/demosx.rsc", rsc)).toBeUndefined();
  });

  it("on Vercel, send index navigations and prefetches to the index itself", async () => {
    const rules = await rewrites();
    for (const path of [
      `${DEMOS_PATH}.rsc`,
      `${DEMOS_PATH}.prefetch.rsc`,
      `${DEMOS_PATH}.segments/_tree.segment.rsc`,
      `${DEMOS_PATH}.segments/children/__PAGE__.segment.rsc`,
    ]) {
      const route = onVercel(rules, path, rsc);
      // Anything appended would land outside the demos app's basePath and 404 there.
      expect(route?.appended, path).toBe("");
      expect(route?.rule.destination.endsWith(DEMOS_PATH), path).toBe(true);
      expect(route?.rule.has, path).toEqual([{ type: "header", key: "rsc", value: "1" }]);
    }
  });

  it("on Vercel, keep the suffix for deeper pages, which the demos app handles", async () => {
    const rules = await rewrites();
    expect(onVercel(rules, `${DEMOS_PATH}/skincare.rsc`, rsc)).toMatchObject({
      rule: { source: `${DEMOS_PATH}/:path+` },
      appended: ".rsc",
    });
    expect(
      onVercel(rules, `${DEMOS_PATH}/skincare/shop.segments/_tree.segment.rsc`, rsc),
    ).toMatchObject({
      rule: { source: `${DEMOS_PATH}/:path+` },
      appended: ".segments/_tree.segment.rsc",
    });
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
