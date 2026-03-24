import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type AnnouncementResponse = {
  text?: string;
};

const AnnouncementBar = () => {
  const [text, setText] = useState('Coming Soon');

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const response = await apiGet<AnnouncementResponse>('/promotions/announcement/');
        const nextText = (response?.text || '').trim();
        if (nextText) setText(nextText);
      } catch {
        setText('Coming Soon');
      }
    };

    void loadAnnouncement();
  }, []);

  return (
    <div className="gradient-bronze py-0.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
      {text}
    </div>
  );
};

export default AnnouncementBar;
