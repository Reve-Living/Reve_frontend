import { useEffect, useMemo, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

import { useParams, Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

import {

  ChevronRight,
  ChevronLeft,

  Minus,

  Plus,

  Star,

  Truck,
  Shield,
  CreditCard,
  Ruler,
  BedDouble,
  CheckCircle2,
  X,
  Wallet,
  BadgeDollarSign,
  Maximize2,
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

import { apiGet, apiPost } from '@/lib/api';
import { Category, Product, ProductDimensionRow, Review, ProductMattress } from '@/lib/types';
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

  kind: 'color' | 'size' | 'style' | 'fabric';

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



const DIMENSION_SIZE_COLUMNS = [
  '2ft6 Small Single',
  '3ft Single',
  '4ft Small Double',
  '4ft6 Double',
  '5ft King',
  '6ft Super King',
];

const DEFAULT_DIMENSION_ROWS: ProductDimensionRow[] = [
  {
    measurement: 'Length',
    values: {
      '2ft6 Small Single': '190 cm (74.8")',
      '3ft Single': '190 cm (74.8")',
      '4ft Small Double': '190 cm (74.8")',
      '4ft6 Double': '190 cm (74.8")',
      '5ft King': '200 cm (78.7")',
      '6ft Super King': '200 cm (78.7")',
    },
  },
  {
    measurement: 'Width',
    values: {
      '2ft6 Small Single': '75 cm (30.0")',
      '3ft Single': '90 cm (35.4")',
      '4ft Small Double': '120 cm (47.2")',
      '4ft6 Double': '135 cm (53.1")',
      '5ft King': '150 cm (59.1")',
      '6ft Super King': '180 cm (70.9")',
    },
  },
  {
    measurement: 'Bed Height',
    values: {
      '2ft6 Small Single': '35 cm (13.8")',
      '3ft Single': '35 cm (13.8")',
      '4ft Small Double': '35 cm (13.8")',
      '4ft6 Double': '35 cm (13.8")',
      '5ft King': '35 cm (13.8")',
      '6ft Super King': '35 cm (13.8")',
    },
  },
];

const DEFAULT_DIMENSION_LOOKUP: Record<string, Record<string, string>> = DEFAULT_DIMENSION_ROWS.reduce(
  (acc, row) => {
    acc[row.measurement] = row.values || {};
    return acc;
  },
  {} as Record<string, Record<string, string>>
);



const formatPrice = (value: number): string => gbpFormatter.format(Math.max(0, value));

const renderMultilineParagraphs = (value?: string) => {
  if (!value) return null;
  return value
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => (
      <p
        key={`${line}-${idx}`}
        className={idx === 0 ? 'font-semibold whitespace-pre-line' : 'whitespace-pre-line'}
        dangerouslySetInnerHTML={{ __html: renderRichText(line) }}
      />
    ));
};

const escapeHtml = (value?: string) =>
  (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Minimal rich text: only **bold** is allowed; everything else is escaped.
const renderRichText = (value?: string) => {
  const safe = escapeHtml(value);
  return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
};



const adjustDimensionsForWingback = (

  rows: ProductDimensionRow[],

  deltaCm: number

): ProductDimensionRow[] => {

  if (!deltaCm || !Number.isFinite(deltaCm)) return rows;

  return rows.map((row) => {

    const label = (row?.measurement || '').toLowerCase();

    const affectsWidth =

      label.includes('width') ||

      label.includes('headboard') || // wingback headboards flare outward

      label.includes('overall width');

    if (!affectsWidth) return row;

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



const parseSizeOption = (rawSize: string, index: number, rawDescription = '', explicitDelta?: number): ParsedSizeOption => {

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



  const plusMatch = raw.match(/^(.*?)\s*(?:\(\s*)?\+\s*(?:£)?\s*(\d+(?:\.\d+)?)\s*(?:\)\s*)?$/i);

  if (plusMatch) {

    return {

      id: `size-${index}`,

      label: plusMatch[1].trim() || raw,

      delta: Number(plusMatch[2] || 0),

      description,

      raw: rawSize,

    };

  }



  const fallbackDelta = Number.isFinite(explicitDelta) ? Number(explicitDelta) : 0;

  return { id: `size-${index}`, label: raw, delta: fallbackDelta, description, raw: rawSize };

};

const formatOptionLabel = (label: string) => label.replace(/(\\d)([A-Za-z])/g, '$1 $2').trim();



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

        const sizes = Array.isArray((option as { sizes?: unknown }).sizes)

          ? ((option as { sizes?: unknown }).sizes as unknown[])

              .map((s) => (typeof s === 'string' ? s.trim() : ''))

              .filter(Boolean)

          : [];

        return { label, description, icon_url, price_delta, size, sizes };

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

// Normalizes features so we only create bullets for actual bullet separators (line breaks or •),
// never for commas inside the text.
const normalizeFeatures = (features: unknown): string[] => {
  if (!features) return [];

  const asArray = Array.isArray(features) ? features : [features];

  return asArray
    .flatMap((item) => {
      if (typeof item !== 'string') return [];
      const withNewlines = item.replace(/<br\s*\/?>/gi, '\n');
      return withNewlines.split(/[\r\n\u2022]+/);
    })
    .map((entry) => entry.replace(/^[\s\-–—•]+/, '').trim())
    .filter(Boolean);
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

const reassuranceItems = [
  { icon: Truck, label: 'Free UK Delivery' },
  { icon: Shield, label: '10-Year Guarantee' },
  { icon: CheckCircle2, label: 'Secure Checkout' },
];

const paymentIcons = [
  { label: 'Visa', icon: CreditCard },
  { label: 'Mastercard', icon: CreditCard },
  { label: 'Amex', icon: CreditCard },
  { label: 'PayPal', icon: Wallet },
];



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
  type SelectedMattressPick = { id: number; position?: 'top' | 'bottom' | 'both' | null };
  const [selectedMattresses, setSelectedMattresses] = useState<SelectedMattressPick[]>([]);
  const [isMattressOpen, setIsMattressOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState('');
  const [enabledGroups, setEnabledGroups] = useState<Record<string, boolean>>({});
  const [activeVariantGroupKey, setActiveVariantGroupKey] = useState('');
  const [activeInfoTab, setActiveInfoTab] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [isDimensionsOpen, setIsDimensionsOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const showDimensionsTable = (product as Product | undefined)?.show_dimensions_table !== false;

  const fetchReviews = async (productId: number) => {
    setIsLoadingReviews(true);
    try {
      const res = await apiGet<Review[]>(`/reviews/?product=${productId}`);
      setReviews(Array.isArray(res) ? res : []);
    } catch {
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

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
        setSelectedImage(0);
        setIsGalleryOpen(false);
        setIsZoomed(false);
        setActiveInfoTab(null);
        setSelectedMattresses([]);
        if (fetched?.id) {
          fetchReviews(fetched.id);
        }

        // Default mattress selection: auto-pick included option when present
        if (Array.isArray(fetched?.mattresses) && fetched.mattresses.length > 0) {
          const freeMattress = fetched.mattresses.find(
            (m) =>
              Number(m.price ?? 0) === 0 &&
              Number(m.price_top ?? 0) === 0 &&
              Number(m.price_bottom ?? 0) === 0 &&
              Number(m.price_both ?? 0) === 0
          );
          if (freeMattress?.id) {
            setSelectedMattresses(() =>
              normalizeBunkMattressSelections([
                {
                  id: freeMattress.id,
                  position: freeMattress.enable_bunk_positions ? 'both' : null,
                },
              ])
            );
          }
        }

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

        const firstFabricWithColors = (fetched?.fabrics || []).find((f) => (f.colors || []).length > 0);
        if (firstFabricWithColors) {
          const firstWithImage =
            firstFabricWithColors.colors.find((c) => c.image_url) || firstFabricWithColors.colors[0];
          setSelectedFabric(firstFabricWithColors.name);
          setSelectedColor(firstWithImage?.name || '');
        } else if (fetched?.colors?.length) {
          setSelectedColor('');
          setSelectedFabric('');
        } else {
          setSelectedFabric('');
        }

        const initialStyles: Record<string, string> = {};

        const nextEnabled: Record<string, boolean> = {};

        (fetched?.styles || []).forEach((styleGroup) => {
          const normalized = normalizeStyleOptions(styleGroup.options);
          const freeOption =
            normalized.find(
              (o) =>
                parsePriceDeltaFromText(o.label, o.description || '') === 0 ||
                Number(o.price_delta ?? 0) === 0
            ) || undefined;
          if (freeOption) {
            initialStyles[styleGroup.name] = freeOption.label;
            nextEnabled[styleGroup.name] = true;
          } else {
            nextEnabled[styleGroup.name] = false;
          }
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
  const displayImages = useMemo(() => {
    if (!selectedColor) return productImages;
    const matched = productImages.filter((img) =>
      (img as ProductImage).color_name
        ? (img as ProductImage).color_name!.toLowerCase() === selectedColor.toLowerCase()
        : false
    );
    return matched.length > 0 ? matched : productImages;
  }, [productImages, selectedColor]);
  const totalImages = displayImages.length;

  useEffect(() => {
    if (selectedImage >= totalImages) {
      setSelectedImage(totalImages > 0 ? 0 : 0);
    }
  }, [totalImages, selectedImage]);

  const productSizes = product?.sizes || [];
  const sizeIconsEnabled = product?.show_size_icons !== false;

  const selectedFabricObj = (product?.fabrics || []).find((f) => f.name === selectedFabric);

  const fabricColors = selectedFabricObj?.colors || [];

  const availableColors =
    product?.fabrics?.length && selectedFabric
      ? fabricColors
      : product?.fabrics?.length
      ? []
      : product?.colors || [];

  const displayColors = (availableColors || []).filter((c) => c.image_url);

  const fabricColorOptions = useMemo(() => {
    return (product?.fabrics || []).flatMap((fabric) =>
      (fabric.colors || []).map((color) => ({
        value: `${fabric.name}__${color.name}`,
        fabric: fabric.name,
        color: color.name,
        label: `${color.name} — ${fabric.name}`,
      }))
    );
  }, [product?.fabrics]);

  useEffect(() => {
    // If current selection no longer exists, clear it instead of auto-selecting first color
    const names = new Set(displayColors.map((c) => c.name).concat(availableColors.map((c) => c.name)));
    if (selectedColor && !names.has(selectedColor)) {
      setSelectedColor('');
    }
  }, [fabricColors, availableColors, displayColors, selectedColor]);

  const openGallery = () => {
    if (!totalImages) return;
    setIsZoomed(false);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const goToNextImage = () => {
    if (!totalImages) return;
    setSelectedImage((prev) => (prev + 1) % totalImages);
  };

  const goToPrevImage = () => {
    if (!totalImages) return;
    setSelectedImage((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const sizeOptions = productSizes.map((size, index) =>
    parseSizeOption(size.name, index, size.description || '', Number(size.price_delta ?? 0))
  );



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

                : Number(option.price_delta || 0) || parsePriceDeltaFromText(option.label, option.description),

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

    const fabrics = (product?.fabrics || []).filter((f) => (f.colors || []).length > 0);

    if (fabrics.length > 0) {
      groups.push({
        key: 'fabric',
        name: 'Fabric',
        kind: 'fabric',
        options: fabrics.map((fabric) => ({
          key: `fabric-${fabric.id ?? fabric.name}`,
          label: fabric.name,
          description: '',
          price_delta: 0,
        })),
      });
    }

    if (displayColors.length > 0) {

      groups.push({

        key: 'color',

        name: 'Colour',

        kind: 'color',

        options: displayColors.map((color, idx) => ({

          key: `color-${color.id ?? color.slug ?? color.name ?? idx}`,

          label: color.name,

          color_code: color.hex_code,
          icon_url: color.image_url,

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

    // Show storage before headboard by ordering style groups: storage first, then others
    const storageGroups = styleVariantGroups.filter((g) => /storage/i.test(g.name));
    const nonStorageGroups = styleVariantGroups.filter((g) => !/storage/i.test(g.name));
    groups.push(...storageGroups, ...nonStorageGroups);

    return groups;

  }, [availableColors, sizeOptions, styleVariantGroups, product?.fabrics]);



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
        const isStorageGroup = /storage/i.test(styleName);
        const enabled = enabledGroups[styleName] !== false;

        const current = prev[styleName];

        const hasCurrent = group.options.some((o) => o.label === current || o.key === current);

        if (!enabled) {
          // Group is disabled; leave selection cleared
          if (current) delete next[styleName];
          return;
        }

        if (!hasCurrent) {
          // Keep user-optional groups (all styles) empty when invalid or deselected
          if (current) delete next[styleName];
          return;
        }

      });

      return next;

    });

  }, [selectedSize, styleVariantGroups, enabledGroups]);



  const activeSizeOption = sizeOptions.find((size) => size.label === selectedSize) || sizeOptions[0];

  const sizeDelta = activeSizeOption?.delta || 0;



  const getSelectedOptionForGroup = (group: VariantGroup): VariantOption | undefined => {

    if (group.kind === 'color') {

      return group.options.find((option) => option.label === selectedColor);

    }

    if (group.kind === 'fabric') {
      return group.options.find((option) => option.label === selectedFabric) || group.options[0];
    }

    if (group.kind === 'size') {

      return group.options.find((option) => option.label === selectedSize) || group.options[0];

    }

    const styleName = group.styleName || group.name;
    const match = group.options.find(
      (option) =>
        option.label === selectedStyles[styleName] || option.key === selectedStyles[styleName]
    );
    return match;

  };



  const stylePriceDelta = styleVariantGroups.reduce((sum, group) => {
    const selected = getSelectedOptionForGroup(group);
    if (!enabledGroups[group.name]) return sum;
    const delta = Number(selected?.price_delta ?? 0);
    return sum + (Number.isFinite(delta) ? delta : 0);
  }, 0);

  const mattresses: ProductMattress[] = Array.isArray(product?.mattresses) ? (product?.mattresses as ProductMattress[]) : [];
  const getMattressById = (id: number) => mattresses.find((m) => m.id === id) || null;
  const priceForPosition = (m: ProductMattress | null, pos: 'top' | 'bottom' | 'both' | null) => {
    if (!m) return 0;
    const base = m.price !== undefined && m.price !== null ? Number(m.price) : 0;
    const top = m.price_top !== undefined && m.price_top !== null ? Number(m.price_top) : base;
    const bottom = m.price_bottom !== undefined && m.price_bottom !== null ? Number(m.price_bottom) : base;
    const both =
      m.price_both !== undefined && m.price_both !== null
        ? Number(m.price_both)
        : top + bottom;
    if (!m.enable_bunk_positions || !pos) return base;
    if (pos === 'top') return top;
    if (pos === 'bottom') return bottom;
    return both;
  };
  const selectedMattressDetails = selectedMattresses
    .map((sel) => {
      const m = getMattressById(sel.id);
      if (!m) return null;
      const position = m.enable_bunk_positions ? sel.position || 'both' : null;
      return {
        ...m,
        position,
        price_value: priceForPosition(m, position),
      };
    })
    .filter(Boolean) as Array<ProductMattress & { position: 'top' | 'bottom' | 'both' | null; price_value: number }>;
  const totalMattressPrice = selectedMattressDetails.reduce((sum, m) => sum + (Number.isFinite(m.price_value) ? m.price_value : 0), 0);
  const primaryMattress = selectedMattressDetails[0] || null;

  const wingbackSelected = styleVariantGroups.some((group) => {
    const selected = getSelectedOptionForGroup(group);
    return /wingback/i.test(`${selected?.label || ''} ${selected?.description || ''}`);
  });

  const basePrice = Number(product?.price ?? 0);

  const baseOriginalPrice =

    product?.original_price !== undefined && product?.original_price !== null

      ? Number(product.original_price)

      : undefined;

  const unitPrice = basePrice + sizeDelta + stylePriceDelta + totalMattressPrice;

  const unitOriginalPrice =

    baseOriginalPrice !== undefined ? baseOriginalPrice + sizeDelta + stylePriceDelta + totalMattressPrice : undefined;

  const totalPrice = unitPrice * quantity;

  const savingsPerUnit = unitOriginalPrice && unitOriginalPrice > unitPrice ? unitOriginalPrice - unitPrice : 0;



  const fullDescription = (product?.description || '').trim();

  const shortDescription =
    (product?.short_description || '').trim() || fullDescription.split('. ')[0] || '';

  const featureList = useMemo(() => normalizeFeatures(product?.features), [product?.features]);

  const dimensionsRows = featureList.filter((feature) =>
    /(dimension|height|width|length|depth|cm|mm|inch|ft)/i.test(feature)
  );

  const dimensionValueForSize = (row: ProductDimensionRow, size: string): string => {
    const direct = row.values?.[size];
    if (direct) return String(direct);
    const fallback = DEFAULT_DIMENSION_LOOKUP[row.measurement || '']?.[size];
    if (fallback) return String(fallback);
    if (size === '2ft6 Small Single') {
      const base =
        row.values?.['3ft Single'] ||
        DEFAULT_DIMENSION_LOOKUP[row.measurement || '']?.['3ft Single'] ||
        '';
      const label = (row.measurement || '').toLowerCase();
      if (label.includes('width')) {
        return '75 cm (30")';
      }
      if (base) return String(base);
    }
    return '—';
  };

  const rawDimensionTableRows = useMemo(() => {
    if (!showDimensionsTable) return [];
    const explicitDimensions = (product?.dimensions || []).filter(
      (row) => row?.measurement && row?.values && Object.keys(row.values).length > 0
    );
    if (explicitDimensions.length > 0) return explicitDimensions;
    return (product?.computed_dimensions || []).filter(
      (row) => row?.measurement && row?.values && Object.keys(row.values).length > 0
    );
  }, [product?.computed_dimensions, product?.dimensions, showDimensionsTable]);
  const dimensionParagraph = (product as Product | undefined)?.dimension_paragraph?.trim() || '';
  const dimensionImages = (product as Product | undefined)?.dimension_images || [];
  const matchedDimensionImages = useMemo(() => {
    if (!Array.isArray(dimensionImages)) return [];
    if (selectedDimension) {
      return dimensionImages.filter(
        (img) => (img.size || '').toLowerCase().trim() === selectedDimension.toLowerCase().trim()
      );
    }
    return dimensionImages;
  }, [dimensionImages, selectedDimension]);

  const mattressMap = useMemo(() => {
    const map: Record<number, ProductMattress> = {};
    (product?.mattresses || []).forEach((m) => {
      if (m.id) map[m.id] = m;
    });
    return map;
  }, [product?.mattresses]);

  const bunkMattressRulesEnabled = useMemo(
    () => (product?.mattresses || []).some((m) => m.enable_bunk_positions),
    [product?.mattresses]
  );

  const getBunkOccupancy = useCallback(
    (list: SelectedMattressPick[]) => {
      let topTaken = false;
      let bottomTaken = false;
      list.forEach((sel) => {
        const mattress = sel.id ? mattressMap[sel.id] : undefined;
        if (!mattress?.enable_bunk_positions) return;
        const pos = sel.position || 'both';
        if (pos === 'both') {
          topTaken = true;
          bottomTaken = true;
        } else if (pos === 'top') {
          topTaken = true;
        } else if (pos === 'bottom') {
          bottomTaken = true;
        }
      });
      return { topTaken, bottomTaken };
    },
    [mattressMap]
  );

  const normalizeBunkMattressSelections = useCallback(
    (list: SelectedMattressPick[]): SelectedMattressPick[] => {
      if (!bunkMattressRulesEnabled) return list;

      const reversed = [...list].reverse(); // latest selections first
      let topTaken = false;
      let bottomTaken = false;
      let bothPick: SelectedMattressPick | null = null;
      const kept: SelectedMattressPick[] = [];

      for (const sel of reversed) {
        const mattress = sel.id ? mattressMap[sel.id] : undefined;
        const isBunk = Boolean(mattress?.enable_bunk_positions);

        if (isBunk && sel.position === 'both') {
          bothPick = sel;
          break; // "both" overrides other bunk selections
        }
      }

      if (bothPick) {
        return list.filter((sel) => {
          const mattress = sel.id ? mattressMap[sel.id] : undefined;
          const isBunk = Boolean(mattress?.enable_bunk_positions);
          if (!isBunk) return true;
          return sel.id === bothPick!.id && sel.position === 'both';
        });
      }

      for (const sel of reversed) {
        const mattress = sel.id ? mattressMap[sel.id] : undefined;
        const isBunk = Boolean(mattress?.enable_bunk_positions);
        const pos = sel.position;

        if (!isBunk) {
          kept.push(sel);
          continue;
        }

        if (pos === 'top') {
          if (topTaken) continue;
          topTaken = true;
          kept.push(sel);
          continue;
        }

        if (pos === 'bottom') {
          if (bottomTaken) continue;
          bottomTaken = true;
          kept.push(sel);
          continue;
        }

        if (pos) {
          kept.push(sel);
        }
      }

      return kept.reverse();
    },
    [bunkMattressRulesEnabled, mattressMap]
  );

const adjustedDimensionTableRows = useMemo(() => {
    const filteredRows = rawDimensionTableRows.filter(
      (row) => !(row.measurement || '').toLowerCase().includes('headboard height')
    );

    if (filteredRows.length === 0) return [];

    // Only include sizes that actually exist in the product data; fall back to defaults if none present.
    const allowedSizes = (() => {
      const seen = new Set<string>();
      filteredRows.forEach((row) => {
        Object.entries(row.values || {}).forEach(([size, value]) => {
          if (String(value || '').trim()) seen.add(size.trim());
        });
      });
      return seen.size > 0 ? Array.from(seen) : [...DIMENSION_SIZE_COLUMNS];
    })();

    const mergedRows = filteredRows.map((row) => {
      const mergedValues: Record<string, string> = { ...(row.values || {}) };
      allowedSizes.forEach((size) => {
        if (!mergedValues[size]) {
          mergedValues[size] =
            DEFAULT_DIMENSION_LOOKUP[row.measurement || '']?.[size] ||
            (size === '2ft6 Small Single' && (row.measurement || '').toLowerCase().includes('width')
              ? '75 cm (30")'
              : mergedValues['3ft Single'] ||
                DEFAULT_DIMENSION_LOOKUP[row.measurement || '']?.['3ft Single'] ||
                '');
        }
      });
      return { ...row, values: mergedValues };
    });

    return wingbackSelected
      ? adjustDimensionsForWingback(mergedRows, product?.wingback_width_delta_cm || 4)
      : mergedRows;
  }, [rawDimensionTableRows, wingbackSelected, product?.wingback_width_delta_cm]);

  const dimensionColumns = useMemo(() => {
    const preferredOrder = [...DIMENSION_SIZE_COLUMNS];
    const seen = new Set<string>();
    adjustedDimensionTableRows.forEach((row) => {
      Object.entries(row.values || {}).forEach(([size, value]) => {
        if ((value || '').toString().trim()) {
          seen.add(size.trim());
        }
      });
    });
    if (seen.size === 0) return [];
    const ordered = preferredOrder.filter((s) => seen.has(s));
    const remainder = Array.from(seen).filter((s) => !preferredOrder.includes(s));
    return [...ordered, ...remainder];
  }, [adjustedDimensionTableRows]);

  const dimensionColumnKey = useMemo(() => dimensionColumns.join('|'), [dimensionColumns]);

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



  useEffect(() => {

    if (dimensionColumns.length === 0) {

      setSelectedDimension(null);

      return;

    }

    setSelectedDimension((prev) =>
      prev && dimensionColumns.includes(prev) ? prev : dimensionColumns[0]
    );

  }, [dimensionColumns]);



  useEffect(() => {

    if (selectedSize && dimensionColumns.includes(selectedSize)) {

      setSelectedDimension(selectedSize);

    }

  }, [selectedSize, dimensionColumnKey]);

const returnsInfoAnswer = (product?.returns_guarantee || '').trim();

  const faqEntries = useMemo(() => {
    const baseFaqs = Array.isArray(product?.faqs) ? product.faqs : [];

    return [...baseFaqs]
      .filter((faq) => faq && typeof faq.question === 'string' && typeof faq.answer === 'string')
      .map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      }))
      .filter((faq) => faq.question && faq.answer);
  }, [product?.faqs, returnsInfoAnswer]);



  const activeVariantGroup =

    variantGroups.find((group) => group.key === activeVariantGroupKey) || variantGroups[0];



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
    const extrasTotal = stylePriceDelta + totalMattressPrice;
    const variantMap = enabledGroups
      ? Object.fromEntries(Object.entries(selectedStyles).filter(([name]) => enabledGroups[name]))
      : { ...selectedStyles };
    if (selectedMattressDetails.length > 0) {
      variantMap['Mattress'] = selectedMattressDetails
        .map((m) => `${m.name || 'Mattress'}${m.position ? ` (${m.position})` : ''}`)
        .join(' | ');
    }
    addItem({
      product: product as Product,
      quantity,
      size: activeSizeOption?.label || selectedSize,
      color: selectedColor,
      selectedVariants: variantMap,
      mattresses: selectedMattressDetails.map((m) => ({
        id: m.id!,
        name: m.name,
        position: m.position,
        price: m.price_value,
      })),
      mattress_id: primaryMattress?.id || null,
      mattress_name: primaryMattress?.name || null,
      mattress_price: primaryMattress ? primaryMattress.price_value : null,
      mattress_position: primaryMattress?.enable_bunk_positions ? primaryMattress.position : null,
      fabric: selectedFabric || undefined,
      dimension: includeDimensions ? selectedDimension || undefined : undefined,
      dimension_details: includeDimensions ? selectedDimensionDetails || undefined : undefined,
      include_dimension: includeDimensions,
      extras_total: extrasTotal,
      unit_price: unitPrice,
    });

    toast.success(`${product.name} added to cart`);

  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) {
      toast.error('Product not found');
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error('Please share a few words about the product');
      return;
    }
    const rating = Math.max(1, Math.min(5, Math.round(reviewForm.rating || 0)));
    setIsSubmittingReview(true);
    try {
      await apiPost('/reviews/', {
        product: product.id,
        name: reviewForm.name.trim() || 'Anonymous',
        rating,
        comment: reviewForm.comment.trim(),
      });
      toast.success('Thank you! Your review will appear once approved.');
      setReviewForm({ name: '', rating: 5, comment: '' });
      setShowReviewForm(false);
      fetchReviews(product.id);
    } catch (error) {
      toast.error('Unable to submit your review right now.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatReviewDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

          <div className="space-y-4 lg:sticky lg:top-24 self-start">

            <motion.div

              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-card"

              onClick={() => setIsZoomed(!isZoomed)}

            >

              <AnimatePresence mode="wait">

                <motion.img

                  key={selectedImage}

                  src={displayImages[selectedImage]?.url}

                  alt={product.name}

                  initial={{ opacity: 0 }}

                  animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}

                  exit={{ opacity: 0 }}

                  transition={{ duration: 0.3 }}

                  className="h-full w-full object-cover"

                />

              </AnimatePresence>



              {totalImages > 1 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGallery();
                    }}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur"
                    aria-label="Open full gallery"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Click to expand</span>
                  </button>
                  <div className="pointer-events-none flex items-center gap-1">
                    {displayImages.map((_, idx) => (
                      <span
                        key={`dot-${idx}`}
                        className={`h-2 w-2 rounded-full bg-white transition-all ${
                          selectedImage === idx ? 'opacity-100' : 'opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}


              <div className="absolute right-4 top-4 flex flex-col gap-2 items-end">

                {product.is_bestseller && (

                  <Badge className="bg-primary text-primary-foreground">Bestseller</Badge>

                )}

                {product.is_new && (

                  <Badge variant="secondary" className="bg-accent text-accent-foreground">New</Badge>

                )}

                {savingsPerUnit > 0 && (
                  <Badge className="bg-bronze text-white shadow-md">Save {formatPrice(savingsPerUnit)}</Badge>
                )}

              </div>

            </motion.div>



            {displayImages.length > 1 && (

              <div className="grid grid-cols-5 gap-3">

                {displayImages.map((img, index) => (

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



          <div className="space-y-6 lg:pr-2">

            <div className="space-y-3">

              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">

                {product.name}

              </h1>

              <p
                className="text-base text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderRichText(shortDescription) }}
              />

            </div>



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



            <div className="rounded-xl border border-border bg-white p-4">

              <div className="flex flex-wrap items-center gap-3">

                <span className="text-3xl font-bold text-primary">{formatPrice(unitPrice)}</span>

                {unitOriginalPrice && unitOriginalPrice > unitPrice && (

                  <span className="text-lg text-muted-foreground line-through">{formatPrice(unitOriginalPrice)}</span>

                )}

                {savingsPerUnit > 0 && (
                  <Badge className="bg-bronze text-white text-sm">
                    Save {formatPrice(savingsPerUnit)}
                  </Badge>
                )}

              </div>

             
            </div>

            {variantGroups.length > 0 && (
              <div className="space-y-6 rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">Options</p>
                </div>
                {variantGroups.map((group) => {
                  const selected = getSelectedOptionForGroup(group);
                  const isStyleGroup = group.kind === 'style';
                  const isHeadboardGroup = isStyleGroup && group.name.toLowerCase().includes('headboard');
                  const isStorageGroup = isStyleGroup && /storage/i.test(group.name);
                  const optionCount = group.options.length || 0;
                  const headboardGridStyle = isHeadboardGroup
                    ? {
                        gridTemplateColumns: `repeat(${Math.min(Math.max(optionCount, 1), 4)}, minmax(0, 1fr))`,
                      }
                    : undefined;
                  const groupEnabled = enabledGroups[group.name] !== false;
                  return (
                    <div key={group.key} className="space-y-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <IconVisual icon={group.icon_url} alt={group.name} className="h-10 w-10 object-contain" />
                          <div>
                            <p className="text-base font-semibold capitalize">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selected?.label
                                ? `Selected: ${selected.label.replace(/(\d+)(Drawers)/i, '$1 $2')}${
                                    selected.description ? ` (${selected.description})` : ''
                                  }`
                                : group.kind === 'fabric'
                                ? 'Selected: No color binding'
                                : isStorageGroup
                                ? 'Selected: No Storage'
                                : isHeadboardGroup
                                ? 'Selected: No Headboard'
                                : 'Select an option'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {group.kind === 'fabric' ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Optional: bind to color</label>
                          {fabricColorOptions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No fabric colors available.</p>
                          ) : (
                            <select
                              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              value={
                                selectedFabric && selectedColor ? `${selectedFabric}__${selectedColor}` : '__none__'
                              }
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value === '__none__') {
                                  setSelectedFabric('');
                                  setSelectedColor('');
                                  return;
                                }
                                const [fabricName, colorName] = value.split('__');
                                setSelectedFabric(fabricName || '');
                                setSelectedColor(colorName || '');
                              }}
                            >
                              <option value="__none__">No color binding</option>
                              {fabricColorOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                          <p className="text-xs text-muted-foreground">Choose a fabric colour; leave blank for no binding.</p>
                        </div>
                      ) : (
                        <div
                          className={
                            isStorageGroup
                              ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                              : isHeadboardGroup
                              ? 'grid gap-3'
                              : 'flex flex-wrap gap-2'
                          }
                          style={headboardGridStyle}
                        >
                          {group.options.map((option) => {
                            const isSelected = selected?.key === option.key;
                            const disabled = false;
                            const shouldShowIcon = !(group.kind === 'size' && !sizeIconsEnabled);
                            return (
                              <button
                                key={option.key}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (group.kind === 'color') {
                                    setSelectedColor((prev) => (prev === option.label ? '' : option.label));
                                    return;
                                  }
                                  if (group.kind === 'size') {
                                    setSelectedSize(option.label);
                                    return;
                                  }
                                   // Style group selection (allow toggle-off for storage)
                                   const styleName = group.styleName || group.name;
                                   const isStorageGroup = /storage/i.test(styleName);
                                   const isStyleGroup = group.kind === 'style';
                                   const isAlreadySelected = selected?.key === option.key;

                                   if (isStyleGroup && isAlreadySelected) {
                                     // Allow deselect for any style group (storage, headboard, etc.)
                                     setSelectedStyles((prev) => {
                                       const copy = { ...prev };
                                       delete copy[styleName];
                                       return copy;
                                     });
                                     // Keep group enabled so user can reselect
                                     setEnabledGroups((prev) => ({ ...prev, [styleName]: true }));
                                     return;
                                   }

                                   setSelectedStyles((prev) => ({ ...prev, [styleName]: option.key }));
                                   setEnabledGroups((prev) => ({ ...prev, [styleName]: true }));
                                 }}
                                className={
                                  group.kind === 'color'
                                    ? `relative h-12 w-12 shrink-0 rounded-md border transition ${
                                        disabled
                                          ? 'cursor-not-allowed opacity-40'
                                          : isSelected
                                          ? 'border-black ring-2 ring-black/40'
                                          : 'border-black/60 hover:border-black'
                                      }`
                                    : `relative flex ${
                                        isHeadboardGroup
                                          ? 'h-32 w-full flex-row items-center justify-start gap-4 px-3 text-left'
                                          : isStorageGroup
                                          ? 'h-28 w-full flex-col items-center justify-center px-3 text-center'
                                          : 'h-32 w-28 flex-col items-center justify-center px-2 text-center'
                                      } shrink-0 rounded-lg border bg-white transition-all ${
                                        disabled
                                          ? 'cursor-not-allowed opacity-40'
                                          : isSelected
                                          ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                                          : 'border-border hover:border-primary/60'
                                      }`
                              }
                            >
                                {group.kind === 'color' ? (
                                  <>
                                    <span
                                      className="absolute inset-0 rounded-md"
                                      style={{
                                        backgroundColor: option.color_code || '#f3f4f6',
                                        backgroundImage: option.icon_url ? `url(${option.icon_url})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                      }}
                                    />
                                    <span className="sr-only">{formatOptionLabel(option.label)}</span>
                                  </>
                                ) : (
                                  <div
                                    className={`flex ${
                                      isHeadboardGroup
                                        ? 'flex-row items-center gap-3 text-left'
                                        : 'flex-col items-center gap-1.5 text-center'
                                    } w-full`}
                                  >
                                    {shouldShowIcon && (
                                      <IconVisual
                                        icon={option.icon_url || group.icon_url}
                                        alt={option.label}
                                        className={isHeadboardGroup ? 'h-14 w-14 object-contain' : 'h-14 w-14 object-contain'}
                                      />
                                    )}
                                    <div
                                      className={
                                        isHeadboardGroup ? 'flex flex-col gap-1' : 'flex flex-col items-center gap-1 text-center'
                                      }
                                    >
                                      <p
                                        className={`text-xs font-semibold text-espresso leading-tight break-words line-clamp-3 ${
                                          isHeadboardGroup ? 'text-left' : 'text-center'
                                        }`}
                                      >
                                        {formatOptionLabel(option.label)}
                                        {option.description && ` (${option.description})`}
                                      </p>
                                      <p
                                        className={`text-[11px] text-muted-foreground leading-tight ${
                                          isHeadboardGroup ? 'text-left' : 'text-center'
                                        }`}
                                      >
                                        {Number(option.price_delta || 0) > 0
                                          ? `+${formatPrice(Number(option.price_delta || 0))}`
                                          : 'Included'}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {group.kind !== 'color' && isSelected && (
                                  <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {dimensionColumns.length > 0 && group.kind === 'size' && (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => setIsDimensionsOpen(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
                          >
                            <Ruler className="h-4 w-4" />
                            Dimensions
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {featureList.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 space-y-3">
                <p className="text-base font-semibold">Key Features</p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {featureList.map((feature, i) => (
                    <li
                      key={i}
                      dangerouslySetInnerHTML={{ __html: renderRichText(feature) }}
                    />
                  ))}
                </ul>
              </div>
            )}

            {mattresses.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">Mattress</p>
                    <p className="text-xs text-muted-foreground">Choose after picking your style</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setIsMattressOpen(true)}>
                    Upgrade mattresses
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMattressOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-primary/50 px-3 py-3 text-left transition hover:border-primary/70"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {selectedMattressDetails.length > 0
                        ? selectedMattressDetails.map((m) => m.name || 'Mattress').join(' · ')
                        : 'No mattress selected'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedMattressDetails.length > 0
                        ? formatPrice(totalMattressPrice)
                        : 'Tap to choose a mattress'}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
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

            {/* Payment chips under CTA (trust badges removed here to reduce clutter) */}
            <div className="mt-8 w-full -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 flex flex-wrap items-center justify-center gap-4">
              {paymentIcons.map((pm) => (
                <span
                  key={pm.label}
                  className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-muted-foreground bg-transparent"
                >
                  <pm.icon className="h-4 w-4 text-bronze" />
                  {pm.label}
                </span>
              ))}
            </div>



          </div>

        </div>

        {/* Info tabs full-width below purchase panel */}
        <div className="mt-10 space-y-4">
          <div className="flex flex-nowrap gap-3 overflow-x-auto px-1" role="tablist">
            {[
              { key: 'description', label: 'Description', show: Boolean(fullDescription) },
              { key: 'dimensions', label: 'Dimensions', show: adjustedDimensionTableRows.length > 0 || !!dimensionParagraph },
              { key: 'delivery', label: product?.delivery_title?.trim() || 'Delivery', show: Boolean(product?.delivery_info) },
              { key: 'returns', label: product?.returns_title?.trim() || 'Returns & Guarantee', show: Boolean(product?.returns_guarantee) },
              { key: 'faqs', label: 'FAQs', show: faqEntries.length > 0 },
              ...(Array.isArray(product?.custom_info_sections)
                ? product.custom_info_sections
                    .map((section, idx) => ({
                      key: `info-${idx}`,
                      label: (section?.title || '').trim() || `Info ${idx + 1}`,
                      show: Boolean((section?.title || section?.content || '').trim()),
                    }))
                : []),
            ]
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveInfoTab(tab.key)}
                  className={`flex-1 min-w-[140px] rounded-md border px-4 py-2 text-sm font-semibold transition text-center whitespace-nowrap ${
                    activeInfoTab === tab.key
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-muted/60 text-foreground hover:border-primary/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            {activeInfoTab === 'description' && fullDescription && (
              <div
                className="text-muted-foreground leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: renderRichText(fullDescription) }}
              />
            )}

            {activeInfoTab === 'dimensions' && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  {matchedDimensionImages.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mb-3">
                      {matchedDimensionImages.map((img, idx) => (
                        <div key={`${img.size}-${idx}`} className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">{img.size || selectedDimension || 'Dimensions'}</p>
                          <img src={img.url} alt={`${img.size || 'Dimensions'} illustration`} className="w-full h-auto max-h-64 object-contain rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                  {dimensionParagraph && (
                    <div
                      className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground leading-relaxed mb-2 whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: renderRichText(dimensionParagraph).replace(/\n/g, '<br/>') }}
                    />
                  )}
                  {dimensionColumns.length > 0 && adjustedDimensionTableRows.length > 0 ? (
                    <table className="min-w-full border border-border text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">Measurement</th>
                          {dimensionColumns.map((size) => (
                            <th
                              key={size}
                              className="border border-border px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap"
                            >
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {adjustedDimensionTableRows.map((row) => (
                          <tr key={row.measurement}>
                            <td className="border border-border px-3 py-2 font-medium text-foreground whitespace-nowrap">
                              {row.measurement}
                            </td>
                            {dimensionColumns.map((size) => (
                              <td
                                key={`${row.measurement}-${size}`}
                                className="border border-border px-3 py-2 text-muted-foreground whitespace-nowrap"
                              >
                                {dimensionValueForSize(row, size)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : !dimensionParagraph ? (
                    <p className="text-sm text-muted-foreground">Dimensions not available.</p>
                  ) : null}
                </div>
                {dimensionColumns.length > 0 && adjustedDimensionTableRows.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    All dimensions are approximate and may vary by ±5 cm (approximately ±2 inches) due to manufacturing tolerances.
                  </p>
                )}
              </div>
            )}

            {activeInfoTab === 'delivery' && product.delivery_info && (
              <div className="space-y-2 text-muted-foreground">
                <div className="space-y-1">{renderMultilineParagraphs(product.delivery_info)}</div>
              </div>
            )}

            {activeInfoTab === 'returns' && product.returns_guarantee && (
              <div className="space-y-2 text-muted-foreground">
                <div className="space-y-1">{renderMultilineParagraphs(product.returns_guarantee)}</div>
              </div>
            )}

            {activeInfoTab?.startsWith('info-') && Array.isArray(product?.custom_info_sections) && (
              <div className="space-y-2 text-muted-foreground">
                {(() => {
                  const idx = Number(activeInfoTab.replace('info-', ''));
                  const section = product.custom_info_sections?.[idx];
                  if (!section) return <p className="text-sm text-muted-foreground">No details available.</p>;
                  return renderMultilineParagraphs(section.content) || (
                    <p className="text-sm text-muted-foreground">No details available.</p>
                  );
                })()}
              </div>
            )}

            {activeInfoTab === 'faqs' && faqEntries.length > 0 && (
              <div className="space-y-4">
                {faqEntries.map((faq, i) => (
                  <div key={`${faq.question}-${i}`}>
                    <p className="font-medium text-foreground">{faq.question}</p>
                    <p
                      className="text-muted-foreground whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: renderRichText(faq.answer) }}
                    />
                  </div>
                ))}
              </div>
            )}

            {!activeInfoTab && <p className="text-sm text-muted-foreground">Select a tab to view details.</p>}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-[#F5F1EA] px-6 py-4 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-espresso">
          {reassuranceItems.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="h-5 w-5 text-bronze" />
              {item.label}
            </span>
          ))}
        </div>

        <section className="mt-12 border-t pt-10" id="reviews">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Reviews</h2>
              <p className="text-sm text-muted-foreground">Only approved reviews are shown here.</p>
            </div>
            <Button variant={showReviewForm ? 'secondary' : 'outline'} onClick={() => setShowReviewForm((prev) => !prev)}>
              {showReviewForm ? 'Close Form' : 'Write a Review'}
            </Button>
          </div>

          {showReviewForm && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">New reviews are published once approved by our team.</p>
              <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmitReview}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name (optional)</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rating</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) || 0 })}
                    />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= reviewForm.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Your review</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Tell us about the comfort, quality, delivery, or anything else."
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Button type="submit" disabled={isSubmittingReview}>
                    {isSubmittingReview ? 'Sending...' : 'Submit Review'}
                  </Button>
                  <span className="text-xs text-muted-foreground">Your review will appear here once approved.</span>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {isLoadingReviews ? (
              <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                No reviews yet. Be the first to share your thoughts.
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{review.name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{formatReviewDate(review.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </section>


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

      {isGalleryOpen && totalImages > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
          onClick={closeGallery}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/70"
              onClick={closeGallery}
              aria-label="Close image gallery"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={displayImages[selectedImage]?.url}
              alt={`${product.name} large view`}
              className="h-full w-full max-h-[80vh] rounded-lg bg-black/20 object-contain"
            />
            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/70"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-3">
                  <div className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-2">
                    {displayImages.map((_, idx) => (
                      <button
                        key={`lightbox-dot-${idx}`}
                        type="button"
                        onClick={() => setSelectedImage(idx)}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          selectedImage === idx ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex max-w-4xl items-center gap-2 rounded-xl bg-black/60 px-3 py-2 shadow-lg backdrop-blur">
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                      aria-label="Previous thumbnail"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                      {displayImages.map((img, idx) => (
                        <button
                          key={`lightbox-thumb-${idx}`}
                          type="button"
                          onClick={() => setSelectedImage(idx)}
                          className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border transition ${
                            selectedImage === idx
                              ? 'border-white ring-2 ring-white/80'
                              : 'border-white/30 hover:border-white/60'
                          }`}
                          aria-label={`View image ${idx + 1}`}
                        >
                          <img
                            src={img.url}
                            alt={`${product.name} thumb ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                      aria-label="Next thumbnail"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

{isMattressOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
              <div>
                <p className="text-2xl font-semibold">Choose a mattress</p>
                <p className="text-sm text-muted-foreground">Choose the best comfort</p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-muted"
                onClick={() => setIsMattressOpen(false)}
                aria-label="Close mattress list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
              {mattresses.slice(0, 8).map((mattress) => {
                const selectedPick = selectedMattresses.find((m) => m.id === mattress.id);
                const isSelected = Boolean(selectedPick);
                const currentPosition =
                  mattress.enable_bunk_positions && isSelected
                    ? selectedPick?.position || 'both'
                    : null;
                const isIncluded =
                  Number(mattress.price ?? 0) === 0 &&
                  Number(mattress.price_top ?? 0) === 0 &&
                  Number(mattress.price_bottom ?? 0) === 0 &&
                  Number(mattress.price_both ?? 0) === 0;

                return (
                  <button
                    key={mattress.id}
                    type="button"
                    onClick={() => {
                      setSelectedMattresses((prev) => {
                        const existing = prev.find((m) => m.id === mattress.id);
                        let next: SelectedMattressPick[];
                        if (existing) {
                          next = prev.filter((m) => m.id !== mattress.id);
                        } else {
                          let defaultPosition: 'top' | 'bottom' | 'both' | null = null;
                          if (mattress.enable_bunk_positions) {
                            const { topTaken, bottomTaken } = getBunkOccupancy(prev);
                            if (!topTaken) defaultPosition = 'top';
                            else if (!bottomTaken) defaultPosition = 'bottom';
                            else defaultPosition = 'both';
                          }
                          next = [
                            ...prev,
                            {
                              id: mattress.id,
                              position: mattress.enable_bunk_positions ? defaultPosition : null,
                            },
                          ];
                        }
                        return normalizeBunkMattressSelections(next);
                      });
                    }}
                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                      isSelected ? 'border-primary/80 bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-white'
                    }`}
                  >
                    <div className="flex gap-4">
                      <span
                        className={`mt-2 h-4 w-4 shrink-0 rounded-full border-2 ${
                          isSelected ? 'border-primary bg-primary/80 ring-2 ring-primary/30' : 'border-muted-foreground/40 bg-white'
                        }`}
                        aria-hidden="true"
                      />
                      {mattress.image_url ? (
                        <img
                          src={mattress.image_url}
                          alt={mattress.name || 'Mattress option'}
                          className="h-20 w-24 rounded-md object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="h-20 w-24 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground ring-1 ring-border">
                          No image
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                            {mattress.name || 'Mattress'}
                          </p>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-espresso whitespace-nowrap">
                              {formatPrice(Number(mattress.price ?? 0))}
                            </span>
                            <div
                              className={`text-[11px] font-semibold ${
                                isIncluded ? 'text-green-700' : 'text-primary'
                              }`}
                            >
                              {isIncluded ? 'Included' : 'Upgrade'}
                            </div>
                          </div>
                        </div>
                        {mattress.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{mattress.description}</p>
                        )}

                        {mattress.enable_bunk_positions && isSelected && (
                          <div className="mt-3">
                            <div className="text-[11px] font-semibold text-muted-foreground mb-2">Position</div>
                            <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-primary/50">
                              {(['top', 'bottom', 'both'] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 text-sm transition ${
                                    currentPosition === pos
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'bg-white text-foreground hover:bg-primary/5'
                                  } ${pos === 'top' ? 'rounded-l-lg' : pos === 'both' ? 'rounded-r-lg' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMattresses((prev) => {
                                      const next = prev.map((m) =>
                                        m.id === mattress.id ? { ...m, position: pos } : m
                                      );
                                      return normalizeBunkMattressSelections(next);
                                    });
                                  }}
                                >
                                  <span className="flex items-center gap-2 capitalize">
                                    <span
                                      className={`h-2.5 w-2.5 rounded-full border ${
                                        currentPosition === pos
                                          ? 'border-primary bg-primary/80'
                                          : 'border-muted-foreground/60 bg-white'
                                      }`}
                                    />
                                    {pos === 'top' ? 'Top' : pos === 'bottom' ? 'Bottom' : 'Both'}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatPrice(priceForPosition(mattress, pos))}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              <Link
                to="/category/mattresses"
                className="flex items-center justify-center rounded-lg border border-dashed border-primary/60 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition"
              >
                View all mattresses
              </Link>
            </div>

            <div className="border-t border-border px-5 py-4 bg-white">
              <Button className="w-full" onClick={() => setIsMattressOpen(false)}>
                Apply selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDimensionsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
              <div>
                <p className="text-2xl font-semibold">Dimensions</p>
                {selectedDimension && (
                  <p className="text-sm text-muted-foreground">Showing: {selectedDimension}</p>
                )}
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-muted"
                onClick={() => setIsDimensionsOpen(false)}
                aria-label="Close dimensions"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto px-6 py-5">
              {dimensionColumns.length > 0 && (
                <div className="space-y-3">
                  <p className="text-base font-semibold">Select Size</p>
                  <div className="flex flex-wrap gap-2">
                    {dimensionColumns.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedDimension(size)}
                        className={`rounded-md border px-3 py-2 text-sm transition ${
                          selectedDimension === size
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-border bg-white text-espresso hover:border-primary/60'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs md:text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={includeDimensions}
                      onChange={(e) => setIncludeDimensions(e.target.checked)}
                    />
                    Send selected size with order
                  </label>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {matchedDimensionImages.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {matchedDimensionImages.map((img, idx) => (
                      <div key={`${img.size}-${idx}`} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          {img.size || selectedDimension || 'Dimensions'}
                        </p>
                        <img
                          src={img.url}
                          alt={`${img.size || 'Dimensions'} illustration`}
                          className="w-full h-auto max-h-72 object-contain rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {selectedDimension && adjustedDimensionTableRows.length > 0 ? (
                  <div className="divide-y rounded-lg border">
                    {adjustedDimensionTableRows.map((row) => (
                      <div
                        key={`${row.measurement}-${selectedDimension}`}
                        className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-3"
                      >
                        <span className="font-medium text-foreground sm:col-span-1">{row.measurement}</span>
                        <span className="text-sm text-muted-foreground sm:col-span-2">
                          {row.values?.[selectedDimension] || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a size to see detailed measurements.</p>
                )}
                <p className="text-xs text-muted-foreground">All dimensions are approximate and may vary by ±5 cm (approximately ±2 inches) due to manufacturing tolerances.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};


export default ProductPage;
