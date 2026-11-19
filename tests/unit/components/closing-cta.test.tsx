import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TrackedLink from "@/components/layout/TrackedLink";
import ClosingCta from "@/components/sections/ClosingCta";
import Button, { buttonClasses } from "@/components/ui/Button";
import { closingCta } from "@/content/pages";
import { render } from "./render";

const track = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics", () => ({ track }));

type Props = { children?: ReactNode; kind?: string; href?: string; className?: string };

/** Every element in a component's own output whose type matches, without rendering child components. */
function elementsOfType(node: ReactNode, type: unknown): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap((child: ReactNode) => elementsOfType(child, type));
  if (!isValidElement<Props>(node)) return [];
  return [...(node.type === type ? [node] : []), ...elementsOfType(node.props.children, type)];
}

const INVERSE_LG = buttonClasses({ variant: "inverse", size: "lg" });

beforeEach(() => track.mockClear());

describe("ClosingCta email button", () => {
  it("is a tracked email link that looks like the inverse button", () => {
    expect(closingCta.email).toBeDefined();
    const [link, ...rest] = elementsOfType(ClosingCta({}), TrackedLink);
    expect(rest).toHaveLength(0);
    expect(link?.props).toMatchObject({
      kind: "email",
      href: closingCta.email?.href,
      className: INVERSE_LG,
      children: "Email us",
    });
  });

  it("shows and links the address passed in", () => {
    const [link] = elementsOfType(ClosingCta({ contactEmail: "hello@example.com" }), TrackedLink);
    expect(link?.props).toMatchObject({
      kind: "email",
      href: "mailto:hello@example.com",
      children: "hello@example.com",
    });
  });

  it("has no untracked mailto button left", () => {
    const buttons = elementsOfType(ClosingCta({ contactEmail: "hello@example.com" }), Button);
    expect(buttons.map((button) => button.props.href)).toEqual([closingCta.primary.href]);
  });
});

describe("TrackedLink", () => {
  it("records the channel on click and sends no address", () => {
    const link = TrackedLink({ kind: "email", href: "mailto:hello@example.com", children: "x" });
    link.props.onClick({});
    expect(track).toHaveBeenCalledExactlyOnceWith("contact_clicked", { channel: "email" });
  });
});

describe("buttonClasses", () => {
  it("matches the classes Button renders", () => {
    const html = render(
      <Button href="mailto:hello@example.com" variant="inverse" size="lg">
        Email us
      </Button>,
    );
    expect(html).toContain(`class="${INVERSE_LG}"`);
  });
});
