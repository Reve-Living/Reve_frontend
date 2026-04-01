import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import type { LifestyleArticle } from '@/lib/types';

const LifestyleArticlePage = () => {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<LifestyleArticle | null>(null);
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
    const loadArticle = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<LifestyleArticle[]>(`/lifestyle-articles/?active_only=1&slug=${encodeURIComponent(slug)}`);
        setArticle(Array.isArray(data) ? data[0] || null : null);
      } catch {
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  useEffect(() => {
    const seoTitle = article?.article_title || article?.title || 'Transform Your Home | Reve Living';
    const seoDescription = article?.article_intro || article?.description || 'Lifestyle inspiration from Reve Living.';
    document.title = `${seoTitle} | Reve Living`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', seoDescription);
  }, [article?.article_intro, article?.article_title, article?.description, article?.title]);

  const paragraphs = (article?.article_body || '')
    .split(/\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const contentBlocks = Array.isArray(article?.article_content) ? article.article_content : [];
  const articleSections = Array.isArray(article?.article_sections)
    ? [...article.article_sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const renderRichText = (value?: string, keyPrefix = 'text') => {
    const blocks = (value || '')
      .split(/\r?\n\r?\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block, blockIndex) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));

      if (bulletLines.length === lines.length && bulletLines.length > 0) {
        return (
          <ul key={`${keyPrefix}-list-${blockIndex}`} className="list-disc space-y-2 pl-6 text-base leading-8 text-foreground/85 md:text-lg">
            {bulletLines.map((line, lineIndex) => (
              <li key={`${keyPrefix}-item-${blockIndex}-${lineIndex}`}>{line.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={`${keyPrefix}-paragraph-${blockIndex}`} className="text-base leading-8 text-foreground/85 md:text-lg">
          {block}
        </p>
      );
    });
  };

  const relatedArticles = (article?.related_articles || []).filter((item) => item.slug);

  return (
    <div className="min-h-screen bg-[#F8F4EE] text-foreground">
      <Header />
      <main className="pb-16 pt-8 md:pt-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button asChild variant="ghost" className="group -ml-3 text-espresso hover:bg-transparent">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to home
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-[28px] border border-black/5 bg-white/80 p-8 shadow-sm">Loading article...</div>
          ) : !article ? (
            <div className="rounded-[28px] border border-black/5 bg-white/80 p-8 shadow-sm">
              <h1 className="font-serif text-3xl font-semibold">Article not found</h1>
              <p className="mt-3 text-muted-foreground">This article may have been removed or is not active right now.</p>
            </div>
          ) : (
            <div className="space-y-10">
              <section className="rounded-[32px] border border-black/5 bg-white px-4 py-8 shadow-[0_20px_60px_rgba(42,31,22,0.08)] md:px-6 md:py-10">
                <div className="mx-auto max-w-[72rem] space-y-5">
                  <div className="mb-3 text-center">
                    <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                      {article.article_title || article.title}
                    </h1>
                    {(article.article_intro || article.description) && (
                      <p className="mx-auto mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-muted-foreground md:text-lg">
                        {article.article_intro || article.description}
                      </p>
                    )}
                  </div>

                  {articleSections.length > 0 ? (
                    <div className="pt-2 space-y-6">
                      {articleSections.map((section, index) => (
                        <div key={`${section.heading}-${index}`} className="space-y-1">
                          <div className="space-y-2">
                            <h2 className="font-serif text-3xl font-semibold leading-tight text-foreground md:text-[2.6rem]">
                              {section.heading}
                            </h2>
                            <div className="space-y-2">{renderRichText(section.text, `${section.heading}-${index}`)}</div>
                          </div>
                          {section.image ? (
                            <div className="mx-auto max-w-3xl leading-none">
                              <div className="h-[320px] overflow-hidden md:h-[380px]">
                              <img
                                src={resolveUrl(section.image)}
                                alt={section.heading}
                                className="block h-full w-full object-cover object-top align-top"
                              />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : contentBlocks.length > 0 ? (
                    contentBlocks.map((block, index) => {
                      if (block.type === 'image' && block.url) {
                        return (
                          <img
                            key={`image-${index}`}
                            src={resolveUrl(block.url)}
                            alt={article.article_title || article.title}
                            className="w-full rounded-[24px] object-cover shadow-[0_16px_40px_rgba(42,31,22,0.08)]"
                          />
                        );
                      }
                      if (block.type === 'paragraph' && block.text) {
                        return <div key={`paragraph-${index}`}>{renderRichText(block.text, `content-${index}`)}</div>;
                      }
                      return null;
                    })
                  ) : paragraphs.length > 0 ? (
                    renderRichText(article.article_body, 'fallback')
                  ) : (
                    <p className="text-base leading-8 text-muted-foreground">No article content has been added yet.</p>
                  )}
                </div>
              </section>

              {relatedArticles.length > 0 && (
                <section className="space-y-6">
                  <div>
                    <span className="inline-flex rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Keep Reading
                    </span>
                    <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">More Articles</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-3">
                    {relatedArticles.map((item) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_40px_rgba(42,31,22,0.06)]"
                      >
                        {(item.card_image || item.image) && (
                          <img
                            src={resolveUrl(item.card_image || item.image)}
                            alt={item.title}
                            className="h-52 w-full object-cover"
                          />
                        )}
                        <div className="space-y-4 p-5">
                          <h3 className="font-serif text-2xl font-semibold leading-tight">{item.title}</h3>
                          {item.description && <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>}
                          <Button asChild variant="outline" className="group rounded-full">
                            <Link to={`/transform-your-home/${item.slug}`}>
                              Read Article
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LifestyleArticlePage;
