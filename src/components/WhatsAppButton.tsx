import whatsappIcon from "@/assets/whatsapp-icon.png";

const WHATSAPP_NUMBER = "447386340475";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 right-4 z-50 inline-flex h-[72px] min-w-[182px] items-center gap-4 rounded-[28px] border border-black/10 bg-white px-5 py-3 text-[hsl(var(--espresso))] shadow-[0_8px_18px_-16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#fcfbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center">
        <img
          src={whatsappIcon}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 object-contain"
        />
      </span>
      <span className="flex flex-col leading-none text-left">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--bronze-deep))]">
          Need help?
        </span>
        <span className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[hsl(var(--espresso))]">
          Chat
        </span>
      </span>
    </a>
  );
};

export default WhatsAppButton;
