import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lead } from "@/features/leads/types";

const captureServerEvent = vi.hoisted(() => vi.fn(async () => undefined));
const notifyLeadVerified = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
const renderEmail = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());
vi.mock("@/server/analytics", () => ({ captureServerEvent }));
vi.mock("@/features/notifications/dispatch", () => ({ notifyLeadVerified }));
vi.mock("@/server/email/render", () => ({ renderEmail }));
vi.mock("@/lib/logger", () => ({
  logger: { error: logError, warn: vi.fn(), info: vi.fn() },
  maskEmail: (email: string) => email,
}));
// The service's other collaborators are never reached here.
vi.mock("@/features/leads/repository", () => ({}));
vi.mock("@/features/notifications/repository", () => ({}));
vi.mock("@/server/email/client", () => ({}));

const { handleLeadVerified } = await import("@/features/leads/service");

const lead = (source: Lead["source"]) =>
  ({
    id: "11111111-1111-4111-8111-111111111111",
    source,
    name: "Test Lead",
    email: "test.lead@example.com",
    services: ["custom-software"],
    timeline: "1-3-months",
  }) as Lead;

afterEach(() => {
  vi.clearAllMocks();
});

describe("handleLeadVerified", () => {
  it("still tells the team and counts the lead when the confirmation email throws", async () => {
    renderEmail.mockRejectedValueOnce(new Error("template broke"));
    await expect(handleLeadVerified(lead("contact"), "req-1")).resolves.toBeUndefined();
    expect(notifyLeadVerified).toHaveBeenCalled();
    expect(captureServerEvent).toHaveBeenCalledWith("lead_verified", lead("contact").id, {
      form: "contact",
      services: ["custom-software"],
      timeline: "1-3-months",
    });
    expect(logError).toHaveBeenCalledWith(
      "Lead follow-up failed",
      expect.objectContaining({ requestId: "req-1" }),
    );
  });

  it("counts the lead even when the team notification throws straight away", async () => {
    notifyLeadVerified.mockImplementationOnce(() => {
      throw new Error("database down");
    });
    await expect(handleLeadVerified(lead("api"), "req-2")).resolves.toBeUndefined();
    expect(captureServerEvent).toHaveBeenCalledWith("lead_verified", lead("api").id, {
      form: "api",
      services: ["custom-software"],
      timeline: "1-3-months",
    });
    expect(renderEmail).not.toHaveBeenCalled();
  });
});
