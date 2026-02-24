import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Filter Options Data
const filterOptions = {
  bedSize: [
    { id: 'small-single', label: 'Small Single', count: 6 },
    { id: 'single', label: 'Single', count: 6 },
    { id: 'small-double', label: 'Small Double', count: 6 },
    { id: 'double', label: 'Double', count: 6 },
    { id: 'king', label: 'King', count: 6 },
    { id: 'super-king', label: 'Super King', count: 6 },
  ],
  colour: [
    { id: 'all', label: 'All Colours', color: '#FF6B6B' },
    { id: 'beige', label: 'Beige', color: '#F5DEB3' },
    { id: 'black', label: 'Black', color: '#000000' },
    { id: 'blue', label: 'Blue', color: '#2563EB' },
    { id: 'brown', label: 'Brown', color: '#8B4513' },
    { id: 'gold', label: 'Gold', color: '#FFD700' },
    { id: 'gray', label: 'Gray', color: '#808080' },
    { id: 'pink', label: 'Pink', color: '#FFC0CB' },
    { id: 'silver', label: 'Silver', color: '#C0C0C0' },
    { id: 'white', label: 'White', color: '#FFFFFF' },
  ],
  divanDesign: [
    { id: 'plain', label: 'Plain (No Design)', count: 6 },
    { id: 'designer-headboard', label: 'Designer Headboard', count: 6 },
    { id: 'designer-headboard-footboard', label: 'Designer Headboard & Footboard', count: 4 },
  ],
  fabricMaterial: [
    { id: 'all-fabric', label: 'All Fabric Choices', count: 6 },
    { id: 'plush-velvet', label: 'Plush Velvet', count: 6 },
    { id: 'crushed-velvet', label: 'Crushed Velvet', count: 4 },
    { id: 'chenille', label: 'Chenille', count: 3 },
    { id: 'linen', label: 'Linen', count: 2 },
    { id: 'faux-leather', label: 'Faux Leather', count: 2 },
    { id: 'suede', label: 'Suede', count: 2 },
  ],
  storageOptions: [
    { id: 'no-storage', label: 'No Storage', count: 6 },
    { id: '2-drawers', label: '2 x Drawers (optional)', count: 6 },
    { id: '4-drawers', label: '4 x Drawers (optional)', count: 6 },
    { id: '4-drawers-continental', label: '4 x Drawers Continental (optional)', count: 6 },
    { id: 'ottoman', label: 'Ottoman Lift Storage (optional)', count: 6 },
  ],
  bedFeatures: [
    { id: 'headboard-included', label: 'Headboard Included', count: 1 },
    { id: 'mattress-options', label: 'Mattress Options', count: 6 },
    { id: 'storage-options', label: 'Storage Options', count: 6 },
    { id: 'drawer-storage', label: 'Drawer Storage Options', count: 6 },
    { id: 'ottoman-storage', label: 'Ottoman Storage Options', count: 6 },
  ],
  tuftingStyle: [
    { id: 'fabric-buttons', label: 'Matching Fabric Buttons', count: 1 },
    { id: 'crystal-buttons', label: 'Crystal Diamond Buttons', count: 1 },
  ],
};

