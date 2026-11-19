import { describe, expect, it } from "vitest";
import { originUrl } from "@/config/env";

describe("originUrl (DEMOS_ORIGIN)", () => {
  it("keeps only the origin of an http(s) address", () => {
    expect(originUrl.parse("http://localhost:3100/")).toBe("http://localhost:3100");
    expect(originUrl.parse("https://demos-blond-pi.vercel.app")).toBe(
      "https://demos-blond-pi.vercel.app",
    );
    expect(originUrl.parse("https://example.com/demos?x=1")).toBe("https://example.com");
  });

  it("rejects addresses without http or https, which would break the rewrite", () => {
    expect(originUrl.safeParse("localhost:3100").success).toBe(false);
    expect(originUrl.safeParse("ftp://example.com").success).toBe(false);
    expect(originUrl.safeParse("example.com").success).toBe(false);
  });
});
