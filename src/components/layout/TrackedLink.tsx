"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@/lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** How the visitor is getting in touch, for the `contact_clicked` event. */
  kind: "email" | "whatsapp" | "phone";
};

/**
 * A plain link to our email, WhatsApp, or phone that records `contact_clicked`
 * with the channel. Lets the server components that use it (footer, contact
 * details, the Call and WhatsApp buttons) stay server components. Sends no
 * address or number.
 */
export default function TrackedLink({ kind, onClick, ...props }: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        track("contact_clicked", { channel: kind });
        onClick?.(event);
      }}
    />
  );
}
