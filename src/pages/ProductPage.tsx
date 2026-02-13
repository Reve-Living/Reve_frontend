import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  CreditCard,
  Ruler,
  BedDouble,
  CheckCircle2,
} from 'lucide-react';
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
import { Category, Product, ProductDimensionRow } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

type NormalizedStyleOption = {
  label: string;
  description?: string;
  icon_url?: string;
  size?: string;
};

type VariantOption = {
  key: string;
  label: string;
  description?: string;
  icon_url?: string;
  color_code?: string;
  price_delta?: number;
};

type VariantGroup = {
  key: string;
  name: string;
  icon_url?: string;
  kind: 'color' | 'size' | 'style';
  styleName?: string;
  options: VariantOption[];
};

type ParsedSizeOption = {
  id: string;
  label: string;
  delta: number;
  description: string;
  raw: string;
};

const gbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

const DIMENSION_SIZE_COLUMNS = ['3ft Single', '4ft Small Double', '4ft6 Double', '5ft King', '6ft Super King'];

const formatPrice = (value: number): string => gbpFormatter.format(Math.max(0, value));

const adjustDimensionsForWingback = (
  rows: ProductDimensionRow[],
  deltaCm: number
): ProductDimensionRow[] => {
  if (!deltaCm || !Number.isFinite(deltaCm)) return rows;
  return rows.map((row) => {
    if ((row?.measurement || '').toLowerCase().includes('width') === false) return row;
    const adjustedValues: Record<string, string> = {};
    Object.entries(row.values || {}).forEach(([size, rawValue]) => {
      const value = String(rawValue || '').trim();
      const match = value.match(/(\d+(?:\.\d+)?)\s*cm\s*\((\d+(?:\.\d+)?)\s*\"?/i);
      if (match) {
        const baseCm = Number.parseFloat(match[1]);
        const baseInches = Number.parseFloat(match[2]);
        const newCm = Number((baseCm + deltaCm).toFixed(1));
        const newInches = Number((baseInches + deltaCm / 2.54).toFixed(1));
        adjustedValues[size] = `${newCm} cm (${newInches}")`;
      } else if (value) {
        adjustedValues[size] = value;
      } else {
        adjustedValues[size] = '';
      }
    });
    return { ...row, values: adjustedValues };
  });
};

const parseSizeOption = (rawSize: string, index: number, rawDescription = ''): ParsedSizeOption => {
  const raw = (rawSize || '').trim();
  const description = (rawDescription || '').trim();
  if (!raw) {
    return { id: `size-${index}`, label: 'Size', delta: 0, description, raw: rawSize };
  }

  // Supports examples like:
  // "Small Double (+90)", "King +115", "Super King|140"
  const pipeMatch = raw.match(/^(.*?)\s*\|\s*(-?\d+(\.\d+)?)$/);
  if (pipeMatch) {
    return {
      id: `size-${index}`,
      label: pipeMatch[1].trim() || raw,
      delta: Number(pipeMatch[2] || 0),
      description,
      raw: rawSize,
    };
  }

  const plusMatch = raw.match(/^(.*?)\s*(?:\(\s*)?\+\s*£?\s*(\d+(\.\d+)?)\s*(?:\)\s*)?$/i);
  if (plusMatch) {
    return {
      id: `size-${index}`,
      label: plusMatch[1].trim() || raw,
      delta: Number(plusMatch[2] || 0),
      description,
      raw: rawSize,
    };
  }

  return { id: `size-${index}`, label: raw, delta: 0, description, raw: rawSize };
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
        const rawIcon = (option as { icon_url?: unknown }).icon_url;
        const icon_url = typeof rawIcon === 'string' ? rawIcon.trim() : '';
        const rawDelta = (option as { price_delta?: unknown }).price_delta;
        const price_delta = typeof rawDelta === 'number' ? rawDelta : Number(rawDelta || 0);
        const rawSize = (option as { size?: unknown }).size;
        const size = typeof rawSize === 'string' ? rawSize.trim() : '';
        return { label, description, icon_url, price_delta, size };
      }
      return null;
    })
    .filter((option): option is NormalizedStyleOption => Boolean(option));
};

