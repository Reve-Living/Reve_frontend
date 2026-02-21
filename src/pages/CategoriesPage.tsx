import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Product, ProductStyleOption } from '@/lib/types';

// Helper function to determine if a hex color is light
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

const CategoriesPage = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const productsRes = await apiGet<Product[]>('/products/');
        const orderedProducts = Array.isArray(productsRes)
          ? [...productsRes].sort((a, b) => {
              const aOrder = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
              const bOrder = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return (b.id || 0) - (a.id || 0);
            })
          : [];
        setAllProducts(orderedProducts);
        setIsLoading(false);
      } catch {
        setAllProducts([]);
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  // Helper to normalize filter values (consistent title case)
  const normalizeValue = (value: string) => {
    return value.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  // Get all style options grouped by style name
  const allStyleOptions = useMemo(() => {
    const styleMap = new Map<string, Set<string>>();
    allProducts.forEach((p) => 
      p.styles.forEach((style) => {
        const styleName = style.name;
        if (!styleMap.has(styleName)) {
          styleMap.set(styleName, new Set<string>());
        }
        // Handle both array of objects and array of strings
        if (Array.isArray(style.options)) {
          style.options.forEach((opt) => {
            const optionLabel = typeof opt === 'string' ? opt : opt.label;
            styleMap.get(styleName)!.add(optionLabel);
          });
        }
      })
    );
    // Convert to array format
    const result: { styleName: string; options: string[] }[] = [];
    styleMap.forEach((options, styleName) => {
      result.push({
        styleName,
        options: Array.from(options).sort(),
      });
    });
    return result;
  }, [allProducts]);

  const allColors = useMemo(() => {
    const colorMap = new Map<string, { name: string; hex_code: string }>();
    allProducts.forEach((p) => 
      p.colors.forEach((c) => {
        const normalizedName = normalizeValue(c.name);
        if (!colorMap.has(normalizedName)) {
          colorMap.set(normalizedName, { name: normalizedName, hex_code: c.hex_code || '#888888' });
        }
      })
    );
    return Array.from(colorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Price filter
    products = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Style options filter
    if (selectedOptions.length > 0) {
      products = products.filter((p) =>
        p.styles.some((style) =>
          Array.isArray(style.options) &&
          style.options.some((opt) => {
            const optionLabel = typeof opt === 'string' ? opt : opt.label;
            return selectedOptions.includes(optionLabel);
          })
        )
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      products = products.filter((p) =>
        p.colors.some((c) => selectedColors.includes(normalizeValue(c.name)))
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
  }, [allProducts, priceRange, selectedOptions, selectedColors, sortBy]);

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSelectedOptions([]);
    setSelectedColors([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center text-muted-foreground">Loading products...</div>
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
      <section className="relative bg-card py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
            >
              Browse All
            </motion.span>
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              All Products
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Discover our complete range of handcrafted furniture, designed for comfort and built to last
            </p>
          </motion.div>
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
              allStyleOptions={allStyleOptions}
              selectedOptions={selectedOptions}
              toggleOption={toggleOption}
              allColors={allColors}
              selectedColors={selectedColors}
              toggleColor={toggleColor}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-espresso/50 backdrop-blur-sm md:hidden"
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
                  allStyleOptions={allStyleOptions}
                  selectedOptions={selectedOptions}
                  toggleOption={toggleOption}
                  allColors={allColors}
                  selectedColors={selectedColors}
                  toggleColor={toggleColor}
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
  allStyleOptions: { styleName: string; options: string[] }[];
  selectedOptions: string[];
  toggleOption: (option: string) => void;
  allColors: { name: string; hex_code: string }[];
  selectedColors: string[];
  toggleColor: (color: string) => void;
  clearFilters: () => void;
}

const FilterContent = ({
  priceRange,
  setPriceRange,
  priceBounds,
  allStyleOptions,
  selectedOptions,
  toggleOption,
  allColors,
  selectedColors,
  toggleColor,
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

      {/* Style Options */}
      {allStyleOptions.map((styleGroup) => (
        <div key={styleGroup.styleName}>
          <h4 className="mb-4 font-serif text-lg font-semibold">{styleGroup.styleName}</h4>
          <div className="space-y-3">
            {styleGroup.options.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`option-${option}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={() => toggleOption(option)}
                />
                <Label htmlFor={`option-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Colors */}
      <div>
        <h4 className="mb-4 font-serif text-lg font-semibold">Colour</h4>
        <div className="flex flex-wrap gap-2">
          {allColors.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                selectedColors.includes(color.name)
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:ring-2 hover:ring-muted-foreground hover:ring-offset-1'
              }`}
              title={color.name}
            >
              <span
                className="h-7 w-7 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: color.hex_code }}
              />
              {selectedColors.includes(color.name) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className="h-3 w-3 drop-shadow-md" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={isLightColor(color.hex_code) ? '#000000' : '#FFFFFF'}
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
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

export default CategoriesPage;