// Divan Beds Products
const divanBeds = [
  {
    id: 1,
    name: 'Épure Plush Velvet Divan Bed with Mattress',
    slug: 'epure-plush-velvet-divan',
    shortDescription: 'Optional Headboard & Storage',
    price: 289,
    originalPrice: 549,
    rating: 4.8,
    reviewCount: 124,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop',
    isSale: true,
    isNew: false,
    features: ['Plush Velvet', 'Optional Headboard', 'Optional Storage', 'Mattress Included'],
  },
  {
    id: 2,
    name: 'Linea Plush Velvet Divan Bed with Mattress',
    slug: 'linea-plush-velvet-divan',
    shortDescription: 'Optional headboard and storage available',
    price: 299,
    originalPrice: 579,
    rating: 4.9,
    reviewCount: 98,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
    isSale: true,
    isNew: false,
    features: ['Plush Velvet', 'Optional Headboard', 'Optional Storage', 'Mattress Included'],
  },
  {
    id: 3,
    name: 'Rete Plush Velvet Divan Bed with Mattress',
    slug: 'rete-plush-velvet-divan',
    shortDescription: 'Optional headboard and storage',
    price: 319,
    originalPrice: 599,
    rating: 4.7,
    reviewCount: 87,
    image: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=400&fit=crop',
    isSale: true,
    isNew: true,
    features: ['Plush Velvet', 'Optional Headboard', 'Optional Storage', 'Mattress Included'],
  },
  {
    id: 4,
    name: 'Royale Chesterfield Plush Velvet Divan Bed with Mattress',
    slug: 'royale-chesterfield-plush-velvet-divan',
    shortDescription: 'Optional headboard and storage • Tufting Style Available',
    price: 399,
    originalPrice: 749,
    rating: 5.0,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&h=400&fit=crop',
    isSale: true,
    isNew: false,
    features: ['Plush Velvet', 'Chesterfield Design', 'Fabric or Crystal Buttons', 'Optional Storage', 'Mattress Included'],
    hasTuftingOptions: true,
  },
  {
    id: 5,
    name: 'Aurore Plush Velvet Divan Bed with Mattress',
    slug: 'aurore-plush-velvet-divan',
    shortDescription: 'Optional headboard and storage',
    price: 349,
    originalPrice: 649,
    rating: 4.8,
    reviewCount: 112,
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
    isSale: true,
    isNew: false,
    features: ['Plush Velvet', 'Optional Headboard', 'Optional Storage', 'Mattress Included'],
  },
  {
    id: 6,
    name: 'Linea Forte Plush Velvet Divan Bed with Mattress',
    slug: 'linea-forte-plush-velvet-divan',
    shortDescription: 'Wingback Headboard • 2 Drawer Foot End Storage',
    price: 449,
    originalPrice: 849,
    rating: 4.9,
    reviewCount: 78,
    image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&h=400&fit=crop',
    isSale: true,
    isNew: true,
    features: ['Plush Velvet', 'Wingback Headboard', 'Floorstanding Only', '2 Drawer Foot End', 'Mattress Included'],
    isWingback: true,
  },
];

