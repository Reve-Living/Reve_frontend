import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "447386340475";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 right-4 z-50 inline-flex items-center gap-3 rounded-full border border-[hsl(var(--bronze)/0.22)] bg-[hsl(var(--cream)/0.94)] px-3 py-2 text-[hsl(var(--espresso))] shadow-[0_10px_30px_-14px_rgba(74,58,46,0.45)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[hsl(var(--ivory))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--bronze-deep))]">
          Need help?
        </span>
        <span className="text-sm font-semibold text-[hsl(var(--espresso))]">
          Chat with us
        </span>
      </span>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_-12px_rgba(37,211,102,0.9)] transition-colors duration-200 group-hover:bg-[#1ebe5b]">
        <MessageCircle className="h-5 w-5" />
      </span>
    </a>
  );
};

export default WhatsAppButton;
