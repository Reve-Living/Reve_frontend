import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type AnnouncementResponse = {
  text?: string;
};

const ANNOUNCEMENT_STORAGE_KEY = 'reve_announcement_text';

const AnnouncementBar = () => {
  const [text, setText] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) || '';
  });

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
    <div className="gradient-bronze py-0.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
      <span className="block min-h-[15px]">{text || '\u00A0'}</span>
    </div>
  );
};

export default AnnouncementBar;
