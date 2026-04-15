import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';

import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';

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
import { formatWholePrice } from '@/lib/pricing';

import { Badge } from '@/components/ui/badge';

import {

  Accordion,

  AccordionContent,

  AccordionItem,

  AccordionTrigger,

} from '@/components/ui/accordion';


import Header from '@/components/Header';

import Footer from '@/components/Footer';

import ProductCard from '@/components/ProductCard';

import { apiGet, apiPost } from '@/lib/api';
import { Category, Collection, Product, ProductDimensionRow, Review, ProductMattress, MattressOptionPrice } from '@/lib/types';
import { useCart } from '@/context/CartContext';

import { toast } from 'sonner';



type NormalizedStyleOption = {

  label: string;

  description?: string;

  icon_url?: string;

  price_delta?: number;

  size?: string;

  sizes?: string[];

  use_size_pricing?: boolean;

  size_price_overrides?: Record<string, number>;

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

  price: number;

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

const SIZE_DISPLAY_ORDER = [
  '2ft6 Small Single',
  '3ft Single',
  '4ft Small Double',
  '4ft6 Double',
  '5ft King',
  '6ft Super King',
] as const;

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



const formatPrice = (value: number): string => formatWholePrice(value);
const formatAddonPrice = (value: number): string => `+${formatWholePrice(value)}`;

const normalizeSizePriceOverrides = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, rawValue]) => {
    const sizeName = String(key || '').trim();
    if (!sizeName) return acc;
    const parsed =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string' && rawValue.trim() !== ''
        ? Number(rawValue)
        : Number.NaN;
    if (Number.isFinite(parsed)) {
      acc[sizeName] = parsed;
    }
    return acc;
  }, {});
};

const normalizeStoredSizePrice = (productBasePrice: number, storedValue?: number): number => {
  const base = Number.isFinite(productBasePrice) ? Number(productBasePrice) : 0;
  const raw = Number(storedValue ?? 0);
  if (!Number.isFinite(raw)) return base;
  return raw;
};

const renderMultilineParagraphs = (value?: string, emphasizeFirst = true) => {
  if (!value) return null;
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, idx) => (
      <p
        key={`${paragraph}-${idx}`}
        className={`${emphasizeFirst && idx === 0 ? 'font-semibold ' : ''}whitespace-pre-line`}
        dangerouslySetInnerHTML={{ __html: renderRichText(paragraph).replace(/\n/g, '<br/>') }}
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

    return { id: `size-${index}`, label: 'Size', price: 0, description, raw: rawSize };

  }



  // Supports examples like:

  // "Small Double (+90)", "King +115", "Super King|140"

  const pipeMatch = raw.match(/^(.*?)\s*\|\s*(-?\d+(\.\d+)?)$/);

  if (pipeMatch) {

    return {

      id: `size-${index}`,

      label: pipeMatch[1].trim() || raw,

      price: Number(pipeMatch[2] || 0),

      description,

      raw: rawSize,

    };

  }



  const plusMatch = raw.match(/^(.*?)\s*(?:\(\s*)?\+\s*(?:£)?\s*(\d+(?:\.\d+)?)\s*(?:\)\s*)?$/i);

  if (plusMatch) {

    return {

      id: `size-${index}`,

      label: plusMatch[1].trim() || raw,

      price: Number(plusMatch[2] || 0),

      description,

      raw: rawSize,

    };

  }



  const fallbackDelta = Number.isFinite(explicitDelta) ? Number(explicitDelta) : 0;

  return { id: `size-${index}`, label: raw, price: fallbackDelta, description, raw: rawSize };

};

const formatOptionLabel = (label: string) => {
  let res = (label || '').trim();
  // Convert slug-like labels to readable text
  res = res.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = res.toLowerCase();
  if (lower.includes('matching') && lower.includes('fabric') && lower.includes('button')) {
    res = 'Fabric buttons';
  } else if (lower.includes('crystal') && lower.includes('diamond') && lower.includes('button')) {
    res = 'Crystal buttons';
  }
  return res;
};



