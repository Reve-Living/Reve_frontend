import { useEffect, useState } from 'react';
import { MessageCircle, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { apiGet } from '@/lib/api';
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_LINK,
} from '@/lib/contact';

type AnnouncementResponse = {
  text?: string;
};

const ANNOUNCEMENT_STORAGE_KEY = 'reve_announcement_text';

const AnnouncementBar = () => {
  const [text, setText] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) || '';
  });
  const announcementText = (text || 'Free delivery updates, secure checkout and friendly support').trim();

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const response = await apiGet<AnnouncementResponse>('/promotions/announcement/');
        const nextText = (response?.text || '').trim();
        if (nextText) {
          setText(nextText);
          window.sessionStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, nextText);
        } else {
          setText('');
          window.sessionStorage.removeItem(ANNOUNCEMENT_STORAGE_KEY);
        }
      } catch {
        setText((current) => current || '');
      }
    };

    void loadAnnouncement();
  }, []);

  return (
    <div className="gradient-bronze border-b border-white/10 text-primary-foreground">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/95">
              <Sparkles className="h-3.5 w-3.5" />
              Reve Living Support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/90">
              <ShieldCheck className="h-3.5 w-3.5" />
              {announcementText}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="inline-flex items-center gap-2 font-semibold text-primary-foreground transition-opacity hover:opacity-100"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call us at {SUPPORT_PHONE_DISPLAY}</span>
            </a>
            <span className="inline-flex items-center gap-2 text-primary-foreground/85">
              <ShieldCheck className="h-4 w-4" />
              Hassle-Free Refund Policy
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-espresso shadow-sm transition-transform hover:scale-[1.02]"
          >
            Call Now
          </a>
          <a
            href={SUPPORT_WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/18"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
