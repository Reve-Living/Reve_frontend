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
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { apiGet } from '@/lib/api';
import { Category, Product, SubCategory } from '@/lib/types';

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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setIsLoading(false);
        return;
      }
      try {
        const categoryRes = await apiGet<Category[]>(`/categories/?slug=${slug}`);
        const categoryItem = categoryRes[0] || null;
        setCategory(categoryItem);
        if (categoryItem) {
          const subcategoryRes = await apiGet<SubCategory[]>(`/subcategories/?category=${categoryItem.id}`);
          setSubcategories(subcategoryRes);
        } else {
          setSubcategories([]);
        }
        const productsRes = subSlug
          ? await apiGet<Product[]>(`/products/?subcategory=${subSlug}`)
          : await apiGet<Product[]>(`/products/?category=${slug}`);
        const normalizedProducts = Array.isArray(productsRes)
          ? productsRes
          : Array.isArray((productsRes as unknown as { results?: Product[] })?.results)
          ? (productsRes as unknown as { results: Product[] }).results
          : [];
        setAllProducts(normalizedProducts);
        setIsLoading(false);
      } catch {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setIsLoading(false);
      }
    };
    load();
  }, [slug, subSlug]);

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
    const sizeSet = new Set<string>();
    allProducts.forEach((p) =>
      (p.sizes || []).forEach((s) => {
        const value = s.name.trim();
        if (value) sizeSet.add(value);
      })
    );
    return Array.from(sizeSet).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Price filter
    products = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Size filter
    if (selectedSizes.length > 0) {
      products = products.filter((p) =>
        (p.sizes || []).some((size) => selectedSizes.includes(size.name))
      );
    }

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
  }, [allProducts, priceRange, selectedSizes, sortBy]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSelectedSizes([]);
  };

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
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
        <AnnouncementBar />
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
      <AnnouncementBar />
      <Header />

      {/* Hero Banner */}
      <section className="relative h-64 overflow-hidden md:h-80">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: heroBackgroundImage }}
        >
          <div className="absolute inset-0 bg-espresso/60" />
        </div>
        <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-cream/80">
            <Link to="/" className="hover:text-cream">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/category/${category.slug}`} className="hover:text-cream">
              {category.name}
            </Link>
            {selectedSubcategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-cream">{selectedSubcategory.name}</span>
              </>
            )}
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-serif text-4xl font-bold text-cream md:text-5xl"
          >
            {heroName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl text-cream/90"
          >
            {heroDescription}
          </motion.p>
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
              isLoading={isLoading}
              clearFilters={clearFilters}
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
                  isLoading={isLoading}
                  clearFilters={clearFilters}
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
  isLoading: boolean;
  clearFilters: () => void;
}

const FilterContent = ({
  priceRange,
  setPriceRange,
  priceBounds,
  allSizes,
  selectedSizes,
  toggleSize,
  isLoading,
  clearFilters,
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

      {/* Sizes */}
      <div>
        <h4 className="mb-4 font-serif text-lg font-semibold">Size</h4>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((skeleton) => (
              <div key={skeleton} className="h-4 w-24 animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        ) : allSizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No size options available for this category.</p>
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
