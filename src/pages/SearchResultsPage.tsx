import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import type { Product } from '@/lib/types';

const PRODUCTS_PER_PAGE = 24;

type ProductPageResponse = {
  count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  results?: Product[];
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const parsePageParam = (value: string | null): number => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const SearchResultsPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const currentPage = parsePageParam(searchParams.get('page'));
  const returnTo = `${location.pathname}${location.search}`;

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = query ? `Search results for "${query}" | Reve Living` : 'Search | Reve Living';
  }, [query]);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setIsLoading(true);

    const params = new URLSearchParams({
      summary: '1',
      search: query,
      page: String(currentPage),
      page_size: String(PRODUCTS_PER_PAGE),
    });

    void apiGet<ProductPageResponse>(`/products/?${params.toString()}`, {
      noStore: true,
      signal: controller.signal,
    })
      .then((response) => {
        if (cancelled) return;
        setProducts(Array.isArray(response?.results) ? response.results : []);
        setTotalCount(typeof response?.count === 'number' ? response.count : 0);
      })
      .catch((error) => {
        if (cancelled || isAbortError(error)) return;
        setProducts([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));
  const displayRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const displayRangeEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount);

  const goToPage = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(1, nextPage), totalPages);
    const nextParams = new URLSearchParams(searchParams);
    if (clampedPage <= 1) nextParams.delete('page');
    else nextParams.set('page', String(clampedPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-card/60">
        <div className="w-full px-4 py-3 md:px-8 md:py-4 lg:px-12">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-foreground">Search results</span>
          </nav>
        </div>
      </section>

      <section className="w-full px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8 lg:px-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold md:text-4xl text-foreground">
              {query ? `Search results for "${query}"` : 'Search'}
            </h1>
            {!isLoading && (
              <p className="text-muted-foreground">
                {totalCount === 0
                  ? 'No products found.'
                  : `Showing ${displayRangeStart} - ${displayRangeEnd} of ${totalCount} products`}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border/40 bg-card/60">
              <div className="text-center text-sm text-muted-foreground">Searching products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-card">
              <div className="text-center">
                <p className="mb-4 text-lg text-muted-foreground">
                  {query ? `No products match "${query}"` : 'Enter a search term to find products'}
                </p>
                <Button asChild variant="outline">
                  <Link to="/">Return Home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={(currentPage - 1) * PRODUCTS_PER_PAGE + index}
                    returnTo={returnTo}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  {pageNumbers.map((page) => {
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        aria-label={`Go to page ${page}`}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => goToPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-transparent text-foreground hover:border-primary/70 hover:bg-primary/10'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SearchResultsPage;
