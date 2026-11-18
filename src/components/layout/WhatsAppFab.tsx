import { MessageCircle, Phone } from "lucide-react";
import TrackedLink from "@/components/layout/TrackedLink";
import Icon from "@/components/ui/Icon";
import { known, site } from "@/config/site";
import { cn } from "@/lib/cn";

// Both colours carry white text at 4.5:1 or more: call blue 5.9:1, WhatsApp green 5:1.
const BTN =
  "flex h-14 items-center gap-2.5 rounded-full pr-5 pl-4 font-bold text-white shadow-lift max-[600px]:w-14 max-[600px]:justify-center max-[600px]:p-0";
const CALL = "bg-[#0369a1]";
const WHATSAPP = "bg-[#15803d]";

/**
 * The floating Call and WhatsApp buttons, bottom right above the safe area.
 * Shown only once the owner's phone number is known; icon-only below 600 px.
 * The stack is 132 px tall (two 56 px buttons, 12 px apart, 20 px up), which the
 * cookie banner on phones sits above. `preview` draws the same buttons in
 * place, not linked, for the design kit.
 */
export default function WhatsAppFab({ preview = false }: { preview?: boolean }) {
  const phone = known(site.contact.phone);
  if (!phone && !preview) return null;
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (preview) {
    return (
      <div className="relative flex flex-col items-end gap-3">
        <span className={cn(BTN, CALL, "w-fit")}>
          <Icon icon={Phone} size={24} />
          <span className="max-[600px]:sr-only">Call us</span>
        </span>
        <span className={cn(BTN, WHATSAPP, "w-fit")}>
          <Icon icon={MessageCircle} size={24} />
          <span className="max-[600px]:sr-only">Chat with us</span>
        </span>
      </div>
    );
  }

  return (
    <div className="fixed right-5 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-50 flex flex-col items-end gap-3">
      <TrackedLink
        kind="phone"
        href={`tel:${phone}`}
        aria-label="Call us"
        className={cn(BTN, CALL)}
      >
        <Icon icon={Phone} size={24} />
        <span className="max-[600px]:sr-only">Call us</span>
      </TrackedLink>
      <TrackedLink
        kind="whatsapp"
        href={`https://wa.me/${digits}?text=${encodeURIComponent(site.whatsAppMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className={cn(BTN, WHATSAPP)}
      >
        <Icon icon={MessageCircle} size={24} />
        <span className="max-[600px]:sr-only">Chat with us</span>
      </TrackedLink>
    </div>
  );
}
