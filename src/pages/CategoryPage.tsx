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

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const subSlug = searchParams.get('sub') || '';
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<FilterType[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const showSizeFilter = category?.slug === 'beds';
  // Track which filter option slugs actually exist on products currently in view (after category/subcategory selection)
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
      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setAvailableFilters([]);
        setIsLoading(false);
        return;
      }
      try {
        // Attempt primary slug, then common aliases (e.g., mattress ↔ mattresses), then name match fallback.
        const tryFetchBySlug = async (slugCandidate: string) =>
          apiGet<Category[]>(`/categories/?slug=${slugCandidate}`).catch(() => []);

        const aliasSlug =
          slug === 'mattress' ? 'mattresses' : slug === 'mattresses' ? 'mattress' : '';

        let categoryRes = await tryFetchBySlug(slug);
        if ((!categoryRes || categoryRes.length === 0) && aliasSlug) {
          categoryRes = await tryFetchBySlug(aliasSlug);
        }

        let categoryItem = categoryRes?.[0] || null;

        // Final fallback: search all categories by name match when slug lookup fails.
        if (!categoryItem) {
          const allCategories = await apiGet<Category[]>('/categories/').catch(() => []);
          categoryItem =
            allCategories.find(
              (c) => c.name?.trim().toLowerCase() === slug.replace(/-/g, ' ').toLowerCase()
            ) || null;
        }

        const resolvedSlug = categoryItem?.slug || slug;

        setCategory(categoryItem);
        if (categoryItem) {
          const subcategoryRes = await apiGet<SubCategory[]>(`/subcategories/?category=${categoryItem.id}`);
          setSubcategories(subcategoryRes);
        } else {
          setSubcategories([]);
        }
        const productsRes = subSlug
          ? await apiGet<Product[]>(`/products/?subcategory=${subSlug}`)
          : await apiGet<Product[]>(`/products/?category=${resolvedSlug}`);
        const normalizedProducts = Array.isArray(productsRes)
          ? productsRes
          : Array.isArray((productsRes as unknown as { results?: Product[] })?.results)
          ? (productsRes as unknown as { results: Product[] }).results
          : [];
        const orderedProducts = [...normalizedProducts].sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
          const bOrder = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.id || 0) - (a.id || 0);
        });
        setAllProducts(orderedProducts);

        // Fetch filter definitions for this category/subcategory
        try {
          const filtersRes = await apiGet<{ filters: FilterType[] }>(
            `/categories/${resolvedSlug}/filters/${subSlug ? `?subcategory=${subSlug}` : ''}`
          );
          setAvailableFilters(Array.isArray(filtersRes?.filters) ? filtersRes.filters : []);
        } catch {
          setAvailableFilters([]);
        }
        setIsLoading(false);
      } catch {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setAvailableFilters([]);
        setIsLoading(false);
      }
    };
    load();
  }, [slug, subSlug]);

  // Drop selections that no longer exist when filter definitions change
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
        const selected = (prev[f.slug] || []).filter((slug) => options.has(slug));
        if (selected.length) next[f.slug] = selected;
      });
      return next;
    });
  }, [availableFilters]);

  const selectedSubcategory = useMemo(() => {
    if (!subSlug) {
      return null;
    }
    return (
      subcategories.find((sub) => sub.slug === subSlug) ||
      category?.subcategories?.find((sub) => sub.slug === subSlug) ||
      null
    );
  }, [category, subSlug, subcategories]);

  const heroName = selectedSubcategory?.name || category?.name || '';
  const heroDescription = selectedSubcategory?.description || category?.description || '';
  const fallbackProductImage = allProducts[0]?.images?.[0]?.url || '';
  const heroImage = resolveImageUrl(
    selectedSubcategory?.image || category?.image || fallbackProductImage || ''
  );
  const heroBackgroundImage = toBackgroundImageValue(heroImage);

  const priceBounds = useMemo(() => {
    const prices = allProducts
      .map((p) => Number(p.price))
      .filter((value) => !Number.isNaN(value));
    if (prices.length === 0) {
      return { min: 0, max: 1500 };
    }
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
    const sizeSet = new Set<string>();
    allProducts.forEach((p) =>
      (p.sizes || []).forEach((s) => {
        const value = s.name.trim();
        if (value) sizeSet.add(value);
      })
    );
    return Array.from(sizeSet).sort((a, b) => a.localeCompare(b));
  }, [allProducts, showSizeFilter]);

  // Clear size selections when size filter not applicable
  useEffect(() => {
    if (!showSizeFilter && selectedSizes.length > 0) {
      setSelectedSizes([]);
    }
  }, [showSizeFilter, selectedSizes.length]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Price filter
    products = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Size filter
    if (showSizeFilter && selectedSizes.length > 0) {
      products = products.filter((p) =>
        (p.sizes || []).some((size) => selectedSizes.includes(size.name))
      );
    }

    // Dynamic filters (category/subcategory specific)
    Object.entries(selectedFilters).forEach(([filterSlug, optionSlugs]) => {
      if (!optionSlugs.length) return;
      products = products.filter((p) => {
        const values = p.filter_values || [];
        return optionSlugs.every((opt) =>
          values.some((v) => v.filter_type === filterSlug && v.option === opt)
        );
      });
    });

    // Sort
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
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
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

  if (!category && !isLoading) {
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
  if (!category && isLoading) {
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

      {/* Compact heading instead of full hero */}
      <section className="border-b border-border/50 bg-card/60">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/category/${category.slug}`} className="hover:text-primary">
              {category.name}
            </Link>
            {selectedSubcategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{selectedSubcategory.name}</span>
              </>
            )}
          </nav>
          <div className="space-y-3 text-left max-w-4xl md:max-w-5xl lg:max-w-6xl">
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
          </div>
        </div>

      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} of {allProducts.length} products
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="gap-2 border-accent md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            {/* Sort */}
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

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop & Tablet */}
          <aside className="hidden w-64 flex-shrink-0 md:block">
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
              isLoading={isLoading}
              clearFilters={clearFilters}
              showSizeFilter={showSizeFilter}
            />
          </aside>

          {/* Mobile Filters */}
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
                  isLoading={isLoading}
                  clearFilters={clearFilters}
                  showSizeFilter={showSizeFilter}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-card">
                <div className="text-center">
                  <p className="mb-4 text-lg text-muted-foreground">
                    No products match your filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Filter Content Component
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
      {/* Price Range */}
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

      {/* Sizes (Beds only) */}
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

      {/* Category/Subcategory Filters */}
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

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full border-accent"
      >
        Clear All Filters
      </Button>
    </div>
  );
};

export default CategoryPage;

