import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { LifestyleArticle, LifestyleSection as LifestyleSectionType } from '@/lib/types';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';

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
    if (article.read_more_type === 'article' && article.slug) return `/transform-your-home/${article.slug}`;
    if (article.read_more_type === 'pdf') return resolveUrl(article.read_more_pdf || article.read_more_target);
    if (article.read_more_type === 'url') return resolveUrl(article.read_more_url || article.read_more_target);
    return '';
  };

  const isExternalReadMore = (article: LifestyleArticle) => article.read_more_type === 'pdf' || article.read_more_type === 'url';
  const isInternalReadMore = (article: LifestyleArticle) => article.read_more_type === 'article' && Boolean(article.slug);

  return (
    <section className="relative overflow-hidden bg-[#F7F2EB] py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            Inspiration
          </span>
          <h2 className="mx-auto mt-4 max-w-5xl font-serif text-2xl font-semibold leading-tight text-foreground md:text-4xl">
            How to Choose the Right Bed and Mattress for You
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-muted-foreground md:text-lg">
            {section?.subtitle || 'A practical guide to choosing the right style, storage and comfort for your home'}
          </p>
        </div>

        <div className="flex flex-wrap justify-start gap-6">
          {visibleArticles.map((article) => {
            const readMoreHref = getReadMoreHref(article);
            const cardInner = (
              <>
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {article.card_image || article.image ? (
                    <EdgeAwareCoverImage
                      src={resolveUrl(article.card_image || article.image)}
                      alt={article.title}
                      containerAspectRatio={4 / 3}
                    />
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="min-h-[56px] font-serif text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {article.title}
                  </h3>
                  <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
                    {article.description}
                  </p>

                  {readMoreHref && (
                    <div className="mt-auto pt-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-primary/80">
                        Read More
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                </div>
              </>
            );

            if (readMoreHref && isInternalReadMore(article)) {
              return (
                <Link
                  key={article.id}
                  to={readMoreHref}
                  className="group flex h-full w-full max-w-sm flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  aria-label={`Read more about ${article.title}`}
                >
                  {cardInner}
                </Link>
              );
            }

            if (readMoreHref && isExternalReadMore(article)) {
              return (
                <a
                  key={article.id}
                  href={readMoreHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full w-full max-w-sm flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  aria-label={`Read more about ${article.title}`}
                >
                  {cardInner}
                </a>
              );
            }

            return (
              <article
                key={article.id}
                className="group flex h-full w-full max-w-sm flex-col overflow-hidden rounded-lg bg-card shadow-luxury"
              >
                {cardInner}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;
