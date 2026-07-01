import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Category, SubCategory } from '@/lib/types';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';
import type { EdgeAwareImageStyle } from '@/components/EdgeAwareCoverImage';

const getCollectionImageStyle = (name: string): Partial<EdgeAwareImageStyle> => {
  const normalized = (name || '').toLowerCase();

  if (normalized.includes('console table') || normalized.includes('console tables')) {
    return { objectPosition: '50% 42%', baseScale: 1.18, hoverScale: 1.24 };
  }

  if (
    normalized.includes('table') ||
    normalized.includes('tables') ||
    normalized.includes('coffee') ||
    normalized.includes('dining')
  ) {
    return { objectPosition: '50% 46%', baseScale: 1.12, hoverScale: 1.18 };
  }

  return { baseScale: 1.1, hoverScale: 1.16 };
};

const CategoryGrid = () => {
  const navigate = useNavigate();
  type GridItem = {
    id: number;
    name: string;
    slug: string;
    description: string;
    image: string;
    isSubcategory?: boolean;
    parentSlug?: string;
  };
  const [categories, setCategories] = useState<GridItem[]>([]);

  const prefetchCategoryRoute = (categorySlug?: string, subcategorySlug?: string) => {
    const category = String(categorySlug || '').trim();
    const subcategory = String(subcategorySlug || '').trim();
    if (!category) return;

    if (subcategory) {
      void apiGet(`/products/?subcategory=${encodeURIComponent(subcategory)}&summary=1`).catch(() => []);
      void apiGet(`/categories/${encodeURIComponent(category)}/filters/?subcategory=${encodeURIComponent(subcategory)}`).catch(
        () => ({ filters: [] })
      );
      return;
    }

    void apiGet(`/products/?category=${encodeURIComponent(category)}&summary=1`).catch(() => []);
    void apiGet(`/categories/${encodeURIComponent(category)}/filters/`).catch(() => ({ filters: [] }));
  };

  const resolveImageUrl = useMemo(
    () => (value?: string) => {
      const raw = (value || '').trim();
      if (!raw) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
      if (raw.startsWith('//')) return `https:${raw}`;
      const base = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_API_BASE_URL || '';
      if (raw.startsWith('/')) {
        try {
          return base ? new URL(raw, base).toString() : '';
        } catch {
          return '';
        }
      }
      return '';
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryDataRes, subcategoryDataRes] = await Promise.allSettled([
          apiGet<Category[]>('/categories/'),
          apiGet<SubCategory[]>('/subcategories/'),
        ]);

        const categoryData =
          categoryDataRes.status === 'fulfilled' && Array.isArray(categoryDataRes.value) ? categoryDataRes.value : [];
        const subcategoryData =
          subcategoryDataRes.status === 'fulfilled' && Array.isArray(subcategoryDataRes.value)
            ? subcategoryDataRes.value
            : [];
        const uniqueSubcategories = Array.from(
          new Map(
            [...categoryData.flatMap((category) => category.subcategories || []), ...subcategoryData].map(
              (subcategory) => [subcategory.id, subcategory] as const
            )
          ).values()
        );
        const selectedCategories = categoryData.filter((category) => category.show_in_collections);
        const selectedSubcategories = uniqueSubcategories.filter((subcategory) => subcategory.show_in_collections);

        const categoryMap = new Map(categoryData.map((category) => [category.id, category]));
        const buildCard = (
          item: Category | SubCategory,
          parentSlug?: string,
          index = 0,
          isSubcategory = false
        ): GridItem => {
          return {
            id: item.id ?? index,
            name: item.name,
            slug: item.slug,
            description: (item as Category).description || (item as SubCategory).description || '',
            image: resolveImageUrl((item as Category).image || (item as SubCategory).image),
            isSubcategory,
            parentSlug,
          };
        };

        const selectedSubcategoryCards = selectedSubcategories.map((sub, idx) =>
          buildCard(sub, categoryMap.get(sub.category)?.slug, idx, true)
        );

        const selectedCategoryCards = selectedCategories.map((category, idx) => buildCard(category, undefined, idx));
        setCategories([...selectedSubcategoryCards, ...selectedCategoryCards].slice(0, 4));
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="text-center lg:text-left">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
              Explore Our Range
            </span>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              Shop by Collections
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Discover our handcrafted ranges, designed for comfort and built to last
            </p>
          </div>
          
          <div>
            <Button
              size="lg"
              className="group gradient-bronze text-base font-semibold"
              onClick={() => navigate('/collections')}
            >
              View All Collections
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Category Grid - 4 items */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
            <div key={`${category.isSubcategory ? 'sub' : 'cat'}-${category.slug || category.id}`}>
              <Link
                to={
                  category.isSubcategory && category.parentSlug
                    ? `/category/${category.parentSlug}?sub=${category.slug}`
                    : `/category/${category.slug || 'divan-beds'}`
                }
                onMouseEnter={() => prefetchCategoryRoute(category.parentSlug || category.slug, category.isSubcategory ? category.slug : undefined)}
                onFocus={() => prefetchCategoryRoute(category.parentSlug || category.slug, category.isSubcategory ? category.slug : undefined)}
                onPointerDown={() => prefetchCategoryRoute(category.parentSlug || category.slug, category.isSubcategory ? category.slug : undefined)}
                onTouchStart={() => prefetchCategoryRoute(category.parentSlug || category.slug, category.isSubcategory ? category.slug : undefined)}
                className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {category.image ? (
                    <EdgeAwareCoverImage
                      src={resolveImageUrl(category.image)}
                      alt={category.name}
                      imgClassName="duration-700 ease-out brightness-[1.08] saturate-[1.06]"
                      defaultStyle={getCollectionImageStyle(category.name)}
                      containerAspectRatio={4 / 3}
                    />
                  ) : (
                    <div className="flex h-full items-end bg-[linear-gradient(135deg,#f2ebe2_0%,#ded2c4_100%)] p-5">
                      <span className="font-serif text-2xl font-semibold text-[#5f4a38]">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="min-h-[48px] font-serif text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="h-px flex-1 bg-border transition-colors duration-300 group-hover:bg-primary/40" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