const parsePriceDeltaFromText = (label = '', description = ''): number => {
  const text = `${label} ${description}`;
  const plusMatch = text.match(/\+\s*£?\s*(\d+(\.\d+)?)/i);
  if (plusMatch) return Number(plusMatch[1] || 0);
  const pipeMatch = text.match(/\|\s*(-?\d+(\.\d+)?)/);
  if (pipeMatch) return Number(pipeMatch[1] || 0);
  return 0;
};

const isInlineSvgMarkup = (value?: string): boolean => {
  const v = (value || '').trim();
  return v.startsWith('<svg') && v.endsWith('</svg>');
};

const svgMarkupToDataUrl = (svgMarkup: string): string => {
  const minified = svgMarkup.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(minified)}`;
};

const IconVisual = ({ icon, alt, className }: { icon?: string; alt: string; className: string }) => {
  if (isInlineSvgMarkup(icon)) {
    return <img src={svgMarkupToDataUrl((icon || '').trim())} alt={alt} className={className} />;
  }
  if (icon) {
    return <img src={icon} alt={alt} className={className} />;
  }
  return <BedDouble className="h-5 w-5 text-muted-foreground" />;
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
  const [enabledGroups, setEnabledGroups] = useState<Record<string, boolean>>({});
  const [activeVariantGroupKey, setActiveVariantGroupKey] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [includeDimensions, setIncludeDimensions] = useState(true);

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
        const normalizedProducts = Array.isArray(productRes)
          ? productRes
          : Array.isArray((productRes as unknown as { results?: Product[] })?.results)
          ? (productRes as unknown as { results: Product[] }).results
          : [];
        const fetched = normalizedProducts[0] || null;
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
          setSelectedSize(parseSizeOption(fetched.sizes[0].name, 0).label);
        }
        if (fetched?.fabrics?.length && fetched.fabrics[0]?.colors?.length) {
          setSelectedFabric(fetched.fabrics[0].name);
          setSelectedColor(fetched.fabrics[0].colors[0].name);
        } else if (fetched?.colors?.length) {
          setSelectedColor(fetched.colors[0].name);
          setSelectedFabric('');
        } else {
          setSelectedFabric('');
        }
        const initialStyles: Record<string, string> = {};
        const nextEnabled: Record<string, boolean> = {};
        (fetched?.styles || []).forEach((styleGroup) => {
          const normalized = normalizeStyleOptions(styleGroup.options);
          const mattressZero = /mattress/i.test(styleGroup.name)
            ? normalized.find((o) => parsePriceDeltaFromText(o.label, o.description || '') === 0)
            : undefined;
          const firstOption = mattressZero || normalized[0];
          if (firstOption) {
            initialStyles[styleGroup.name] = firstOption.label;
          }
          nextEnabled[styleGroup.name] = true;
        });
        setSelectedStyles(initialStyles);
        setEnabledGroups((prev) => ({ ...nextEnabled, ...prev }));
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

  const productImages = product?.images || [];
  const productSizes = product?.sizes || [];
  const selectedFabricObj = (product?.fabrics || []).find((f) => f.name === selectedFabric);
  const fabricColors = selectedFabricObj?.colors || [];
  const availableColors = (fabricColors.length > 0 ? fabricColors : product?.colors) || [];
  useEffect(() => {
    if (fabricColors.length > 0) {
      if (!fabricColors.some((c) => c.name === selectedColor)) {
        setSelectedColor(fabricColors[0].name);
      }
    } else if (availableColors.length > 0) {
      if (!availableColors.some((c) => c.name === selectedColor)) {
        setSelectedColor(availableColors[0].name);
      }
    }
  }, [fabricColors, availableColors, selectedColor]);
  const sizeOptions = productSizes.map((size, index) => parseSizeOption(size.name, index, size.description || ''));

  const styleVariantGroups = useMemo<VariantGroup[]>(() => {
    const currentSize = selectedSize;
    return (product?.styles || [])
      .map((styleGroup) => {
        const options = normalizeStyleOptions(styleGroup.options)
          .map((option, idx) => ({
            key: `${styleGroup.id}-${idx}`,
            label: option.label,
            description: option.description,
            icon_url: option.icon_url,
            size: option.size,
            sizes: option.sizes,
            price_delta:
              typeof option.price_delta === 'number'
                ? option.price_delta
                : parsePriceDeltaFromText(option.label, option.description),
          }))
          .filter((opt) => {
            const sizes = opt.sizes && opt.sizes.length ? opt.sizes : opt.size ? [opt.size] : [];
            if (!currentSize || sizes.length === 0) return true;
            return sizes.includes(currentSize);
          });
        return {
          key: `style:${styleGroup.name}`,
          name: styleGroup.name,
          icon_url: styleGroup.icon_url,
          kind: 'style' as const,
          styleName: styleGroup.name,
          options,
        };
      })
      .filter((group) => group.options.length > 0);
  }, [product?.styles, selectedSize]);

  const variantGroups = useMemo<VariantGroup[]>(() => {
    const groups: VariantGroup[] = [];
    if (availableColors.length > 0) {
      groups.push({
        key: 'color',
        name: 'Colour',
        kind: 'color',
        options: availableColors.map((color) => ({
          key: `color-${color.id}`,
          label: color.name,
          color_code: color.hex_code,
          price_delta: 0,
        })),
      });
    }
    if (sizeOptions.length > 0) {
      groups.push({
        key: 'size',
        name: 'Size',
        kind: 'size',
        options: sizeOptions.map((size) => ({
          key: size.id,
          label: size.label,
          description: size.description,
          price_delta: size.delta,
        })),
      });
    }
    groups.push(...styleVariantGroups);
    return groups;
  }, [availableColors, sizeOptions, styleVariantGroups]);

  useEffect(() => {
    if (!variantGroups.length) return;
    if (!activeVariantGroupKey || !variantGroups.some((group) => group.key === activeVariantGroupKey)) {
      setActiveVariantGroupKey(variantGroups[0].key);
    }
  }, [variantGroups, activeVariantGroupKey]);

  useEffect(() => {
    setSelectedStyles((prev) => {
      const next = { ...prev };
      styleVariantGroups.forEach((group) => {
        const styleName = group.styleName || group.name;
        const current = prev[styleName];
        const hasCurrent = group.options.some((o) => o.label === current);
        if (!hasCurrent && group.options[0]) {
          next[styleName] = group.options[0].label;
        }
      });
      return next;
    });
  }, [selectedSize, styleVariantGroups]);

  const activeSizeOption = sizeOptions.find((size) => size.label === selectedSize) || sizeOptions[0];
  const sizeDelta = activeSizeOption?.delta || 0;

  const getSelectedOptionForGroup = (group: VariantGroup): VariantOption | undefined => {
    if (group.kind === 'color') {
      return group.options.find((option) => option.label === selectedColor) || group.options[0];
    }
    if (group.kind === 'size') {
      return group.options.find((option) => option.label === selectedSize) || group.options[0];
    }
    const styleName = group.styleName || group.name;
    const match = group.options.find((option) => option.label === selectedStyles[styleName]);
    return match;
  };

  const stylePriceDelta = styleVariantGroups.reduce((sum, group) => {
    const selected = getSelectedOptionForGroup(group);
    if (!enabledGroups[group.name]) return sum;
    return sum + Number(selected?.price_delta || 0);
  }, 0);

  const wingbackSelected = styleVariantGroups.some((group) => {
    const selected = getSelectedOptionForGroup(group);
    return /wingback/i.test(`${selected?.label || ''} ${selected?.description || ''}`);
  });

  const basePrice = product?.price ?? 0;
  const baseOriginalPrice = product?.original_price ?? undefined;
  const unitPrice = basePrice + sizeDelta + stylePriceDelta;
  const unitOriginalPrice =
    baseOriginalPrice !== undefined ? baseOriginalPrice + sizeDelta + stylePriceDelta : undefined;
  const totalPrice = unitPrice * quantity;
  const savingsPerUnit = unitOriginalPrice && unitOriginalPrice > unitPrice ? unitOriginalPrice - unitPrice : 0;

  const fullDescription = (product?.description || '').trim();
  const shortDescription =
    (product?.short_description || '').trim() || fullDescription.split('. ')[0] || '';
  const dimensionsRows = (product?.features || []).filter((feature) =>
    /(dimension|height|width|length|depth|cm|mm|inch|ft)/i.test(feature)
  );
  const rawDimensionTableRows = (product?.computed_dimensions || product?.dimensions || []).filter(
    (row) => row?.measurement && row?.values && Object.keys(row.values).length > 0
  );
  const adjustedDimensionTableRows = useMemo(
    () =>
      wingbackSelected
        ? adjustDimensionsForWingback(rawDimensionTableRows, product?.wingback_width_delta_cm || 4)
        : rawDimensionTableRows,
    [rawDimensionTableRows, wingbackSelected, product?.wingback_width_delta_cm]
  );
  const dimensionColumns = useMemo(
    () =>
      adjustedDimensionTableRows.length > 0
        ? DIMENSION_SIZE_COLUMNS.filter((size) =>
            adjustedDimensionTableRows.some((row) => (row.values?.[size] || '').trim().length > 0)
          )
        : [],
    [adjustedDimensionTableRows]
  );
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const returnsInfoAnswer =
    (product?.returns_guarantee || '').trim() ||
    '10-year structural guarantee, 30-day comfort exchange on mattresses, and free returns within 14 days.';
  const faqEntries = useMemo(
    () => {
      const baseFaqs = Array.isArray(product?.faqs) ? product.faqs : [];
      return [
        ...baseFaqs,
        { question: 'Returns & Guarantee', answer: returnsInfoAnswer },
      ];
    },
    [product?.faqs, returnsInfoAnswer]
  );

  useEffect(() => {
    if (dimensionColumns.length === 0) {
      setSelectedDimension(null);
      return;
    }
    setSelectedDimension((prev) => (prev && dimensionColumns.includes(prev) ? prev : dimensionColumns[0]));
  }, [dimensionColumns]);

  useEffect(() => {
    if (selectedSize && dimensionColumns.includes(selectedSize)) {
      setSelectedDimension(selectedSize);
    }
  }, [selectedSize, dimensionColumns]);

  const selectedDimensionDetails = useMemo(() => {
    if (!selectedDimension) return '';
    const details = adjustedDimensionTableRows
      .map((row) => {
        const value = row.values?.[selectedDimension];
        return value ? `${row.measurement}: ${value}` : null;
      })
      .filter(Boolean);
    return details.join(' | ');
  }, [adjustedDimensionTableRows, selectedDimension]);

  const activeVariantGroup =
    variantGroups.find((group) => group.key === activeVariantGroupKey) || variantGroups[0];

  const toggleShowMore = (groupKey: string) => {
    setShowMoreOptions((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

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
    const extrasTotal = stylePriceDelta;
    addItem({
      product: product as Product,
      quantity,
      size: activeSizeOption?.label || selectedSize,
      color: selectedColor,
      selectedVariants: enabledGroups
        ? Object.fromEntries(
            Object.entries(selectedStyles).filter(([name]) => enabledGroups[name])
          )
        : selectedStyles,
      fabric: selectedFabric || undefined,
      dimension: includeDimensions ? selectedDimension || undefined : undefined,
      dimension_details: includeDimensions ? selectedDimensionDetails || undefined : undefined,
      include_dimension: includeDimensions,
      extras_total: extrasTotal,
      unit_price: unitPrice,
    });
    toast.success(`${product.name} added to cart`);
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
                  src={productImages[selectedImage]?.url}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              <div className="absolute right-4 top-4 flex flex-col gap-2 items-end">
                {product.is_bestseller && (
                  <Badge className="bg-primary text-primary-foreground">Bestseller</Badge>
                )}
                {product.is_new && (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">New</Badge>
                )}
                {savingsPerUnit > 0 && (
                  <Badge className="bg-bronze text-card-foreground shadow-md">Save {formatPrice(savingsPerUnit)}</Badge>
                )}
              </div>
            </motion.div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-md transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
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

            <div className="space-y-3">
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                {product.name}
              </h1>
              <p className="text-base text-muted-foreground">{shortDescription}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-primary">{formatPrice(unitPrice)}</span>
                {unitOriginalPrice && unitOriginalPrice > unitPrice && (
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(unitOriginalPrice)}</span>
                )}
                {savingsPerUnit > 0 && (
                  <Badge className="bg-bronze text-card-foreground text-sm">
                    Save {formatPrice(savingsPerUnit)}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Price updates automatically when you select a size.</p>
            </div>

            {variantGroups.length > 0 && (
              <div className="space-y-6 rounded-xl border border-border bg-card p-4">
                {variantGroups.map((group) => {
                  const selected = getSelectedOptionForGroup(group);
                  const isStyleGroup = group.kind === 'style';
                  const groupEnabled = !isStyleGroup || enabledGroups[group.name] !== false;
                  const hasMore = group.options.length > 3;
                  const optionsToRender = showMoreOptions[group.key] ? group.options : group.options.slice(0, 3);
                  return (
                    <div key={group.key} className="space-y-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <IconVisual icon={group.icon_url} alt={group.name} className="h-10 w-10 object-contain" />
                          <div>
                            <p className="text-base font-semibold capitalize">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selected?.label ? `Selected: ${selected.label}` : 'Select an option'}
                            </p>
                          </div>
                        </div>
                        {isStyleGroup && (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={groupEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEnabledGroups((prev) => ({ ...prev, [group.name]: checked }));
                                if (checked) {
                                  const styleName = group.styleName || group.name;
                                  if (!selectedStyles[styleName] && group.options[0]) {
                                    setSelectedStyles((prev) => ({ ...prev, [styleName]: group.options[0].label }));
                                  }
                                }
                              }}
                            />
                            Include
                          </label>
                        )}
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible snap-x">
                        {optionsToRender.map((option) => {
                          const isSelected = selected?.key === option.key;
                          const disabled = isStyleGroup && !groupEnabled;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                if (group.kind === 'color') {
                                  setSelectedColor(option.label);
                                  return;
                                }
                                if (group.kind === 'size') {
                                  setSelectedSize(option.label);
                                  return;
                                }
                                const styleName = group.styleName || group.name;
                                setSelectedStyles((prev) => ({ ...prev, [styleName]: option.label }));
                                setEnabledGroups((prev) => ({ ...prev, [group.name]: true }));
                              }}
                              className={`relative flex min-w-[220px] flex-1 flex-col items-start gap-2 rounded-xl border border-amber-200 bg-card/60 px-4 py-4 transition-all snap-center ${
                                disabled
                                  ? 'cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-border hover:border-primary/60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {group.kind === 'color' ? (
                                  <span
                                    className="h-12 w-12 rounded-full border border-border"
                                    style={{ backgroundColor: option.color_code || '#888' }}
                                  />
                                ) : (
                                  <IconVisual
                                    icon={option.icon_url || group.icon_url}
                                    alt={option.label}
                                    className="h-12 w-12 object-contain"
                                  />
                                )}
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-espresso">{option.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Number(option.price_delta || 0) > 0
                                      ? `+${formatPrice(Number(option.price_delta || 0))}`
                                      : 'Included'}
                                  </p>
                                </div>
                              </div>
                              {option.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                  {option.description}
                                </p>
                              )}
                              {isSelected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                      {hasMore && (
                        <button
                          type="button"
                          className="text-sm font-medium text-primary underline"
                          onClick={() => toggleShowMore(group.key)}
                        >
                          {showMoreOptions[group.key] ? 'Show less' : 'View more'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {dimensionColumns.length > 0 && (
              <div className="space-y-4 rounded-xl border border-amber-300 bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-espresso">Dimensions</h3>
                    <p className="text-sm text-muted-foreground">Select a size to view exact measurements.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={includeDimensions}
                      onChange={(e) => setIncludeDimensions(e.target.checked)}
                    />
                    Send to order
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dimensionColumns.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedDimension(size)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedDimension === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary/60'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedDimension && (
                  <div className="divide-y rounded-md border border-amber-300 bg-card/60">
                    {adjustedDimensionTableRows.map((row) => (
                      <div
                        key={`${row.measurement}-${selectedDimension}`}
                        className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-3"
                      >
                        <span className="font-medium text-foreground sm:col-span-1">{row.measurement}</span>
                        <span className="text-sm text-muted-foreground sm:col-span-2">
                          {row.values?.[selectedDimension] || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {product.fabrics && product.fabrics.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">Fabric</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {product.fabrics.map((fabric) => (
            <button
              key={fabric.id}
              onClick={() => {
                setSelectedFabric(fabric.name);
                if ((fabric.colors || []).length > 0) {
                  setSelectedColor(fabric.colors[0].name);
                }
              }}
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
                {availableColors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Colours</p>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color, idx) => (
                        <button
                          key={color.id ?? `${color.name}-${idx}`}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            selectedColor === color.name
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:border-primary/50'
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: color.hex_code || '#888' }}
                          />
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                Add to Cart - {formatPrice(totalPrice)}
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
              {fullDescription && (
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{fullDescription}</p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {(adjustedDimensionTableRows.length > 0 || dimensionsRows.length > 0) && (
                <AccordionItem value="dimensions" id="dimensions-section">
                  <AccordionTrigger>
                    <span className="inline-flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Dimensions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {wingbackSelected && (
                      <div className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                        Wingback selected: width increases by approximately {product.wingback_width_delta_cm || 4} cm. Length and height stay the same.
                      </div>
                    )}
                    {adjustedDimensionTableRows.length > 0 && dimensionColumns.length > 0 ? (
                      <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-muted/60">
                            <tr>
                              <th className="p-2 text-left font-medium">Measurement</th>
                              {dimensionColumns.map((size) => (
                                <th key={size} className="p-2 text-left font-medium">{size}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {adjustedDimensionTableRows.map((row, idx) => (
                              <tr key={`${row.measurement}-${idx}`} className="border-t">
                                <td className="p-2 font-medium">{row.measurement}</td>
                                {dimensionColumns.map((size) => (
                                  <td key={`${row.measurement}-${size}`} className="p-2 text-muted-foreground">
                                    {row.values?.[size] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ul className="list-disc space-y-2 pl-4">
                        {dimensionsRows.map((row, i) => (
                          <li key={i} className="text-muted-foreground">{row}</li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

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
                        <p>- Free delivery on orders over 500 GBP</p>
                        <p>- Standard delivery: 3-5 working days</p>
                        <p>- Premium delivery with room of choice: available</p>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              {faqEntries.length > 0 && (
                <AccordionItem value="faqs">
                  <AccordionTrigger>FAQs</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {faqEntries.map((faq, i) => (
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

