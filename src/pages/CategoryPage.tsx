import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { apiGet } from '@/lib/api';
import { Category, Product, SubCategory, FilterType } from '@/lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const resolveImageUrl = (value?: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  if (raw.startsWith('//')) {
    return `https:${raw}`;
  }
  if (raw.startsWith('/')) {
    const base = SUPABASE_URL || API_BASE_URL;
    if (base) {
      try {
        return new URL(raw, base).toString();
      } catch {
        return raw;
      }
    }
  }
  return raw;
};

const toBackgroundImageValue = (value?: string): string => {
  const resolved = resolveImageUrl(value);
  if (!resolved) return '';
  return `url("${encodeURI(resolved)}")`;
};

const normalizeSizeName = (raw?: string): string => {
  const value = (raw || '').trim();
  if (!value) return '';

  const key = value.replace(/\s+/g, '').toLowerCase();

  const canonicalMap: Record<string, string> = {
    '2ft6': '2ft6 Small Single',
    '2ft6smallsingle': '2ft6 Small Single',
    'smallingle': '2ft6 Small Single',
    'smallsingle': '2ft6 Small Single',
    'small single': '2ft6 Small Single',

    '3ft': '3ft Single',
    '3ftsingle': '3ft Single',
    'single': '3ft Single',

    '4ft': '4ft Small Double',
    '4ftsmalldouble': '4ft Small Double',
    'threequarter': '4ft Small Double',
    'threequarters': '4ft Small Double',
    'small double': '4ft Small Double',

    '4ft6': '4ft6 Double',
    '4ft6double': '4ft6 Double',
    'double': '4ft6 Double',

    '5ft': '5ft King',
    '5ftking': '5ft King',
    'king': '5ft King',

    '6ft': '6ft Superking',
    '6ftsuperking': '6ft Superking',
    '6ftsuper king': '6ft Superking',
    'superking': '6ft Superking',
    'super king': '6ft Superking',
  };

  const canonical = canonicalMap[key];
  if (canonical) return canonical;

  return value.replace(/ft(\d)/gi, 'ft $1').replace(/\s+/g, ' ').trim();
};

