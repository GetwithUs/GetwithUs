"use client";

import { MessageCircle, Phone } from "lucide-react";
import Icon from "@/components/ui/Icon";
import { known, site } from "@/config/site";
import { cn } from "@/lib/cn";
import { trackClickPhone, trackClickWhatsApp } from "@/lib/analytics";

const BTN =
  "flex h-14 items-center gap-2.5 rounded-full pr-5 pl-4 font-bold text-white shadow-lift max-[600px]:w-14 max-[600px]:justify-center max-[600px]:p-0";

export default function WhatsAppFab({ preview = false }: { preview?: boolean }) {
  const phone = known(site.contact.phone);
  const digits = phone?.replace(/\D/g, "");
  if (!phone && !preview) return null;

  const waHref = `https://wa.me/${digits ?? ""}?text=${encodeURIComponent(site.whatsAppMessage)}`;
  const telHref = `tel:${phone ?? ""}`;

  const positionClass =
    "fixed right-5 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-50 flex flex-col items-end gap-3";

  if (preview) {
    return (
      <div className="relative flex flex-col items-end gap-3">
        <span className={cn(BTN, "bg-[#0ea5e9] w-fit")}>
          <Icon icon={Phone} size={24} />
          <span className="max-[600px]:sr-only">Call us</span>
        </span>
        <span className={cn(BTN, "bg-[#15803d] w-fit")}>
          <Icon icon={MessageCircle} size={24} />
          <span className="max-[600px]:sr-only">Chat with us</span>
        </span>
      </div>
    );
  }

  return (
    <div className={positionClass}>
      {/* Phone */}
      <a
        href={telHref}
        aria-label="Call us"
        className={cn(BTN, "bg-[#0ea5e9]")}
        onClick={() => trackClickPhone()}
      >
        <Icon icon={Phone} size={24} />
        <span className="max-[600px]:sr-only">Call us</span>
      </a>

      {/* WhatsApp */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className={cn(BTN, "bg-[#15803d]")}
        onClick={() => trackClickWhatsApp()}
      >
        <Icon icon={MessageCircle} size={24} />
        <span className="max-[600px]:sr-only">Chat with us</span>
      </a>
    </div>
  );
}
