import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { LifestyleArticle, LifestyleSection as LifestyleSectionType } from '@/lib/types';

const LifestyleSection = () => {
  const [section, setSection] = useState<LifestyleSectionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveUrl = useMemo(
    () => (value?: string) => {
      const raw = (value || '').trim();
      if (!raw) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
        return raw;
      }
      if (raw.startsWith('//')) return `https:${raw}`;
      const base = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_API_BASE_URL || '';
      if (raw.startsWith('/')) {
        try {
          return base ? new URL(raw, base).toString() : raw;
        } catch {
          return raw;
        }
      }
      return raw;
    },
    []
  );

  useEffect(() => {
    const loadSection = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<LifestyleSectionType[]>('/lifestyle-sections/?active_only=1');
        const firstSection = Array.isArray(data) ? data[0] : null;
        setSection(firstSection || null);
      } catch {
        setSection(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSection();
  }, []);

  const visibleArticles = (section?.articles || [])
    .filter((article) => article.is_active !== false)
    .slice(0, 2);

  if (!isLoading && (!section || visibleArticles.length === 0)) {
    return null;
  }

  const getReadMoreHref = (article: LifestyleArticle) => {
    if (article.read_more_type === 'pdf') return resolveUrl(article.read_more_pdf || article.read_more_target);
    if (article.read_more_type === 'url') return resolveUrl(article.read_more_url || article.read_more_target);
    return '';
  };

  return (
    <section className="relative overflow-hidden bg-[#F7F2EB] py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/15 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-primary backdrop-blur">
            Inspiration
          </span>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {section?.title || 'Transform Your Home'}
          </h2>
          {!!section?.subtitle && (
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              {section.subtitle}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {visibleArticles.map((article, index) => {
            const readMoreHref = getReadMoreHref(article);
            const imageOnLeft = index % 2 === 0;
            const articleAccentClasses = imageOnLeft
              ? 'bg-white/90'
              : 'bg-[#FCF8F2]';

            return (
              <article
                key={article.id}
                className={`overflow-hidden rounded-[28px] border border-black/5 shadow-[0_18px_50px_rgba(42,31,22,0.08)] ${articleAccentClasses}`}
              >
                <div className="grid h-full grid-cols-1 md:grid-cols-2">
                  <div className={`relative min-h-[280px] overflow-hidden bg-muted md:min-h-[360px] ${imageOnLeft ? 'md:order-1' : 'md:order-2'}`}>
                    {article.image && (
                      <img
                        src={resolveUrl(article.image)}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      />
                    )}
                    <div className={`absolute inset-0 ${imageOnLeft ? 'bg-gradient-to-r from-black/8 to-transparent' : 'bg-gradient-to-l from-black/8 to-transparent'}`} />
                  </div>

                  <div className={`flex flex-col justify-center p-7 md:p-10 lg:p-12 ${imageOnLeft ? 'md:order-2' : 'md:order-1'}`}>
                    <span className="mb-4 inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Editorial Feature
                    </span>
                    <h3 className="max-w-md font-serif text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                      {article.title}
                    </h3>
                    <div className="mt-6 h-px w-16 bg-primary/30" />
                    <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                      {article.description}
                    </p>

                    {readMoreHref && (
                      <div className="mt-8">
                        <Button asChild className="group h-11 rounded-full px-6 gradient-bronze">
                          <a href={readMoreHref} target="_blank" rel="noreferrer">
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
