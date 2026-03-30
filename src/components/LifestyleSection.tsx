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
    <section className="bg-[#FAF8F5] py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Inspiration
          </span>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
            {section?.title || 'Transform Your Home'}
          </h2>
          {!!section?.subtitle && (
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
              {section.subtitle}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {visibleArticles.map((article, index) => {
            const readMoreHref = getReadMoreHref(article);
            const imageOnLeft = index % 2 === 0;

            return (
              <article
                key={article.id}
                className="overflow-hidden rounded-2xl bg-card shadow-luxury"
              >
                <div className="grid h-full grid-cols-1 md:grid-cols-2">
                  <div className={`relative min-h-[260px] bg-muted ${imageOnLeft ? 'md:order-1' : 'md:order-2'}`}>
                    {article.image && (
                      <img
                        src={resolveUrl(article.image)}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className={`flex flex-col justify-center p-6 md:p-8 ${imageOnLeft ? 'md:order-2' : 'md:order-1'}`}>
                    <h3 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                      {article.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {article.description}
                    </p>

                    {readMoreHref && (
                      <div className="mt-6">
                        <Button asChild className="group gradient-bronze">
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
