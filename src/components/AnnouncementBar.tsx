import { useEffect, useState } from 'react';
import { MessageCircle, PhoneCall, Sparkles } from 'lucide-react';
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
  const announcementText = (text || 'Free UK delivery on all orders and flexible payment options available').trim();

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
    <div className="gradient-bronze text-primary-foreground">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="inline-flex items-center gap-2 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-100"
          >
            <PhoneCall className="h-4.5 w-4.5" />
            <span>Call us at {SUPPORT_PHONE_DISPLAY}</span>
          </a>

          <div className="inline-flex min-w-0 items-center gap-2 text-sm text-primary-foreground/88">
            <Sparkles className="h-4 w-4 shrink-0" />
            <p className="min-w-0 truncate leading-5">{announcementText}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-espresso shadow-sm transition-transform hover:scale-[1.02]"
          >
            Call Now
          </a>
          <a
            href={SUPPORT_WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/16"
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
