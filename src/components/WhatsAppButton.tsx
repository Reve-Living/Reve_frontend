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
      className="group fixed bottom-4 right-4 z-50 inline-flex h-[62px] min-w-[182px] items-center gap-3 rounded-[24px] border border-[hsl(var(--bronze)/0.18)] bg-[hsl(var(--cream)/0.92)] px-5 py-2 text-[hsl(var(--espresso))] shadow-[0_8px_18px_-16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:scale-[1.02] hover:bg-[hsl(var(--ivory))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center">
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
        <span className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[hsl(var(--espresso))]">
          Chat with us
        </span>
      </span>
    </a>
  );
};

export default WhatsAppButton;