const normalizeStyleOptions = (options: unknown): NormalizedStyleOption[] => {

  if (!Array.isArray(options)) return [];

  return options

    .map((option) => {

      if (typeof option === 'string') {

        const label = option.trim();origin

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

        const price_delta =
          typeof rawDelta === 'number'
            ? rawDelta
            : typeof rawDelta === 'string' && rawDelta.trim() !== ''
            ? Number(rawDelta)
            : undefined;

        const rawSize = (option as { size?: unknown }).size;

        const size = typeof rawSize === 'string' ? rawSize.trim() : '';

        const sizes = Array.isArray((option as { sizes?: unknown }).sizes)

          ? ((option as { sizes?: unknown }).sizes as unknown[])

              .map((s) => (typeof s === 'string' ? s.trim() : ''))

              .filter(Boolean)

          : [];
        const size_price_overrides = normalizeSizePriceOverrides(
          (option as { size_price_overrides?: unknown }).size_price_overrides
        );
        const use_size_pricing =
          (option as { use_size_pricing?: unknown }).use_size_pricing === true ||
          Object.keys(size_price_overrides).length > 0;

        return { label, description, icon_url, price_delta, size, sizes, use_size_pricing, size_price_overrides };

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

// Normalize size labels to a canonical form for reliable matching.
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
    'kingsize': '5ft King',
    'king size': '5ft King',

    '6ft': '6ft Super King',
    '6ftsuperking': '6ft Super King',
    'superking': '6ft Super King',
    'super king': '6ft Super King',
  };

  if (canonicalMap[key]) return canonicalMap[key];
  return value.replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' ').trim();
};

const getSizeDisplayOrderIndex = (raw?: string): number => {
  const normalized = normalizeSizeName(raw);
  const index = SIZE_DISPLAY_ORDER.findIndex((size) => size === normalized);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const sortParsedSizeOptions = (sizes: ParsedSizeOption[]): ParsedSizeOption[] =>
  [...sizes].sort((a, b) => {
    const orderDiff = getSizeDisplayOrderIndex(a.label) - getSizeDisplayOrderIndex(b.label);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
  });

const getLowestPricedSizeOption = (sizes: ParsedSizeOption[]): ParsedSizeOption | undefined =>
  [...sizes].sort((a, b) => {
    const priceDiff = Number(a.price || 0) - Number(b.price || 0);
    if (priceDiff !== 0) return priceDiff;
    return getSizeDisplayOrderIndex(a.label) - getSizeDisplayOrderIndex(b.label);
  })[0];
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



const resolveMediaUrl = (url?: string) => {
  if (!url) return url;
  const trimmed = url.trim();
  if (/^(data|blob):/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    "https://reve-backend.onrender.com/api";
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, "");
  const normalizedPath = trimmed.startsWith("/media/")
    ? trimmed
    : `/media/${trimmed.replace(/^\/+/, "")}`;
  return `${backendBase}${normalizedPath}`;
};

const IconVisual = ({ icon, alt, className }: { icon?: string; alt: string; className: string }) => {
  if (isInlineSvgMarkup(icon)) {
    return <img src={svgMarkupToDataUrl((icon || '').trim())} alt={alt} className={className} />;
  }

  const resolved = resolveMediaUrl(icon);
  if (resolved) {
    return <img src={resolved} alt={alt} className={className} />;
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const selectForBedSlug = searchParams.get('select-for-bed') || '';
  const linkedBedSize = searchParams.get('bed-size') || '';
  const routePreviewProduct = (location.state as { previewProduct?: Product } | null)?.previewProduct;
  const hasRoutePreviewProduct = routePreviewProduct?.slug === slug;
  
  const [product, setProduct] = useState<Product | null>(() =>
    hasRoutePreviewProduct ? routePreviewProduct || null : null
  );

  const [isLoading, setIsLoading] = useState(!hasRoutePreviewProduct);

  const [category, setCategory] = useState<Category | null>(null);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [seriesCollection, setSeriesCollection] = useState<Collection | null>(null);
  const [seriesProducts, setSeriesProducts] = useState<Product[]>([]);



  const { addItem } = useCart();



  const [selectedImage, setSelectedImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState('');

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<Record<string, string>>({});
type BunkPosition = 'top' | 'bottom' | 'both';
type SelectedMattressPick = { id: number; position?: BunkPosition | null };
type MattressDetailView = {
  id: number;
  title: string;
  description?: string;
  features?: string;
  images: { url: string; alt: string }[];
  price: number;
  originalPrice?: number;
};
  const [selectedMattresses, setSelectedMattresses] = useState<SelectedMattressPick[]>([]);
  const [externalMattress, setExternalMattress] = useState<ProductMattress | null>(null);
  const [mattressOptions, setMattressOptions] = useState<ProductMattress[]>([]);
  const [hasUserChangedMattressSelection, setHasUserChangedMattressSelection] = useState(false);
  const [hasUserChangedStyleSelections, setHasUserChangedStyleSelections] = useState(false);
  const [mattressDetail, setMattressDetail] = useState<MattressDetailView | null>(null);
  const [isMattressDetailOpen, setIsMattressDetailOpen] = useState(false);
  const [isLoadingMattressDetail, setIsLoadingMattressDetail] = useState(false);
  const [activeMattressDetailImage, setActiveMattressDetailImage] = useState(0);

  useEffect(() => {
    const seoTitle = product?.meta_title || (product?.name ? `${product.name} | Reve Living` : 'Reve Living');
    const seoDescription =
      product?.meta_description ||
      product?.short_description ||
      'Explore handcrafted furniture and made-to-order pieces from Reve Living.';

    document.title = seoTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', seoDescription);
  }, [product?.meta_description, product?.meta_title, product?.name, product?.short_description]);
  const [isMattressOpen, setIsMattressOpen] = useState(false);
  const [showAllMattresses, setShowAllMattresses] = useState(true);
  const [selectedFabric, setSelectedFabric] = useState('');
  const [previewFabric, setPreviewFabric] = useState('');
  const [enabledGroups, setEnabledGroups] = useState<Record<string, boolean>>({});
  const [activeVariantGroupKey, setActiveVariantGroupKey] = useState('');
  const [activeInfoTab, setActiveInfoTab] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [assemblyServiceSelected, setAssemblyServiceSelected] = useState(false);
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
  const hasAutoSelectedIncludedMattress = useRef(false);
  const preloadedAssets = useRef(new Set<string>());

  // Reset mattress selection/autoselect state when navigating to a different product
  useEffect(() => {
    setSelectedMattresses([]);
    setExternalMattress(null);
    setHasUserChangedMattressSelection(false);
    setPreviewFabric('');
    setAssemblyServiceSelected(false);
    hasAutoSelectedIncludedMattress.current = false;
  }, [product?.id]);

  const isBunkOrDivanCategory = useMemo(() => {
    const slug = (product?.category_slug || '').toLowerCase();
    const subSlug = (product?.subcategory_slug || '').toLowerCase();
    const name = (product?.name || '').toLowerCase();
    const catName = (product?.category_name || '').toLowerCase();
    const subName = (product?.subcategory_name || '').toLowerCase();
    const match = /bunk|divan/;
    return (
      match.test(slug) ||
      match.test(subSlug) ||
      match.test(name) ||
      match.test(catName) ||
      match.test(subName)
    );
  }, [product?.category_slug, product?.subcategory_slug, product?.name, product?.category_name, product?.subcategory_name]);
  const showDimensionsTable = (product as Product | undefined)?.show_dimensions_table !== false;

  // Exclude placeholder mattresses globally.
  const EXCLUDED_MATTRESS_NAMES = useMemo(
    () => ['winwood mattress', 'kingsize mattress'],
    []
  );
  const filterOutExcludedMattresses = useCallback(
    (list: ProductMattress[]) =>
      list.filter((m) => {
        const name = (m?.name || '').trim().toLowerCase();
        return name && !EXCLUDED_MATTRESS_NAMES.includes(name);
      }),
    [EXCLUDED_MATTRESS_NAMES]
  );

  const isIncludedMattress = useCallback(
    (m: ProductMattress | null | undefined, sizeLabel?: string) => {
      if (!m) return false;
      const normSize = normalizeSizeName(sizeLabel || selectedSize || "");
      const matchedSize = (m.prices || []).find(
        (p) => normalizeSizeName(p.size_label).toLowerCase() === normSize.toLowerCase()
      );
      const toZero = (val: number | null | undefined) =>
        val === null || val === undefined ? 0 : Number(val);
      const base = toZero(m.price);
      const top = toZero(m.price_top);
      const bottom = toZero(m.price_bottom);
      const sizePrice = matchedSize ? toZero(matchedSize.price) : base;
      const sizeTop = matchedSize ? toZero(matchedSize.price_top) : top;
      const sizeBottom = matchedSize ? toZero(matchedSize.price_bottom) : bottom;
      // Included if all relevant prices for this size are zero.
      const bunkFree = m.enable_bunk_positions
        ? sizeTop === 0 && sizeBottom === 0
        : true;
      return sizePrice === 0 && bunkFree;
    },
    [selectedSize]
  );

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

  const loadSeriesProducts = useCallback(
    async (currentProduct: Product | null) => {
      if (!currentProduct?.id) {
        setSeriesCollection(null);
        setSeriesProducts([]);
        return;
      }

      try {
        const collectionsRes = await apiGet<Collection[] | { results?: Collection[] }>('/collections/');
        const collections = Array.isArray(collectionsRes)
          ? collectionsRes
          : Array.isArray((collectionsRes as { results?: Collection[] }).results)
          ? ((collectionsRes as { results: Collection[] }).results)
          : [];

        const matchedCollection = collections.find((collection) => {
          const productIds = (collection.products || []).concat(
            (collection.products_data || []).map((p) => p.id)
          );
          return productIds.includes(currentProduct.id);
        });

        if (matchedCollection) {
          setSeriesCollection(matchedCollection);
          const others = (matchedCollection.products_data || []).filter(
            (p) => p.id !== currentProduct.id
          );
          setSeriesProducts(others.slice(0, 3));
        } else {
          setSeriesCollection(null);
          setSeriesProducts([]);
        }
      } catch {
        setSeriesCollection(null);
        setSeriesProducts([]);
      }
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      const previewProduct = hasRoutePreviewProduct ? routePreviewProduct || null : null;

      setIsLoading(!previewProduct);

      if (!slug) {

        setProduct(null);
        await loadSeriesProducts(null);

        setIsLoading(false);

        return;

      }

      try {
        // Clear previous product to prevent stale options flashing while new product loads
        setProduct(previewProduct);
        setCategory(null);
        setSelectedImage(0);
        setSelectedSize('');
        setSelectedColor('');
        setSelectedStyles({});
        setSelectedFabric('');
        setSelectedMattresses([]);
        setExternalMattress(null);
        setActiveVariantGroupKey('');
        setHasUserChangedStyleSelections(false);
        hasAutoSelectedIncludedMattress.current = false;
        setEnabledGroups({});
        hasAutoSelectedIncludedMattress.current = false;

        const productRes = await apiGet<Product[]>(`/products/?slug=${slug}`);

        const normalizedProducts = Array.isArray(productRes)

          ? productRes

          : Array.isArray((productRes as unknown as { results?: Product[] })?.results)

          ? (productRes as unknown as { results: Product[] }).results

          : [];

        const fetched = normalizedProducts[0] || null;

        setProduct(fetched);
        void loadSeriesProducts(fetched);
        setSelectedImage(0);
        setIsGalleryOpen(false);
        setIsZoomed(false);
        setActiveInfoTab(null);
        setSelectedMattresses([]);
        hasAutoSelectedIncludedMattress.current = false;
        
        // Pre-select mattress if coming from a mattress selection flow
        const preSelectMattressId = searchParams.get('pre-select-mattress');
        if (preSelectMattressId && fetched?.mattresses) {
          const targetId = Number(preSelectMattressId);
          const mattressToSelect =
            fetched.mattresses.find((m) => Number(m.id) === targetId) ||
            fetched.mattresses.find((m) => Number(m.source_product) === targetId);
          if (mattressToSelect?.id) {
            setSelectedMattresses(
              normalizeBunkMattressSelections([
                {
                  id: mattressToSelect.id,
                  position: mattressToSelect.enable_bunk_positions ? 'top' : null,
                },
              ])
            );
          }
        }
        
        if (fetched?.id) {
          fetchReviews(fetched.id);
        }

        // Don't auto-select mattresses - let the customer choose

        if (fetched?.category_slug) {
          void (async () => {
            try {
              const categoryRes = await apiGet<Category[]>(`/categories/?slug=${fetched.category_slug}`);
              setCategory(categoryRes[0] || null);

              const adminSelectedSuggestions = Array.isArray(fetched.suggested_products_data)
                ? fetched.suggested_products_data.filter((p) => p.id !== fetched.id).slice(0, 4)
                : [];

              if (adminSelectedSuggestions.length > 0) {
                setRelatedProducts(adminSelectedSuggestions);
                return;
              }

              const relatedRes = await apiGet<Product[]>(`/products/?category=${fetched.category_slug}`);
              setRelatedProducts(relatedRes.filter((p) => p.id !== fetched.id).slice(0, 4));
            } catch {
              setCategory(null);
              setRelatedProducts([]);
            }
          })();
        } else {
          setCategory(null);
          setRelatedProducts([]);
        }

      if (fetched?.sizes?.length) {
        const parsedSizes = sortParsedSizeOptions(
          fetched.sizes.map((size, index) =>
            parseSizeOption(
              size.name,
              index,
              size.description || '',
              normalizeStoredSizePrice(Number(fetched.price ?? 0), Number(size.price_delta ?? 0))
            )
          )
        );
        const normalizedLinkedSize = (linkedBedSize || '').trim().toLowerCase();
        const matchedSize = normalizedLinkedSize
          ? parsedSizes.find((opt) => opt.label.trim().toLowerCase() === normalizedLinkedSize)
          : null;
        setSelectedSize((matchedSize || getLowestPricedSizeOption(parsedSizes) || parsedSizes[0]).label);
      }

        const firstFabricWithColors = (fetched?.fabrics || []).find((f) => (f.colors || []).length > 0);
        if (firstFabricWithColors) {
          setSelectedFabric('');
          setPreviewFabric('');
          setSelectedColor('');
        } else if (fetched?.colors?.length) {
          setSelectedColor('');
          setSelectedFabric('');
          setPreviewFabric('');
        } else {
          setSelectedFabric('');
          setPreviewFabric('');
        }

        const initialStyles: Record<string, string> = {};

        const nextEnabled: Record<string, boolean> = {};

        (fetched?.styles || []).forEach((styleGroup) => {
          const normalized = normalizeStyleOptions(styleGroup.options);
          const freeOption =
            normalized.find(
              (o) => {
                const numericDelta =
                  typeof o.price_delta === 'number' && Number.isFinite(o.price_delta)
                    ? Number(o.price_delta)
                    : undefined;
                const resolvedDelta =
                  numericDelta !== undefined
                    ? numericDelta
                    : parsePriceDeltaFromText(o.label, o.description || '');
                return resolvedDelta === 0;
              }
            ) || undefined;
          if (freeOption) {
            initialStyles[styleGroup.name] = freeOption.label;
            nextEnabled[styleGroup.name] = true;
          } else {
            nextEnabled[styleGroup.name] = false;
          }
        });
        setSelectedStyles(initialStyles);
        setEnabledGroups(nextEnabled);
        setHasUserChangedStyleSelections(false);
        setIsLoading(false);

      } catch {

        setProduct(null);
        await loadSeriesProducts(null);

        setIsLoading(false);

      }

    };

    load();

  }, [slug, loadSeriesProducts, hasRoutePreviewProduct, routePreviewProduct]);



  // Keep mattress options aligned with the selected bed size (global options already sized).
  useEffect(() => {
    const baseMattresses: ProductMattress[] = Array.isArray(product?.mattresses)
      ? (product.mattresses as ProductMattress[])
      : [];
    const filteredBase = filterOutExcludedMattresses(baseMattresses).filter((m) => {
      const catIds = (m as any).categories as number[] | undefined;
      const subIds = (m as any).subcategories as number[] | undefined;
      const productCatId = (product as any)?.category;
      const productSubId = (product as any)?.subcategory;
      // Only show mattresses scoped to bed categories; if none set, allow all.
      const allowAll = (!catIds || catIds.length === 0) && (!subIds || subIds.length === 0);
      if (allowAll) return true;
      if (catIds && catIds.length > 0 && productCatId) {
        if (catIds.includes(productCatId)) return true;
      }
      if (subIds && subIds.length > 0 && productSubId) {
        if (subIds.includes(productSubId)) return true;
      }
      return false;
    });
    const sorted = [...filteredBase].sort((a, b) => {
      const aOrder = Number(a.sort_order ?? 0);
      const bOrder = Number(b.sort_order ?? 0);
      const aPriority = aOrder > 0 ? 0 : 1;
      const bPriority = bOrder > 0 ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    setMattressOptions(sorted);
  }, [product?.mattresses, filterOutExcludedMattresses, product?.category]);


  const productImages = product?.images || [];
  const activeStyleSelections = useMemo(
    () =>
      Object.entries(selectedStyles)
        .filter(([styleName, option]) => enabledGroups[styleName] !== false && Boolean(option))
        .map(([, option]) => option.toLowerCase()),
    [enabledGroups, selectedStyles]
  );
  const displayImages = useMemo(() => {
    let resolved = productImages;

    if (selectedColor) {
      const colorMatched = resolved.filter((img) =>
        (img as ProductImage).color_name
          ? (img as ProductImage).color_name!.toLowerCase() === selectedColor.toLowerCase()
          : false
      );
      if (colorMatched.length > 0) {
        resolved = colorMatched;
      }
    }

    if (activeStyleSelections.length > 0) {
      const styleMatched = resolved.filter((img) =>
        (img as ProductImage).style_name
          ? activeStyleSelections.includes((img as ProductImage).style_name!.toLowerCase())
          : false
      );
      if (styleMatched.length > 0) {
        resolved = styleMatched;
      }
    }

    return resolved;
  }, [activeStyleSelections, productImages, selectedColor]);
  const totalImages = displayImages.length;
  const hasDisplayImages = totalImages > 0;

  useEffect(() => {
    if (selectedImage >= totalImages) {
      setSelectedImage(totalImages > 0 ? 0 : 0);
    }
  }, [totalImages, selectedImage]);

  const productSizes = product?.sizes || [];
  const sizeIconsEnabled = product?.show_size_icons !== false;

  const activeFabricForColors = previewFabric || selectedFabric;
  const selectedFabricObj = (product?.fabrics || []).find((f) => f.name === activeFabricForColors);

  const fabricColors = selectedFabricObj?.colors || [];

  const availableColors =
    product?.fabrics?.length && activeFabricForColors
      ? fabricColors
      : product?.fabrics?.length
      ? []
      : product?.colors || [];

  const displayColors = useMemo(() => {
    const list = availableColors || [];
    const withImages = list.filter((c) => c.image_url);
    return withImages.length > 0 ? withImages : list;
  }, [availableColors]);

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
    // Keep selections stable while browsing; if the current color no longer exists, pick a sensible fallback.
    const names = new Set(displayColors.map((c) => c.name).concat(availableColors.map((c) => c.name)));
    if (!previewFabric && selectedColor && !names.has(selectedColor)) {
      setSelectedColor(displayColors[0]?.name || availableColors[0]?.name || '');
    }
  }, [availableColors, displayColors, previewFabric, selectedColor]);

  // Preload color and fabric swatch images so UI shows the final image immediately
  useEffect(() => {
    const urls: string[] = [];
    (product?.colors || []).forEach((c) => {
      const resolved = resolveMediaUrl(c.image_url);
      if (resolved) urls.push(resolved);
    });
    (product?.fabrics || []).forEach((fabric) =>
      (fabric.colors || []).forEach((c) => {
        const resolved = resolveMediaUrl(c.image_url);
        if (resolved) urls.push(resolved);
      })
    );
    urls.forEach((url) => {
      if (!url || preloadedAssets.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedAssets.current.add(url);
    });
  }, [product?.colors, product?.fabrics]);

  // Also preload current display colors (handles fabric switches promptly)
  useEffect(() => {
    const urls = displayColors
      .map((c) => resolveMediaUrl(c.image_url))
      .filter((u): u is string => Boolean(u));
    urls.forEach((url) => {
      if (preloadedAssets.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedAssets.current.add(url);
    });
  }, [displayColors]);

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

  const sizeOptions = sortParsedSizeOptions(
    productSizes.map((size, index) =>
      parseSizeOption(
        size.name,
        index,
        size.description || '',
        normalizeStoredSizePrice(Number(product?.price ?? 0), Number(size.price_delta ?? 0))
      )
    )
  );

  const resolvedSelectedSize =
    selectedSize || getLowestPricedSizeOption(sizeOptions)?.label || sizeOptions[0]?.label || '';



  const styleVariantGroups = useMemo<VariantGroup[]>(() => {

    const currentSize = resolvedSelectedSize;

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
            price_delta: (() => {
              const defaultDelta =
                typeof option.price_delta === 'number'
                  ? option.price_delta
                  : Number(option.price_delta || 0) || parsePriceDeltaFromText(option.label, option.description);
              const overrides = normalizeSizePriceOverrides(option.size_price_overrides);
              if (option.use_size_pricing && currentSize) {
                const matchedEntry = Object.entries(overrides).find(
                  ([sizeName]) => normalizeSizeName(sizeName).toLowerCase() === normalizeSizeName(currentSize).toLowerCase()
                );
                if (matchedEntry) return matchedEntry[1];
                return 0;
              }
              return defaultDelta;
            })(),

          }))

          .filter((opt) => {

            const sizes = opt.sizes && opt.sizes.length ? opt.sizes : opt.size ? [opt.size] : [];

            if (!currentSize || sizes.length === 0) return true;

            const normalizedCurrentSize = normalizeSizeName(currentSize).toLowerCase();
            return sizes.some(
              (sizeName) => normalizeSizeName(sizeName).toLowerCase() === normalizedCurrentSize
            );

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

  }, [product?.styles, resolvedSelectedSize]);



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
          icon_url: resolveMediaUrl(color.image_url),
          // Fallback texture placeholder to avoid black flash while image streams in.
          placeholder: color.hex_code || '#f3f4f6',

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

          price_delta: size.price,

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

        if (!enabled) {
          return;
        }

      });

      return next;

    });

  }, [selectedSize, styleVariantGroups, enabledGroups]);



  const activeSizeOption =
    sizeOptions.find((size) => size.label === resolvedSelectedSize) ||
    getLowestPricedSizeOption(sizeOptions) ||
    sizeOptions[0];

  const selectedSizeBasePrice =
    sizeOptions.length > 0
      ? Number(activeSizeOption?.price ?? 0)
      : Number(product?.price ?? 0);



  const getSelectedOptionForGroup = (group: VariantGroup): VariantOption | undefined => {

    if (group.kind === 'color') {

      return group.options.find((option) => option.label === selectedColor);

    }

    if (group.kind === 'fabric') {
      return group.options.find((option) => option.label === selectedFabric);
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



  const stylePriceDelta = hasUserChangedStyleSelections
    ? styleVariantGroups.reduce((sum, group) => {
        const selected = getSelectedOptionForGroup(group);
        if (!enabledGroups[group.name]) return sum;
        const delta = Number(selected?.price_delta ?? 0);
        return sum + (Number.isFinite(delta) ? delta : 0);
      }, 0)
    : 0;



  const wingbackSelected = styleVariantGroups.some((group) => {
    const selected = getSelectedOptionForGroup(group);
    return /wingback/i.test(`${selected?.label || ''} ${selected?.description || ''}`);
  });

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
  const dimensionNote =
    (product as Product | undefined)?.dimension_note?.trim() ||
    'All dimensions are approximate and may vary by +/-2 cm (approximately +/-1 inches) due to manufacturing tolerances.';
  const dimensionImages = (product as Product | undefined)?.dimension_images || [];
  const matchedDimensionImages = useMemo(() => {
    if (!Array.isArray(dimensionImages)) return [];
    if (!selectedDimension) return dimensionImages;
    const filtered = dimensionImages.filter(
      (img) => (img.size || '').toLowerCase().trim() === selectedDimension.toLowerCase().trim()
    );
    return filtered.length > 0 ? filtered : dimensionImages;
  }, [dimensionImages, selectedDimension]);

  const normalizeId = (val: number | string | null | undefined) => Number(val);

  const mattressMap = useMemo(() => {
    const map: Record<number, ProductMattress> = {};
    (mattressOptions || []).forEach((m) => {
      if (m?.id !== undefined && m?.id !== null) {
        const idNum = normalizeId(m.id);
        if (!Number.isNaN(idNum)) map[idNum] = m;
      }
    });
    if (externalMattress?.id) {
      const idNum = normalizeId(externalMattress.id);
      if (!Number.isNaN(idNum)) map[idNum] = externalMattress;
    }
    return map;
  }, [mattressOptions, externalMattress]);

  const mattresses: ProductMattress[] = useMemo(() => {
    const map = new Map<number, ProductMattress>();
    filterOutExcludedMattresses(mattressOptions || []).forEach((m) => {
      if (m?.id !== undefined && m?.id !== null) {
        const idNum = normalizeId(m.id);
        if (!Number.isNaN(idNum)) map.set(idNum, m);
      }
    });
    if (externalMattress?.id && !map.has(externalMattress.id)) {
      const idNum = normalizeId(externalMattress.id);
      if (!Number.isNaN(idNum)) map.set(idNum, externalMattress);
    }
    return Array.from(map.values());
  }, [mattressOptions, externalMattress, filterOutExcludedMattresses]);

  // Allow auto-select to rerun when the mattresses list refreshes
  useEffect(() => {
    hasAutoSelectedIncludedMattress.current = false;
  }, [mattresses.length]);

  useEffect(() => {
    if (!mattresses.length) return;
    setSelectedMattresses((prev) =>
      prev.filter((sel) => mattresses.some((m) => normalizeId(m.id) === normalizeId(sel.id)))
    );
  }, [mattresses]);
  const getMattressById = (id: number) => mattressMap[normalizeId(id)] || null;
  const openMattressDetails = useCallback(async (mattress: ProductMattress) => {
    setMattressDetail(null);
    setActiveMattressDetailImage(0);

    const fallbackDetail: MattressDetailView = {
      id: Number(mattress.id),
      title: mattress.name || 'Mattress',
      description: mattress.description || 'More details for this mattress will be available soon.',
      features: mattress.features || '',
      images: resolveMediaUrl(mattress.image_url)
        ? [{ url: resolveMediaUrl(mattress.image_url) as string, alt: mattress.name || 'Mattress' }]
        : [],
      price: Number(mattress.price ?? 0),
      originalPrice:
        mattress.original_price !== undefined && mattress.original_price !== null
          ? Number(mattress.original_price)
          : undefined,
    };

    setMattressDetail(fallbackDetail);
    setIsMattressDetailOpen(true);
    setIsLoadingMattressDetail(true);

    const targetId = Number(mattress.source_product);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setIsLoadingMattressDetail(false);
      return;
    }

    try {
      const res = await apiGet<Product | Product[]>(`/products/${targetId}/`);
      const productData = Array.isArray(res) ? res[0] : res;
      if (!productData?.id) {
        setIsLoadingMattressDetail(false);
        return;
      }

      setMattressDetail({
        id: productData.id,
        title: productData.name || fallbackDetail.title,
        description:
          productData.short_description ||
          productData.description ||
          fallbackDetail.description,
        features:
          (mattress.features || '').trim() ||
          (Array.isArray(productData.features) ? productData.features.join('\n') : ''),
        images: (productData.images || [])
          .map((img, idx) => ({
            url: resolveMediaUrl(img.url) || '',
            alt: img.alt_text || `${productData.name || 'Mattress'} ${idx + 1}`,
          }))
          .filter((img) => Boolean(img.url)),
        price: Number(productData.price ?? fallbackDetail.price ?? 0),
        originalPrice:
          productData.original_price !== undefined && productData.original_price !== null
            ? Number(productData.original_price)
            : fallbackDetail.originalPrice,
      });
    } catch {
      setMattressDetail(fallbackDetail);
    } finally {
      setIsLoadingMattressDetail(false);
    }
  }, []);
  const priceForPosition = (m: ProductMattress | null, pos: BunkPosition | null, sizeLabel?: string) => {
    if (!m) return 0;
    const normalized = normalizeSizeName(sizeLabel || '');
    const matchedPrice = (m.prices || []).find(
      (p) => normalizeSizeName(p.size_label).toLowerCase() === normalized.toLowerCase()
    );
    const pick = (field: keyof MattressOptionPrice | keyof ProductMattress, fallback?: number | null) => {
      const fromSize = matchedPrice ? (matchedPrice as any)[field] : undefined;
      const fromBase = (m as any)[field];
      const val = fromSize ?? fromBase ?? fallback;
      return val !== undefined && val !== null ? Number(val) : fallback ?? 0;
    };
    const base = pick("price", 0);
    const top = pick("price_top", base);
    const bottom = pick("price_bottom", base);
    const defaultBoth = Number.isFinite(base) ? base * 2 : top + bottom;
    const both = pick("price_both", defaultBoth);
    if (!m.enable_bunk_positions || !pos) return base;
    if (pos === 'top') return top;
    if (pos === 'bottom') return bottom;
    if (pos === 'both') return both;
    return base;
  };

  const selectedMattressDetails = selectedMattresses
    .map((sel) => {
      const m = getMattressById(sel.id);
      if (!m) return null;
      const position = m.enable_bunk_positions ? sel.position || 'top' : null;
      return {
        ...m,
        position,
        price_value: priceForPosition(m, position, selectedSize),
      };
    })
    .filter(Boolean) as Array<ProductMattress & { position: BunkPosition | null; price_value: number }>;
  const chargeableMattressDetails = hasUserChangedMattressSelection ? selectedMattressDetails : [];
  const totalMattressPrice = chargeableMattressDetails.reduce(
    (sum, m) => sum + (Number.isFinite(m.price_value) ? m.price_value : 0),
    0
  );
  const primaryMattress = selectedMattressDetails[0] || null;

  const basePrice = Number(product?.price ?? 0);

  const baseOriginalPrice =

    product?.original_price !== undefined && product?.original_price !== null

      ? Number(product.original_price)

      : undefined;

  const assemblyServicePrice =
    product?.assembly_service_enabled ? Number(product?.assembly_service_price || 0) : 0;
  const unitPrice =
    selectedSizeBasePrice +
    stylePriceDelta +
    totalMattressPrice +
    (assemblyServiceSelected ? assemblyServicePrice : 0);

  const baseSavings =
    baseOriginalPrice !== undefined && baseOriginalPrice > basePrice ? baseOriginalPrice - basePrice : 0;
  const selectedSizeOriginalPriceBase =
    baseOriginalPrice !== undefined ? selectedSizeBasePrice + baseSavings : undefined;

  const unitOriginalPrice =

    selectedSizeOriginalPriceBase !== undefined
      ? selectedSizeOriginalPriceBase + stylePriceDelta + totalMattressPrice
      : undefined;

  const totalPrice = unitPrice * quantity;

  const savingsPerUnit = unitOriginalPrice && unitOriginalPrice > unitPrice ? unitOriginalPrice - unitPrice : 0;
  const discountPercentage = unitOriginalPrice && unitOriginalPrice > unitPrice ? Math.round((savingsPerUnit / unitOriginalPrice) * 100) : 0;

  const bunkMattressRulesEnabled = useMemo(
    () => mattresses.some((m) => m.enable_bunk_positions),
    [mattresses]
  );

  const getBunkOccupancy = useCallback(
    (list: SelectedMattressPick[]) => {
      let topTaken = false;
      let bottomTaken = false;
      list.forEach((sel) => {
        const mattress = sel.id ? mattressMap[sel.id] : undefined;
        if (!mattress?.enable_bunk_positions) return;
        const pos = sel.position || 'top';
        if (pos === 'top') {
          topTaken = true;
        } else if (pos === 'bottom') {
          bottomTaken = true;
        } else if (pos === 'both') {
          topTaken = true;
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
      const kept: SelectedMattressPick[] = [];

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

        if (pos === 'both') {
          const canTakeTop = !topTaken;
          const canTakeBottom = !bottomTaken;
          if (canTakeTop && canTakeBottom) {
            topTaken = true;
            bottomTaken = true;
            kept.push(sel);
            continue;
          }
          if (canTakeTop) {
            topTaken = true;
            kept.push({ ...sel, position: 'top' });
            continue;
          }
          if (canTakeBottom) {
            bottomTaken = true;
            kept.push({ ...sel, position: 'bottom' });
            continue;
          }
          continue;
        }
        // ignore other positions
      }

      return kept.reverse();
    },
    [bunkMattressRulesEnabled, mattressMap]
  );

  // Default only when a free (included) mattress exists; otherwise leave unselected.
  useEffect(() => {
    if (hasAutoSelectedIncludedMattress.current) return;
    if (!mattresses.length) return;

    // If a mattress is already selected (e.g., from a pre-select flow), don't override it.
    if (selectedMattresses.length > 0) {
      hasAutoSelectedIncludedMattress.current = true;
      return;
    }

    // Prefer the Semi-Orthopaedic included option when available; otherwise any free mattress; otherwise none.
    const included =
      mattresses.find((m) => isIncludedMattress(m, selectedSize) && /semi[-\s]?orth/i.test(m.name || '')) ||
      mattresses.find((m) => isIncludedMattress(m, selectedSize));

    if (included) {
      const normalized = normalizeBunkMattressSelections([
        {
          id: normalizeId(included.id),
          position: included.enable_bunk_positions ? 'top' : null,
        },
      ]);
      setSelectedMattresses(normalized);
      setExternalMattress(included);
    }
    hasAutoSelectedIncludedMattress.current = true;
  }, [
    mattresses,
    selectedMattresses.length,
    isIncludedMattress,
    normalizeBunkMattressSelections,
    isBunkOrDivanCategory,
    selectedSize,
  ]);

  // Allow re-attempting auto-select if the user cleared selections or a new mattress list arrived.
  useEffect(() => {
    if (selectedMattresses.length === 0) {
      hasAutoSelectedIncludedMattress.current = false;
    }
  }, [selectedMattresses.length, mattresses.length]);

  // Apply pre-selected mattress when returning from the mattress listing
  useEffect(() => {
    const preSelectMattressId = searchParams.get('pre-select-mattress');
    if (!preSelectMattressId || !product?.mattresses) return;

    const targetId = Number(preSelectMattressId);
    const mattressToSelect =
      product.mattresses.find((m) => Number(m.id) === targetId) ||
      product.mattresses.find((m) => Number(m.source_product) === targetId);

    const applySelection = (mattress: ProductMattress) => {
      setExternalMattress(mattress);
      setSelectedMattresses(
        normalizeBunkMattressSelections([
          {
            id: Number(mattress.id),
            position: mattress.enable_bunk_positions ? 'top' : null,
          },
        ])
      );
    };

    if (mattressToSelect?.id) {
      applySelection(mattressToSelect);
      return;
    }

    // Fallback: fetch the mattress product by id and map it into a pseudo mattress option
    const fetchExternal = async () => {
      try {
        const res = await apiGet<Product | Product[]>(`/products/${targetId}/`);
        const productData = Array.isArray(res) ? res[0] : res;
        if (!productData?.id) return;
        applySelection({
          id: productData.id,
          name: productData.name,
          price: Number(productData.price ?? 0),
          image_url: productData.images?.[0]?.url,
          enable_bunk_positions: false,
          source_product: productData.id,
        });
      } catch {
        // swallow – no match
      }
    };

    fetchExternal();
  }, [location.search, product?.mattresses, searchParams, normalizeBunkMattressSelections]);

const adjustedDimensionTableRows = useMemo(() => {
    if (rawDimensionTableRows.length === 0) return [];

    // Only include sizes that actually exist in the product data; fall back to defaults if none present.
    const allowedSizes = (() => {
      const seen = new Set<string>();
      rawDimensionTableRows.forEach((row) => {
        Object.entries(row.values || {}).forEach(([size, value]) => {
          if (String(value || '').trim()) seen.add(size.trim());
        });
      });
      return seen.size > 0 ? Array.from(seen) : [...DIMENSION_SIZE_COLUMNS];
    })();

    const mergedRows = rawDimensionTableRows.map((row) => {
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
<Header />

        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">

          <div className="text-center text-muted-foreground">Loading product...</div>

        </div>

        <Footer />

      </div>

    );

  }



  const handleAddToCart = () => {
    // Push GA4 event to dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        items: [
          {
            item_id: String(product?.id || ""),
            item_name: product?.name || "Product",
            price: unitPrice,
            quantity: quantity,
            item_category: product?.category_name || "Uncategorized",
            item_variant: Object.entries(
              enabledGroups
                ? Object.fromEntries(Object.entries(selectedStyles).filter(([name]) => enabledGroups[name]))
                : selectedStyles
            )
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ") || undefined,
          }
        ]
      }
    });

    // If this is a mattress being selected for a bed, navigate back to the bed product
    if (selectForBedSlug && product?.id) {
      const bedSizeQuery = linkedBedSize ? `&bed-size=${encodeURIComponent(linkedBedSize)}` : '';
      window.location.href = `/product/${selectForBedSlug}?pre-select-mattress=${product.id}${bedSizeQuery}`;
      return;
    }

    const extrasTotal =
      stylePriceDelta + totalMattressPrice + (assemblyServiceSelected ? assemblyServicePrice : 0);
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
      assembly_service_selected: assemblyServiceSelected,
      assembly_service_price: assemblyServiceSelected ? assemblyServicePrice : 0,
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
<Header />



      <main className="container mx-auto px-4 lg:px-8 py-8">

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



        <div className={`grid gap-10 items-start ${hasDisplayImages ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'lg:grid-cols-1'}`}>

          {hasDisplayImages && (
          <div className="space-y-6 lg:sticky lg:top-24 self-start px-0 sm:px-2 max-w-[660px] w-full mx-auto">

            <motion.div
              className="relative aspect-square max-h-[520px] w-full mx-auto overflow-hidden rounded-2xl bg-card shadow-md"

              onClick={() => setIsZoomed(!isZoomed)}

            >

              <AnimatePresence mode="wait">

                <motion.img

                  key={selectedImage}

                  src={displayImages[selectedImage]?.url}

                  alt={displayImages[selectedImage]?.alt_text || product.name}

                  initial={{ opacity: 0 }}

                  animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1.16 }}

                  exit={{ opacity: 0 }}

                  transition={{ duration: 0.3 }}

                  className="absolute inset-0 h-full w-full object-cover bg-[#f7f3ef]"

                />

              </AnimatePresence>



              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevImage();
                    }}
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white shadow-lg transition hover:bg-black/75"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white shadow-lg transition hover:bg-black/75"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openGallery();
                  }}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-sm font-medium text-white backdrop-blur shadow-lg"
                  aria-label="Open full gallery"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Click to expand</span>
                </button>
                {totalImages > 1 && (
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
                )}
              </div>


              <div className="absolute left-4 top-4 flex flex-col gap-2 items-start">

                {product.is_bestseller && (

                  <Badge className="bg-primary text-primary-foreground">Bestseller</Badge>

                )}

                {product.is_new && (

                  <Badge variant="secondary" className="bg-accent text-accent-foreground">New</Badge>

                )}

                {discountPercentage > 0 && (
                  <Badge className="bg-black text-white shadow-md font-semibold">
                    SALE -{discountPercentage}%
                  </Badge>
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

                      alt={img.alt_text || `${product.name} ${index + 1}`}

                      className="absolute inset-0 h-full w-full object-cover"

                    />

                  </button>

                ))}

              </div>

            )}

          </div>
          )}



          <div className="space-y-6 lg:pr-2 w-full max-w-[660px] mx-auto">

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

                {unitOriginalPrice && unitOriginalPrice > unitPrice && (

                  <span className="text-lg text-muted-foreground line-through">{formatPrice(unitOriginalPrice)}</span>

                )}

                <span className="text-3xl font-bold text-primary">{formatPrice(unitPrice)}</span>

                {discountPercentage > 0 && (
                  <div className="ml-8 sm:ml-12">
                    <Badge className="bg-black text-white text-sm font-semibold">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>
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
                  const isFabricGroup = group.kind === 'fabric';
                  const optionCount = group.options.length || 0;
                  const headboardGridStyle = isHeadboardGroup
                    ? {
                        gridTemplateColumns: `repeat(${Math.min(Math.max(optionCount, 1), 4)}, minmax(0, 1fr))`,
                      }
                    : undefined;
                  const groupEnabled = enabledGroups[group.name] !== false;
                  const showGroupIcon = group.kind !== 'fabric' && group.kind !== 'color';
                  const useFullWidthGrid = isStorageGroup || group.kind === 'size';
                  const gridClass = (() => {
                    if (isHeadboardGroup) return 'grid gap-3';
                    if (isStyleGroup && optionCount <= 2) return 'grid gap-3 sm:grid-cols-2';
                    if (useFullWidthGrid) {
                      if (optionCount <= 2) return 'grid gap-3 sm:grid-cols-2';
                      return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';
                    }
                    return 'flex flex-wrap gap-2';
                  })();
                  return (
                    <div key={group.key} className="space-y-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {showGroupIcon && (
                            <IconVisual icon={group.icon_url} alt={group.name} className="h-10 w-10 object-contain" />
                          )}
                          <div>
                            <p className="text-base font-semibold capitalize">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {groupEnabled && selected?.label
                                ? `Selected: ${selected.label.replace(/(\d+)(Drawers)/i, '$1 $2')}${
                                    selected.description ? ` (${selected.description})` : ''
                                  }`
                                : isStorageGroup
                                ? 'Selected: No Storage'
                                : isHeadboardGroup
                                ? 'Selected: No Headboard'
                                : 'Selected: No option'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={gridClass} style={headboardGridStyle}>
                          {group.options.map((option) => {
                            const isSelected = selected?.key === option.key;
                            const disabled = false;
                          const shouldShowIcon =
                            !(group.kind === 'size' && !sizeIconsEnabled) &&
                            group.kind !== 'fabric';
                            return (
                              <button
                              key={option.key}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                if (group.kind === 'color') {
                                  if (product?.fabrics?.length && activeFabricForColors) {
                                    setSelectedFabric(activeFabricForColors);
                                    setPreviewFabric('');
                                  }
                                  setSelectedColor(option.label);
                                  return;
                                }
                                if (group.kind === 'size') {
                                  setSelectedSize(option.label);
                                  return;
                                }
                                if (group.kind === 'fabric') {
                                  setPreviewFabric(option.label);
                                  return;
                                }
                                 // Style group selection (allow toggle-off for storage)
                                 const styleName = group.styleName || group.name;
                                 const isStyleGroup = group.kind === 'style';

                                 if (isStyleGroup) {
                                   if (isSelected) {
                                     setHasUserChangedStyleSelections(true);
                                     setSelectedStyles((prev) => {
                                       const next = { ...prev };
                                       delete next[styleName];
                                       return next;
                                     });
                                     setEnabledGroups((prev) => ({ ...prev, [styleName]: false }));
                                     return;
                                   }
                                   setHasUserChangedStyleSelections(true);
                                   setSelectedStyles((prev) => ({ ...prev, [styleName]: option.key }));
                                   setEnabledGroups((prev) => ({ ...prev, [styleName]: true }));
                                 }
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
                                  : isFabricGroup
                                    ? `relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        disabled
                                          ? 'cursor-not-allowed opacity-40'
                                          : isSelected
                                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                                          : 'border-border bg-white text-espresso hover:border-primary/60'
                                      }`
                                    : `relative flex ${
                                        isHeadboardGroup
                                          ? 'h-32 w-full flex-row items-center justify-start gap-4 px-3 text-left'
                                          : 'h-24 min-h-[96px] w-full flex-col items-center justify-center gap-0 px-3 py-3 text-center'
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
                                    {option.icon_url ? (
                                      <img
                                        src={resolveMediaUrl(option.icon_url)}
                                        alt={formatOptionLabel(option.label)}
                                        className="absolute inset-0 h-full w-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <span
                                        className="absolute inset-0 rounded-md"
                                        style={{
                                          backgroundColor:
                                            option.color_code || (option as any).placeholder || '#f3f4f6',
                                        }}
                                      />
                                    )}
                                    <span className="sr-only">{formatOptionLabel(option.label)}</span>
                                  </>
                                ) : (
                                  isFabricGroup ? (
                                    <span className="text-sm font-semibold text-espresso">
                                      {formatOptionLabel(option.label)}
                                    </span>
                                  ) : (
                                    <div
                                      className={`flex ${
                                        isHeadboardGroup
                                          ? 'flex-row items-center gap-3 text-left'
                                          : 'flex-col items-center gap-1 text-center'
                                      } w-full`}
                                    >
                                      {shouldShowIcon && (
                                        <div className={isHeadboardGroup ? 'flex h-14 w-14 items-center justify-center shrink-0' : 'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center'}>
                                          <IconVisual
                                            icon={option.icon_url || group.icon_url}
                                            alt={option.label}
                                            className={isHeadboardGroup ? 'h-10 w-10 sm:h-14 sm:w-14 object-contain' : 'h-8 w-8 sm:h-10 sm:w-10 object-contain'}
                                          />
                                        </div>
                                      )}
                                      <div
                                        className={
                                          isHeadboardGroup ? 'flex flex-col gap-1 min-w-0 flex-1' : 'flex flex-col items-center gap-0 text-center'
                                        }
                                      >
                                        <p
                                          className={`text-[11px] sm:text-[12px] font-semibold text-espresso leading-tight px-1 ${
                                            isHeadboardGroup
                                              ? 'text-left line-clamp-2 sm:line-clamp-3 break-words whitespace-normal'
                                              : `text-center min-h-[28px] flex items-center justify-center w-full line-clamp-1 whitespace-nowrap`
                                          }`}
                                        >
                                          {formatOptionLabel(option.label)}
                                          {option.description && ` (${option.description})`}
                                        </p>
                                        <p
                                          className={`text-[10px] sm:text-[11px] text-muted-foreground leading-tight ${
                                            isHeadboardGroup
                                              ? 'text-left'
                                              : 'text-center min-h-[14px] flex items-center justify-center w-full'
                                          }`}
                                        >
                                          {group.kind === 'size'
                                            ? formatPrice(Number(option.price_delta || 0))
                                            : formatAddonPrice(Number(option.price_delta || 0))}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                )}

                                {group.kind !== 'color' && !isFabricGroup && isSelected && (
                                  <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAllMattresses(false);
                      setIsMattressOpen(true);
                    }}
                  >
                    Upgrade mattresses
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllMattresses(false);
                    setIsMattressOpen(true);
                  }}
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
                        ? selectedMattressDetails.every((m) => isIncludedMattress(m, selectedSize))
                          ? 'Included'
                          : formatPrice(totalMattressPrice)
                        : 'Tap to choose a mattress'}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            )}

            {product?.assembly_service_enabled && (
              <div className="rounded-xl border border-border bg-white p-4 space-y-3">
                <div>
                  <p className="text-base font-semibold">Assembly Service</p>
                  <p className="text-xs text-muted-foreground">
                    Let our team assemble your product for a hassle-free experience.
                  </p>
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-dashed border-primary/50 px-3 py-3 transition hover:border-primary/70">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={assemblyServiceSelected}
                    onChange={(e) => setAssemblyServiceSelected(e.target.checked)}
                  />
                  <span className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">Add Assembly Service</span>
                    <span className="text-sm font-semibold text-espresso">
                      {assemblyServicePrice > 0 ? `+${formatPrice(assemblyServicePrice)}` : 'Included'}
                    </span>
                  </span>
                </label>
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

                {selectForBedSlug ? 'Select Mattress' : `Add to Cart - ${formatPrice(totalPrice)}`}

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
              { key: 'delivery', label: product?.delivery_title?.trim() || 'Delivery Information', show: Boolean(product?.delivery_info) },
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
              <div className="text-muted-foreground leading-relaxed space-y-4">
                {renderMultilineParagraphs(fullDescription, false)}
              </div>
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
                  <p className="text-xs text-muted-foreground">{dimensionNote}</p>
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

        {seriesProducts.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  {seriesCollection?.name
                    ? `More from ${seriesCollection.name}`
                    : 'More from this range'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Discover matching pieces from the same collection.
                </p>
              </div>
              {seriesCollection?.slug && (
                <Link
                  to={`/collections#${seriesCollection.slug}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View full collection
                </Link>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {seriesProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </section>
        )}


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
              alt={displayImages[selectedImage]?.alt_text || `${product.name} large view`}
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
                            alt={img.alt_text || `${product.name} thumb ${idx + 1}`}
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
          <div className="flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl">
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
              {(showAllMattresses ? mattresses : mattresses.slice(0, 4)).map((mattress) => {
                const selectedPick = selectedMattresses.find((m) => m.id === mattress.id);
                const isSelected = Boolean(selectedPick);
                const currentPosition =
                  mattress.enable_bunk_positions && isSelected ? selectedPick?.position || 'top' : null;

                const visiblePosition = mattress.enable_bunk_positions ? currentPosition : null;
                const isIncluded =
                  Number(mattress.price ?? 0) === 0 &&
                  Number(mattress.price_top ?? 0) === 0 &&
                  Number(mattress.price_bottom ?? 0) === 0 &&
                  Number(mattress.price_both ?? 0) === 0;

                const displaySizeLabel = normalizeSizeName(selectedSize) || selectedSize || '';
                const priceDisplay = mattress.enable_bunk_positions
                  ? visiblePosition
                    ? priceForPosition(mattress, visiblePosition, selectedSize)
                    : 0
                  : Number(
                      (mattress.prices || []).find(
                        (p) =>
                          normalizeSizeName(p.size_label).toLowerCase() === normalizeSizeName(selectedSize).toLowerCase()
                      )?.price ?? mattress.price ?? 0
                    );
                const originalPriceDisplay = mattress.enable_bunk_positions
                  ? visiblePosition
                    ? Number(priceForPosition(mattress, visiblePosition, selectedSize))
                    : 0
                  : Number(
                      (mattress.prices || []).find(
                        (p) =>
                          normalizeSizeName(p.size_label).toLowerCase() === normalizeSizeName(selectedSize).toLowerCase()
                      )?.original_price ?? mattress.original_price ?? 0
                    );
                const savingsAmount =
                  originalPriceDisplay > priceDisplay ? originalPriceDisplay - priceDisplay : 0;

                const statusLabel = isSelected
                  ? isIncluded
                    ? 'Included'
                    : 'Selected'
                  : 'Not selected';

                return (
                  <button
                    key={mattress.id}
                    type="button"
                    onClick={() => {
                      setSelectedMattresses((prev) => {
                        setHasUserChangedMattressSelection(true);
                        const withoutCurrent = prev.filter((m) => m.id !== mattress.id);

                        // Toggle off if already selected
                        if (currentPosition || (!mattress.enable_bunk_positions && isSelected)) {
                          setExternalMattress(null);
                          return withoutCurrent;
                        }

                        let defaultPosition: 'top' | 'bottom' | null = null;
                        if (mattress.enable_bunk_positions) {
                          const { topTaken, bottomTaken } = getBunkOccupancy(withoutCurrent);
                          if (!topTaken) defaultPosition = 'top';
                          else if (!bottomTaken) defaultPosition = 'bottom';
                          else defaultPosition = 'top'; // allow replacement: latest top choice wins
                        }

                        if (!mattress.enable_bunk_positions) {
                          setExternalMattress(mattress);
                          return [
                            {
                              id: mattress.id,
                              position: null,
                            },
                          ];
                        }

                        const normalized = normalizeBunkMattressSelections([
                          ...withoutCurrent,
                          {
                            id: mattress.id,
                            position: mattress.enable_bunk_positions ? defaultPosition : null,
                          },
                        ]);

                        let next = normalized;

                        // When selecting a paid/upgrade mattress, drop any zero-price included mattress selections.
                        if (!isIncluded) {
                          next = normalized.filter((sel) => {
                            const mSel = mattressMap[normalizeId(sel.id)];
                            if (!mSel) return true;
                            return !isIncludedMattress(mSel, selectedSize) || sel.id === mattress.id;
                          });
                        }

                        setExternalMattress(mattress);
                        return next;
                      });
                    }}
                    className={`w-full rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:shadow-md ${
                      isSelected ? 'border-primary/80 bg-primary/5 ring-1 ring-primary/30' : 'border-border/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {resolveMediaUrl(mattress.image_url) ? (
                        <img
                          src={resolveMediaUrl(mattress.image_url)}
                          alt={mattress.name || 'Mattress option'}
                          className="h-[78px] w-[78px] shrink-0 rounded-xl object-cover ring-1 ring-border/70 md:h-[88px] md:w-[88px]"
                        />
                      ) : (
                        <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground ring-1 ring-border/70 md:h-[88px] md:w-[88px]">
                          No image
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="min-w-0 space-y-1.5">
                            <p className="text-[15px] font-medium leading-5 text-foreground md:text-[16px]">
                              {mattress.name || 'Mattress'}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                              {displaySizeLabel && (
                                <p className="leading-4">
                                  <span className="font-medium text-foreground">Size:</span>{' '}
                                  <span>{displaySizeLabel}</span>
                                </p>
                              )}
                              <p className="leading-4">
                                <span className="font-semibold text-primary">{formatPrice(priceDisplay)}</span>
                                {originalPriceDisplay > priceDisplay && (
                                  <span className="ml-2 line-through">{formatPrice(originalPriceDisplay)}</span>
                                )}
                              </p>
                              {mattress.enable_bunk_positions && (
                                <p className="leading-4">
                                  <span className="font-medium text-foreground">Position:</span>{' '}
                                  {visiblePosition
                                    ? visiblePosition === 'both'
                                      ? 'Top + Bottom'
                                      : visiblePosition === 'top'
                                      ? 'Top bunk'
                                      : 'Bottom bunk'
                                    : 'Choose below'}
                                </p>
                              )}
                              <p
                                className={`leading-4 font-medium ${
                                  statusLabel === 'Included'
                                    ? 'text-green-700'
                                    : statusLabel === 'Selected'
                                      ? 'text-primary'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {statusLabel}
                              </p>
                            </div>
                            {mattress.description && (
                              <p className="text-[13px] leading-5 text-muted-foreground line-clamp-1 md:pr-2">
                                {mattress.description}
                              </p>
                            )}
                        </div>

                        {!mattress.enable_bunk_positions && savingsAmount > 0 && (
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="inline-flex max-w-full rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold leading-4 text-primary-foreground md:text-xs">
                              (Save extra {formatPrice(savingsAmount)} when bought with a bed)
                            </div>
                            <button
                              type="button"
                              className="text-xs font-medium text-foreground underline underline-offset-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMattressDetails(mattress);
                              }}
                            >
                              See details
                            </button>
                          </div>
                        )}

                        {mattress.enable_bunk_positions && (
                          <button
                            type="button"
                            className="w-fit text-xs font-medium text-foreground underline underline-offset-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMattressDetails(mattress);
                            }}
                          >
                            See details
                          </button>
                        )}

                        {mattress.enable_bunk_positions && (
                          <div className="mt-3">
                            <div className="mb-2 text-[11px] font-semibold text-muted-foreground">Position</div>
                            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-primary/40">
                              {(['top', 'bottom'] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 text-sm transition ${
                                    visiblePosition === pos || visiblePosition === 'both'
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'bg-white text-foreground hover:bg-primary/5'
                                  } ${pos === 'top' ? 'rounded-l-xl' : 'rounded-r-xl'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHasUserChangedMattressSelection(true);
                                    setSelectedMattresses((prev) => {
                                      const withoutCurrent = prev.filter((m) => m.id !== mattress.id);
                                      const activePos = currentPosition || null;
                                      let nextPosition: BunkPosition | null = pos;
                                      if (activePos === 'both') {
                                        nextPosition = pos === 'top' ? 'bottom' : 'top';
                                      } else if (activePos === pos) {
                                        nextPosition = null;
                                      } else if (
                                        (activePos === 'top' && pos === 'bottom') ||
                                        (activePos === 'bottom' && pos === 'top')
                                      ) {
                                        nextPosition = 'both';
                                      }

                                      if (!nextPosition) {
                                        setExternalMattress(null);
                                        return withoutCurrent;
                                      }

                                      const updated = normalizeBunkMattressSelections([
                                        ...withoutCurrent,
                                        {
                                          id: mattress.id,
                                          position: nextPosition,
                                        },
                                      ]);
                                      setExternalMattress(mattress);
                                      return updated;
                                    });
                                  }}
                                >
                                  <span className="flex items-center gap-2 capitalize">
                                    <span
                                      className={`h-2.5 w-2.5 rounded-full border ${
                                        visiblePosition === pos || visiblePosition === 'both'
                                          ? 'border-primary bg-primary/80'
                                          : 'border-muted-foreground/60 bg-white'
                                      }`}
                                  />
                                    {pos === 'top' ? 'Top' : 'Bottom'}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatPrice(priceForPosition(mattress, pos, selectedSize))}
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

            </div>

            <div className="border-t border-border px-5 py-4 bg-white">
              <Button
                className="w-full"
                onClick={() => {
                  setShowAllMattresses(false);
                  setIsMattressOpen(false);
                }}
              >
                Apply selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {isMattressDetailOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 pr-4">
                <p className="text-2xl font-semibold text-foreground">
                  {mattressDetail?.title || 'Mattress details'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-muted"
                onClick={() => {
                  setIsMattressDetailOpen(false);
                  setMattressDetail(null);
                  setActiveMattressDetailImage(0);
                }}
                aria-label="Close mattress details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
              {isLoadingMattressDetail && (
                <p className="mb-4 text-sm text-muted-foreground">Loading details...</p>
              )}

              <div className="space-y-5">
                <div className="relative overflow-hidden rounded-2xl bg-muted">
                  {mattressDetail?.images?.length ? (
                    <>
                      <img
                        src={mattressDetail.images[activeMattressDetailImage]?.url}
                        alt={mattressDetail.images[activeMattressDetailImage]?.alt || mattressDetail.title}
                        className="h-[260px] w-full object-cover md:h-[420px]"
                      />
                      {mattressDetail.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
                            onClick={() =>
                              setActiveMattressDetailImage((prev) =>
                                prev === 0 ? mattressDetail.images.length - 1 : prev - 1
                              )
                            }
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
                            onClick={() =>
                              setActiveMattressDetailImage((prev) =>
                                prev === mattressDetail.images.length - 1 ? 0 : prev + 1
                              )
                            }
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground md:h-[420px]">
                      No image available
                    </div>
                  )}
                </div>

                {mattressDetail?.images && mattressDetail.images.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {mattressDetail.images.map((_, index) => (
                      <button
                        key={`${mattressDetail.id}-image-dot-${index}`}
                        type="button"
                        aria-label={`Go to image ${index + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          activeMattressDetailImage === index ? 'bg-primary' : 'bg-border/40'
                        }`}
                        onClick={() => setActiveMattressDetailImage(index)}
                      />
                    ))}
                  </div>
                )}

                {mattressDetail?.description && (
                  <div className="space-y-2">
                    <p
                      className="text-base leading-7 text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: renderRichText(mattressDetail.description) }}
                    />
                  </div>
                )}

                {mattressDetail?.features && normalizeFeatures(mattressDetail.features).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-foreground">Features</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {normalizeFeatures(mattressDetail.features).map((feature, idx) => (
                        <li key={`${mattressDetail.id}-feature-${idx}`}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
                <p className="text-xs text-muted-foreground">{dimensionNote}</p>
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