const CategoryPage = () => {
  const getDisplayOrder = (value?: number) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const subSlug = searchParams.get('sub') || '';
  const linkedBedSize = searchParams.get('bed-size') || '';
  const linkedBedProduct = searchParams.get('from') || '';
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<FilterType[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const isMattressCategory = (s: string | undefined) => s === 'mattress' || s === 'mattresses';

  const showSizeFilter = category?.slug === 'beds';
  const showBedSizeFilter = isMattressCategory(category?.slug) && !!linkedBedSize;

  const activeOptionSlugs = useMemo(() => {
    const present = new Set<string>();
    allProducts.forEach((p) =>
      (p.filter_values || []).forEach((fv) => {
        if (fv.option) present.add(fv.option);
      })
    );
    return present;
  }, [allProducts]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setIsFiltersLoading(true);
      setLoadError(false);
      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setAvailableFilters([]);
        setIsLoading(false);
        setIsFiltersLoading(false);
        return;
      }
      try {
        const tryFetchBySlug = async (candidate: string) =>
          apiGet<Category[]>(`/categories/?slug=${candidate}`).catch(() => []);

        const aliasSlug = slug === 'mattress' ? 'mattresses' : slug === 'mattresses' ? 'mattress' : '';

        let categoryRes = await tryFetchBySlug(slug);
        if ((!categoryRes || categoryRes.length === 0) && aliasSlug) {
          categoryRes = await tryFetchBySlug(aliasSlug);
        }

        let categoryItem = categoryRes?.[0] || null;

        if (!categoryItem) {
          const allCategories = await apiGet<Category[]>('/categories/').catch(() => []);
          categoryItem =
            allCategories.find((c) => c.name?.trim().toLowerCase() === slug.replace(/-/g, ' ').toLowerCase()) ||
            null;
        }

        const resolvedSlug = categoryItem?.slug || slug;

        setCategory(categoryItem);

        const [subcategoryRes, productsRes] = await Promise.allSettled([
          categoryItem?.id
            ? apiGet<SubCategory[]>(`/subcategories/?category=${categoryItem.id}`)
            : Promise.resolve([]),
          apiGet<Product[] | { results?: Product[] }>(
            subSlug ? `/products/?subcategory=${subSlug}` : `/products/?category=${resolvedSlug}`
          ),
        ]);

        if (subcategoryRes.status === 'fulfilled' && Array.isArray(subcategoryRes.value)) {
          setSubcategories(subcategoryRes.value);
        } else {
          setSubcategories([]);
        }

        const normalizedProducts =
          productsRes.status === 'fulfilled'
            ? Array.isArray(productsRes.value)
              ? productsRes.value
              : Array.isArray((productsRes.value as { results?: Product[] })?.results)
              ? (productsRes.value as { results: Product[] }).results
              : []
            : [];

        const orderedProducts = [...normalizedProducts].sort((a, b) => {
          const aOrder = getDisplayOrder(a.sort_order);
          const bOrder = getDisplayOrder(b.sort_order);
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.id || 0) - (a.id || 0);
        });
        setAllProducts(orderedProducts);

        if (!categoryItem && orderedProducts.length === 0) {
          setLoadError(true);
        }

        setIsLoading(false);

        void apiGet<{ filters: FilterType[] }>(
          `/categories/${resolvedSlug}/filters/${subSlug ? `?subcategory=${subSlug}` : ''}`
        )
          .then((filtersRes) => {
            if (Array.isArray(filtersRes?.filters)) {
              setAvailableFilters(filtersRes.filters);
            } else {
              setAvailableFilters([]);
            }
          })
          .catch(() => {
            setAvailableFilters([]);
          })
          .finally(() => {
            setIsFiltersLoading(false);
          });
      } catch {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setAvailableFilters([]);
        setLoadError(true);
        setIsLoading(false);
        setIsFiltersLoading(false);
      }
    };
    load();
  }, [slug, subSlug]);

  useEffect(() => {
    if (availableFilters.length === 0) {
      setSelectedFilters({});
      return;
    }
    setSelectedFilters((prev) => {
      const next: Record<string, string[]> = {};
      const valid = new Set(availableFilters.map((f) => f.slug));
      availableFilters.forEach((f) => {
        const options = new Set(f.options.map((o) => o.slug));
        const selected = (prev[f.slug] || []).filter((s) => options.has(s));
        if (selected.length) next[f.slug] = selected;
      });
      return next;
    });
  }, [availableFilters]);

  const selectedSubcategory = useMemo(() => {
    if (!subSlug) return null;
    return (
      subcategories.find((sub) => sub.slug === subSlug) ||
      category?.subcategories?.find((sub) => sub.slug === subSlug) ||
      null
    );
  }, [category, subSlug, subcategories]);

  const heroName = selectedSubcategory?.name || category?.name || '';
  const heroDescription = selectedSubcategory?.description || category?.description || '';
  const fallbackProductImage = allProducts[0]?.images?.[0]?.url || '';
  const heroImage = resolveImageUrl(selectedSubcategory?.image || category?.image || fallbackProductImage || '');
  const heroBackgroundImage = toBackgroundImageValue(heroImage);
  const seoTitle =
    selectedSubcategory?.meta_title ||
    category?.meta_title ||
    (heroName ? `${heroName} | Reve Living` : 'Reve Living');
  const seoDescription =
    selectedSubcategory?.meta_description ||
    category?.meta_description ||
    heroDescription ||
    'Discover premium furniture and made-to-order pieces from Reve Living.';

  useEffect(() => {
    document.title = seoTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', seoDescription);
  }, [seoDescription, seoTitle]);

  const priceBounds = useMemo(() => {
    const prices = allProducts.map((p) => Number(p.price)).filter((v) => !Number.isNaN(v));
    if (prices.length === 0) return { min: 0, max: 1500 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const roundedMin = Math.max(0, Math.floor(min / 50) * 50);
    const roundedMax = Math.max(50, Math.ceil(max / 50) * 50);
    return { min: roundedMin, max: roundedMax };
  }, [allProducts]);

  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

  const allSizes = useMemo(() => {
    if (!showSizeFilter) return [];
    const map = new Map<string, string>();
    allProducts.forEach((p) =>
      (p.sizes || []).forEach((s) => {
        const label = normalizeSizeName(s.name);
        if (!label) return;
        const key = label.replace(/\s+/g, '').toLowerCase();
        if (!map.has(key)) map.set(key, label);
      })
    );
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [allProducts, showSizeFilter]);

  useEffect(() => {
    if (!showSizeFilter && selectedSizes.length > 0) {
      setSelectedSizes([]);
    }
  }, [showSizeFilter, selectedSizes.length]);

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    products = products.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (showSizeFilter && selectedSizes.length > 0) {
      products = products.filter((p) =>
        (p.sizes || []).some((size) => {
          const label = normalizeSizeName(size.name);
          return selectedSizes.includes(label);
        })
      );
    }

    if (showBedSizeFilter && linkedBedSize) {
      products = products.filter((p) =>
        (p.sizes || []).some((size) => size.name.toLowerCase().includes(linkedBedSize.toLowerCase()))
      );
    }

    Object.entries(selectedFilters).forEach(([filterSlug, optionSlugs]) => {
      if (!optionSlugs.length) return;
      products = products.filter((p) => {
        const values = p.filter_values || [];
        return optionSlugs.every((opt) => values.some((v) => v.filter_type === filterSlug && v.option === opt));
      });
    });

    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        products.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
        break;
    }

    return products;
  }, [allProducts, priceRange, selectedSizes, selectedFilters, sortBy]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const toggleFilterOption = (filterSlug: string, optionSlug: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterSlug] || [];
      const next = current.includes(optionSlug)
        ? current.filter((o) => o !== optionSlug)
        : [...current, optionSlug];
      return { ...prev, [filterSlug]: next };
    });
  };

  const isFilterSelected = (filterSlug: string, optionSlug: string) =>
    (selectedFilters[filterSlug] || []).includes(optionSlug);

  const clearFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSelectedSizes([]);
    setSelectedFilters({});
  };

  const hasData = Boolean(category) || allProducts.length > 0;

  if (!hasData && !isLoading && loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-3xl font-bold">Category Not Found</h1>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  if (!hasData && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center text-muted-foreground">Loading category...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Compact heading */}
      <section className="border-b border-border/50 bg-card/60">
        <div className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-10">
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/category/${category?.slug}`} className="hover:text-primary">
              {category?.name}
            </Link>
            {selectedSubcategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{selectedSubcategory.name}</span>
              </>
            )}
          </nav>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 lg:px-12 py-12">
        <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block sticky top-24 h-fit self-start">
            <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-border/60 p-6 space-y-8">
              <FilterContent
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                priceBounds={priceBounds}
                allSizes={allSizes}
                selectedSizes={selectedSizes}
                toggleSize={toggleSize}
                availableFilters={availableFilters}
                isFilterSelected={isFilterSelected}
                toggleFilterOption={toggleFilterOption}
                isLoading={isFiltersLoading}
                clearFilters={clearFilters}
                showSizeFilter={showSizeFilter}
              />
            </div>
          </aside>

          <div className="space-y-10">
            <div className="space-y-3 text-left lg:max-w-none">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-3xl font-bold md:text-4xl text-foreground"
              >
                {heroName}
              </motion.h1>
              {heroDescription && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-base leading-7 text-muted-foreground"
                >
                  {heroDescription}
                </motion.p>
              )}
              {showBedSizeFilter && linkedBedSize && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg bg-primary/8 border border-primary/30 px-4 py-2 inline-block"
                >
                  <p className="text-sm font-medium text-primary">
                    Showing {linkedBedSize} size mattresses
                    <Link
                      to={`/category/${slug}`}
                      className="ml-2 underline underline-offset-2 hover:no-underline"
                    >
                      View all â†’
                    </Link>
                  </p>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4">
              <p className="text-muted-foreground">
                Showing {filteredProducts.length} of {allProducts.length} products
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="gap-2 border-accent lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-accent">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-espresso/50 backdrop-blur-sm lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-full w-80 overflow-y-auto bg-background p-6"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-serif text-xl font-semibold">Filters</h3>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FilterContent
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    priceBounds={priceBounds}
                    allSizes={allSizes}
                    selectedSizes={selectedSizes}
                    toggleSize={toggleSize}
                    availableFilters={availableFilters}
                    isFilterSelected={isFilterSelected}
                    toggleFilterOption={toggleFilterOption}
                    isLoading={isFiltersLoading}
                    clearFilters={clearFilters}
                    showSizeFilter={showSizeFilter}
                  />
                </motion.div>
              </motion.div>
            )}

            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-card">
                  <div className="text-center">
                    <p className="mb-4 text-lg text-muted-foreground">No products match your filters</p>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      fromBedProduct={linkedBedProduct}
                      selectedBedSize={linkedBedSize}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface FilterContentProps {
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  priceBounds: { min: number; max: number };
  allSizes: string[];
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  availableFilters: FilterType[];
  isFilterSelected: (filterSlug: string, optionSlug: string) => boolean;
  toggleFilterOption: (filterSlug: string, optionSlug: string) => void;
  isLoading: boolean;
  clearFilters: () => void;
  showSizeFilter: boolean;
}

const FilterContent = ({
  priceRange,
  setPriceRange,
  priceBounds,
  allSizes,
  selectedSizes,
  toggleSize,
  availableFilters,
  isFilterSelected,
  toggleFilterOption,
  isLoading,
  clearFilters,
  showSizeFilter,
}: FilterContentProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="mb-4 font-serif text-lg font-semibold">Price Range</h4>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={50}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm">
          <span>£{priceRange[0]}</span>
          <span>£{priceRange[1]}</span>
        </div>
      </div>

      {showSizeFilter && (isLoading || allSizes.length > 0) && (
        <div>
          <h4 className="mb-4 font-serif text-lg font-semibold">Size</h4>
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((skeleton) => (
                <div key={skeleton} className="h-4 w-24 animate-pulse rounded bg-muted/60" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {allSizes.map((size) => (
                <div key={size} className="flex items-center gap-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={selectedSizes.includes(size)}
                    onCheckedChange={() => toggleSize(size)}
                  />
                  <Label htmlFor={`size-${size}`} className="cursor-pointer text-sm">
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {availableFilters.length > 0 && (
        <div className="space-y-6">
          {availableFilters.map((filter) => (
            <div key={filter.id}>
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg font-semibold">{filter.name}</h4>
                {filter.display_hint && (
                  <span className="text-xs text-muted-foreground">{filter.display_hint}</span>
                )}
              </div>
              <div className="mt-3 space-y-3">
                {filter.options
                  .filter((opt) => opt.name)
                  .map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isFilterSelected(filter.slug, opt.slug)}
                        onCheckedChange={() => toggleFilterOption(filter.slug, opt.slug)}
                      />
                      <span className="flex items-center gap-2">
                        {opt.color_code && (
                          <span
                            className="h-3 w-3 rounded-full border border-border"
                            style={{ backgroundColor: opt.color_code }}
                          />
                        )}
                        {opt.name}
                        {typeof opt.product_count === 'number' && opt.product_count > 0 && (
                          <span className="text-xs text-muted-foreground">({opt.product_count})</span>
                        )}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={clearFilters} className="w-full border-accent">
        Clear All Filters
      </Button>
    </div>
  );
};

export default CategoryPage;
