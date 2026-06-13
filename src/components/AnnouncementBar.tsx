import { useEffect, useState } from 'react';
import { CreditCard, Megaphone, MessageCircle, PhoneCall, Truck } from 'lucide-react';
import { apiGet } from '@/lib/api';
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_LINK,
} from '@/lib/contact';

type AnnouncementResponse = {
  text?: string;
};

const DEFAULT_ANNOUNCEMENT_TEXT = 'Free UK delivery on all orders • Flexible payment options available';

const getAnnouncementSegments = (value: string) =>
  value
    .split(/\s*[•|]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

const AnnouncementBar = () => {
  const [text, setText] = useState(DEFAULT_ANNOUNCEMENT_TEXT);
  const announcementText = (text || DEFAULT_ANNOUNCEMENT_TEXT).trim();
  const announcementSegments = getAnnouncementSegments(announcementText);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const response = await apiGet<AnnouncementResponse>('/promotions/announcement/');
        const nextText = (response?.text || '').trim();
        setText(nextText || DEFAULT_ANNOUNCEMENT_TEXT);
      } catch {
        setText(DEFAULT_ANNOUNCEMENT_TEXT);
      }
    };

    void loadAnnouncement();
  }, []);

  return (
    <div className="gradient-bronze text-primary-foreground">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="inline-flex items-center gap-2 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-100"
          >
            <PhoneCall className="h-4.5 w-4.5" />
            <span>Call us at {SUPPORT_PHONE_DISPLAY}</span>
          </a>

          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-primary-foreground/88">
            {announcementSegments.length > 1 ? (
              announcementSegments.map((segment, index) => {
                const SegmentIcon = index === 0 ? Truck : CreditCard;

                return (
                  <div key={`${segment}-${index}`} className="inline-flex items-center gap-2">
                    <SegmentIcon className="h-4 w-4 shrink-0" />
                    <span className="leading-5">{segment}</span>
                    {index < announcementSegments.length - 1 && (
                      <span className="ml-1 text-primary-foreground/55" aria-hidden="true">
                        •
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="inline-flex min-w-0 items-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0" />
                <p className="min-w-0 leading-5">{announcementText}</p>
              </div>
            )}
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