// Filter Section Component
const FilterSection = ({ 
  title, 
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) => (
  <div className="border-b border-border py-4">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left font-semibold text-foreground"
    >
      {title}
      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {isOpen && <div className="mt-3 space-y-2">{children}</div>}
  </div>
);

// Product Card Component
const ProductCard = ({ product }: { product: typeof divanBeds[0] }) => {
  const savings = product.originalPrice - product.price;
  const savingsPercent = Math.round((savings / product.originalPrice) * 100);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isSale && (
            <Badge className="bg-red-500 text-white">
              SALE
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              New
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="mb-1 font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>

        {/* Short Description */}
        <p className="mb-3 text-sm text-muted-foreground line-clamp-1">
          {product.shortDescription}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">
            £{product.price}<sup className="text-sm">00</sup>
          </span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                £{product.originalPrice}<sup>00</sup>
              </span>
              <span className="text-sm font-medium text-red-500">
                Save {savingsPercent}%
              </span>
            </>
          )}
        </div>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? 'fill-primary text-primary'
                  : 'text-muted'
              }`}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>
      </div>
    </Link>
  );
};

const DivanBedsPage = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    bedSize: true,
    colour: true,
    divanDesign: true,
    fabricMaterial: true,
    storageOptions: true,
    bedFeatures: false,
    tuftingStyle: false,
  });

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    bedSize: [],
    colour: [],
    divanDesign: [],
    fabricMaterial: [],
    storageOptions: [],
    bedFeatures: [],
    tuftingStyle: [],
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (category: string, filterId: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category] || [];
      if (current.includes(filterId)) {
        return { ...prev, [category]: current.filter((id) => id !== filterId) };
      }
      return { ...prev, [category]: [...current, filterId] };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      bedSize: [],
      colour: [],
      divanDesign: [],
      fabricMaterial: [],
      storageOptions: [],
      bedFeatures: [],
      tuftingStyle: [],
    });
  };

  const totalSelectedFilters = Object.values(selectedFilters).flat().length;

  const FilterSidebar = () => (
    <div className="space-y-0">
      {/* Bed Size */}
      <FilterSection
        title="Bed Size"
        isOpen={openSections.bedSize}
        onToggle={() => toggleSection('bedSize')}
      >
        {filterOptions.bedSize.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.bedSize.includes(option.id)}
              onCheckedChange={() => toggleFilter('bedSize', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>

      {/* Colour */}
      <FilterSection
        title="Colour"
        isOpen={openSections.colour}
        onToggle={() => toggleSection('colour')}
      >
        {filterOptions.colour.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.colour.includes(option.id)}
              onCheckedChange={() => toggleFilter('colour', option.id)}
            />
            <span
              className="h-5 w-5 rounded-full border border-border"
              style={{ backgroundColor: option.color }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </FilterSection>

      {/* Divan Design */}
      <FilterSection
        title="Divan Design"
        isOpen={openSections.divanDesign}
        onToggle={() => toggleSection('divanDesign')}
      >
        {filterOptions.divanDesign.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.divanDesign.includes(option.id)}
              onCheckedChange={() => toggleFilter('divanDesign', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>

      {/* Fabric/Material Type */}
      <FilterSection
        title="Fabric/Material Type"
        isOpen={openSections.fabricMaterial}
        onToggle={() => toggleSection('fabricMaterial')}
      >
        {filterOptions.fabricMaterial.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.fabricMaterial.includes(option.id)}
              onCheckedChange={() => toggleFilter('fabricMaterial', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>

      {/* Storage Options */}
      <FilterSection
        title="Storage Options"
        isOpen={openSections.storageOptions}
        onToggle={() => toggleSection('storageOptions')}
      >
        {filterOptions.storageOptions.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.storageOptions.includes(option.id)}
              onCheckedChange={() => toggleFilter('storageOptions', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>

      {/* Bed Features */}
      <FilterSection
        title="Bed Features"
        isOpen={openSections.bedFeatures}
        onToggle={() => toggleSection('bedFeatures')}
      >
        {filterOptions.bedFeatures.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.bedFeatures.includes(option.id)}
              onCheckedChange={() => toggleFilter('bedFeatures', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>

      {/* Tufting Style (for Chesterfield) */}
      <FilterSection
        title="Tufting Style"
        isOpen={openSections.tuftingStyle}
        onToggle={() => toggleSection('tuftingStyle')}
      >
        {filterOptions.tuftingStyle.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              checked={selectedFilters.tuftingStyle.includes(option.id)}
              onCheckedChange={() => toggleFilter('tuftingStyle', option.id)}
            />
            <span>{option.label}</span>
            <span className="ml-auto text-xs">({option.count})</span>
          </label>
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
<Header />

      <main className="pb-16">
        {/* Hero Banner */}
        <div className="relative h-[200px] overflow-hidden bg-gradient-to-r from-espresso to-espresso/80 md:h-[250px]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1920&h=400&fit=crop')] bg-cover bg-center opacity-30" />
          <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
            <h1 className="font-serif text-4xl font-bold text-cream md:text-5xl">
              Divan Beds
            </h1>
            <p className="mt-3 max-w-2xl text-cream/80">
              Discover our handcrafted collection of luxury divan beds with optional storage and headboard options
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-cream/70">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link to="/categories" className="hover:text-primary">Categories</Link>
              <span>/</span>
              <span className="text-cream">Divan Beds</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Mobile Filter Button */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Button
              variant="outline"
              onClick={() => setMobileFiltersOpen(true)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {totalSelectedFilters > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground">
                  {totalSelectedFilters}
                </Badge>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              {divanBeds.length} products
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-24">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                  {totalSelectedFilters > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <FilterSidebar />
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="mb-6 hidden items-center justify-between lg:flex">
                <p className="text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{divanBeds.length}</span> products
                </p>
                <select className="rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                  <option>Best Sellers</option>
                </select>
              </div>

              {/* Products */}
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {divanBeds.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col bg-background sm:left-auto sm:w-80">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full p-2 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterSidebar />
              </div>
              <div className="border-t border-border p-4">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </Button>
                  <Button
                    className="flex-1 gradient-bronze"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DivanBedsPage;

