import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Minus, Plus, Star, Truck, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { apiGet } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

// Helper function to determine if a hex color is light
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

type NormalizedStyleOption = {
  label: string;
  description?: string;
};

const normalizeStyleOptions = (options: unknown): NormalizedStyleOption[] => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === 'string') {
        const label = option.trim();
        return label ? { label } : null;
      }
      if (option && typeof option === 'object') {
        const rawLabel = (option as { label?: unknown; name?: unknown }).label ?? (option as { name?: unknown }).name;
        const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
        if (!label) return null;
        const rawDescription = (option as { description?: unknown }).description;
        const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
        return { label, description };
      }
      return null;
    })
    .filter((option): option is NormalizedStyleOption => Boolean(option));
};

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const { addItem } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<Record<string, string>>({});
  const [selectedFabric, setSelectedFabric] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (!slug) {
        setProduct(null);
        setIsLoading(false);
        return;
      }
      try {
        const productRes = await apiGet<Product[]>(`/products/?slug=${slug}`);
        const fetched = productRes[0] || null;
        setProduct(fetched);
        if (fetched?.category_slug) {
          const categoryRes = await apiGet<Category[]>(`/categories/?slug=${fetched.category_slug}`);
          setCategory(categoryRes[0] || null);
          const relatedRes = await apiGet<Product[]>(`/products/?category=${fetched.category_slug}`);
          setRelatedProducts(relatedRes.filter((p) => p.id !== fetched.id).slice(0, 4));
        } else {
          setCategory(null);
          setRelatedProducts([]);
        }
        if (fetched?.sizes?.length) {
          setSelectedSize(fetched.sizes[0].name);
        }
        if (fetched?.colors?.length) {
          setSelectedColor(fetched.colors[0].name);
        }
        const initialStyles: Record<string, string> = {};
        (fetched?.styles || []).forEach((styleGroup) => {
          const firstOption = normalizeStyleOptions(styleGroup.options)[0];
          if (firstOption) {
            initialStyles[styleGroup.name] = firstOption.label;
          }
        });
        setSelectedStyles(initialStyles);
        if (fetched?.fabrics?.length) {
          setSelectedFabric(fetched.fabrics[0].name);
        } else {
          setSelectedFabric('');
        }
        setIsLoading(false);
      } catch {
        setProduct(null);
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (!product && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-3xl font-bold">Product Not Found</h1>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  if (!product && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Header />
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center text-muted-foreground">Loading product...</div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      product,
      quantity,
      size: selectedSize,
      color: selectedColor,
      selectedVariants: selectedStyles,
      fabric: selectedFabric || undefined,
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          {category && (
            <>
              <Link to={`/category/${category.slug}`} className="hover:text-primary">
                {category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <motion.div
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-card"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage]?.url}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.is_bestseller && (
                  <Badge className="bg-primary text-primary-foreground">Bestseller</Badge>
                )}
                {product.is_new && (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">New</Badge>
                )}
                {product.original_price && product.original_price > product.price && (
                  <Badge variant="destructive">Save £{product.original_price - product.price}</Badge>
                )}
              </div>
            </motion.div>

            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square w-20 overflow-hidden rounded-md transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.review_count} reviews)
              </span>
            </div>

            <div>
              <h1 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-primary">£{product.price}</span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      £{product.original_price}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      Save £{product.original_price - product.price} ({Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off)
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <div>
              <h3 className="mb-3 font-medium">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.name)}
                    className={`rounded-md border px-4 py-2 text-sm transition-all ${
                      selectedSize === size.name
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-medium">Colour: <span className="text-primary">{selectedColor}</span></h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.name)}
                    className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      selectedColor === color.name
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2'
                    }`}
                    title={color.name}
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: color.hex_code || '#888888' }}
                    />
                    {selectedColor === color.name && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg 
                          className="h-4 w-4 drop-shadow-md" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={color.hex_code && isLightColor(color.hex_code) ? '#000000' : '#FFFFFF'}
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

            {product.styles && product.styles.length > 0 && (
              <div className="space-y-6">
                {product.styles.map((styleGroup) => {
                  const options = normalizeStyleOptions(styleGroup.options);
                  if (options.length === 0) return null;
                  return (
                    <div key={styleGroup.id}>
                      <h3 className="mb-3 font-medium">{styleGroup.name}</h3>
                      <div className="space-y-2">
                        {options.map((styleOption) => (
                          <button
                            key={`${styleGroup.id}-${styleOption.label}`}
                            onClick={() =>
                              setSelectedStyles((prev) => ({ ...prev, [styleGroup.name]: styleOption.label }))
                            }
                            className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-all ${
                              selectedStyles[styleGroup.name] === styleOption.label
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            <span className="block font-medium">{styleOption.label}</span>
                            {styleOption.description && (
                              <span className="mt-1 block text-xs opacity-90">{styleOption.description}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {product.fabrics && product.fabrics.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">Fabric: <span className="text-primary">{selectedFabric}</span></h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.fabrics.map((fabric) => (
                    <button
                      key={fabric.id}
                      onClick={() => setSelectedFabric(fabric.name)}
                      className={`rounded-xl border p-2 text-left transition-all ${
                        selectedFabric === fabric.name
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/60'
                      }`}
                    >
                      <img
                        src={fabric.image_url}
                        alt={fabric.name}
                        className="mb-2 h-24 w-full rounded-md object-cover"
                      />
                      <span className="line-clamp-2 text-xs font-medium">{fabric.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex items-center rounded-md border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 gradient-bronze text-lg font-semibold"
              >
                Add to Cart - £{(product.price * quantity).toFixed(2)}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-lg bg-card p-4">
              <div className="flex flex-col items-center text-center">
                <Truck className="mb-2 h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">Free UK Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="mb-2 h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">10-Year Guarantee</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <CreditCard className="mb-2 h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">Pay in 3</span>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features">
                <AccordionTrigger>Features</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-4">
                    {(product.features || []).map((feature, i) => (
                      <li key={i} className="text-muted-foreground">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delivery">
                <AccordionTrigger>Delivery Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-muted-foreground">
                    {product.delivery_info ? (
                      <p>{product.delivery_info}</p>
                    ) : (
                      <>
                        <p>• Free delivery on orders over £500</p>
                        <p>• Standard delivery: 3-5 working days</p>
                        <p>• Premium delivery with room of choice: Available</p>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger>Returns & Guarantee</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-muted-foreground">
                    {product.returns_guarantee ? (
                      <p>{product.returns_guarantee}</p>
                    ) : (
                      <>
                        <p>• 10-year structural guarantee</p>
                        <p>• 30-day comfort exchange on mattresses</p>
                        <p>• Free returns within 14 days</p>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              {product.faqs && product.faqs.length > 0 && (
                <AccordionItem value="faqs">
                  <AccordionTrigger>FAQs</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {product.faqs.map((faq, i) => (
                        <div key={`${faq.question}-${i}`}>
                          <p className="font-medium text-foreground">{faq.question}</p>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 font-serif text-2xl font-bold">You May Also Like</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
