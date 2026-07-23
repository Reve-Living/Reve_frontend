import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation, useSearchParams } from 'react-router-dom';
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

const PRODUCTS_PER_PAGE = 18;
const INITIAL_PRODUCTS_LIMIT = PRODUCTS_PER_PAGE;
const CATEGORY_STALE_CACHE_MS = 10 * 60 * 1000;
const CATEGORY_PAGE_SNAPSHOT_MS = 10 * 60 * 1000;
const CATEGORY_PAGE_SNAPSHOT_PREFIX = 'reve-category-page:v6:';
const CATEGORY_PAGE_PERSISTED_SNAPSHOT_MS = 24 * 60 * 60 * 1000;
const FILTER_PREFETCH_SINGLE_LIMIT = 8;
const FILTER_PREFETCH_PAIR_LIMIT = 12;

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

const parsePageParam = (value: string | null): number => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const DEFAULT_SORT = 'featured';
const SORT_VALUES = new Set(['featured', 'price-low', 'price-high', 'rating', 'newest']);
const FILTER_PARAM_PREFIX = 'filter-';
const FILTER_RESERVED_PARAM_KEYS = new Set([
  'sub',
  'bed-size',
  'from',
  'page',
  'sort',
  'min-price',
  'max-price',
  'size',
]);

const normalizeSortParam = (value: string | null): string => {
  const candidate = String(value || '').trim().toLowerCase();
  return SORT_VALUES.has(candidate) ? candidate : DEFAULT_SORT;
};

const parseNumberParam = (value: string | null): number | null => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const arraysEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const recordsEqual = (
  left: Record<string, string[]>,
  right: Record<string, string[]>
): boolean => {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!arraysEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => arraysEqual(left[key] || [], right[key] || []));
};

const rangesEqual = (left: number[], right: number[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const toQuerySlug = (value?: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseMultiValueParam = (params: URLSearchParams, key: string): string[] =>
  Array.from(
    new Set(
      params
        .getAll(key)
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

const setMultiValueParam = (params: URLSearchParams, key: string, values: string[]) => {
  const nextValues = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  if (nextValues.length === 0) {
    params.delete(key);
    return;
  }
  params.set(key, nextValues.join(','));
};

const getFilterParamKey = (filterSlug: string): string =>
  FILTER_RESERVED_PARAM_KEYS.has(filterSlug) ? `${FILTER_PARAM_PREFIX}${filterSlug}` : filterSlug;

const getFilterParamAliases = (filterSlug: string): string[] =>
  Array.from(new Set([getFilterParamKey(filterSlug), `${FILTER_PARAM_PREFIX}${filterSlug}`]));

const parseFilterParamValues = (params: URLSearchParams, filterSlug: string): string[] =>
  Array.from(
    new Set(getFilterParamAliases(filterSlug).flatMap((key) => parseMultiValueParam(params, key)))
  );

const shouldRequestSizesForCategory = (categorySlug: string, linkedSize = ''): boolean => {
  const normalized = categorySlug.trim().toLowerCase();
  return normalized === 'beds' || normalized === 'mattress' || normalized === 'mattresses' || Boolean(linkedSize);
};

const buildCategoryProductsPath = (
  categorySlug: string,
  subSlug: string,
  includeFilters = false,
  includeSizes = false,
  limit?: number,
  offset = 0,
  extraParams?: URLSearchParams,
  includeTotal = false
): string => {
  const params = new URLSearchParams({ summary: '1' });
  if (subSlug) params.set('subcategory', subSlug);
  else params.set('category', categorySlug);
  if (includeFilters) params.set('include_filters', '1');
  if (includeSizes) params.set('include_sizes', '1');
  if (includeTotal) params.set('include_total', '1');
  extraParams?.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  if (limit && limit > 0) params.set('limit', String(limit));
  if (offset > 0) params.set('offset', String(offset));
  return `/products/?${params.toString()}`;
};

const buildProductFiltersPath = (categorySlug: string, subSlug: string): string => {
  const params = new URLSearchParams();
  if (subSlug) params.set('subcategory', subSlug);
  else if (categorySlug) params.set('category', categorySlug);
  const query = params.toString();
  return `/products/filters/${query ? `?${query}` : ''}`;
};

const buildServerFilterParams = (searchParams: URLSearchParams): URLSearchParams => {
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key.startsWith(FILTER_PARAM_PREFIX)) {
      params.append(key.slice(FILTER_PARAM_PREFIX.length), value);
      return;
    }
    if (!FILTER_RESERVED_PARAM_KEYS.has(key)) params.append(key, value);
  });
  return params;
};

type ProductListResponse = Product[] | { count?: number; results?: Product[] };

const normalizeProductListResponse = (response: ProductListResponse): { products: Product[]; count?: number } => {
  if (Array.isArray(response)) return { products: response };
  return {
    products: Array.isArray(response?.results) ? response.results : [],
    count: typeof response?.count === 'number' ? response.count : undefined,
  };
};

const placeProductsAtOffset = (current: Product[], incoming: Product[], offset: number): Product[] => {
  if (current.length === 0) return incoming;
  const seen = new Set(current.map((product) => Number(product.id)));
  const next = offset <= 0 ? [...incoming] : [...current];
  incoming.forEach((product) => {
    if (seen.has(Number(product.id))) return;
    seen.add(Number(product.id));
    next.push(product);
  });
  return next;
};

const warmProductImages = (products: Product[], count = 6) => {
  if (typeof window === 'undefined') return;
  products.slice(0, count).forEach((product) => {
    const src = product.images?.[0]?.url;
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
};

type CategoryPageSnapshot = {
  ts: number;
  category: Category | null;
  subcategories: SubCategory[];
  products: Product[];
  totalProductCount: number | null;
  availableFilters: FilterType[];
};

const getCategoryPageSnapshotKey = (slug = '', subSlug = '', linkedBedSize = '', page = 1, productKey = '') =>
  `${CATEGORY_PAGE_SNAPSHOT_PREFIX}${slug}|${subSlug}|${linkedBedSize}|${page}|${productKey}`;

const readCategoryPageSnapshot = (
  slug?: string,
  subSlug = '',
  linkedBedSize = '',
  page = 1,
  productKey = ''
): CategoryPageSnapshot | null => {
  if (typeof window === 'undefined' || !slug) return null;
  const key = getCategoryPageSnapshotKey(slug, subSlug, linkedBedSize, page, productKey);
  const readStoredSnapshot = (storage: Storage, maxAgeMs: number, evictExpired: boolean): CategoryPageSnapshot | null => {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as CategoryPageSnapshot;
    if (!snapshot || typeof snapshot.ts !== 'number') return null;
    if (Date.now() - snapshot.ts > maxAgeMs) {
      if (evictExpired) storage.removeItem(key);
      return null;
    }
    return snapshot;
  };

  try {
    const sessionSnapshot = readStoredSnapshot(window.sessionStorage, CATEGORY_PAGE_SNAPSHOT_MS, true);
    if (sessionSnapshot) return sessionSnapshot;
  } catch {
    // Fall through to the persisted last-good snapshot.
  }

  try {
    return readStoredSnapshot(window.localStorage, CATEGORY_PAGE_PERSISTED_SNAPSHOT_MS, true);
  } catch {
    return null;
  }
};

const writeCategoryPageSnapshot = (
  slug: string | undefined,
  subSlug: string,
  linkedBedSize: string,
  page: number,
  productKey: string,
  snapshot: Omit<CategoryPageSnapshot, 'ts'>
) => {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const value = JSON.stringify({ ...snapshot, ts: Date.now() });
    window.sessionStorage.setItem(
      getCategoryPageSnapshotKey(slug, subSlug, linkedBedSize, page, productKey),
      value
    );
    window.localStorage.setItem(getCategoryPageSnapshotKey(slug, subSlug, linkedBedSize, page, productKey), value);
  } catch {
    // Ignore storage limits; the live API load still works.
  }
};

const ProductLoadingNotice = () => (
  <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-border/40 bg-card/60">
    <div className="text-center text-sm text-muted-foreground">Loading products...</div>
  </div>
);

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const subSlug = searchParams.get('sub') || '';
  const linkedBedSize = searchParams.get('bed-size') || '';
  const linkedBedProduct = searchParams.get('from') || '';
  const sortFromQuery = normalizeSortParam(searchParams.get('sort'));
  const pageFromQuery = parsePageParam(searchParams.get('page'));
  const returnTo = `${location.pathname}${location.search}`;
  const serverFilterParams = useMemo(() => buildServerFilterParams(searchParams), [searchParams, searchParamsKey]);
  const serverFilterParamsKey = serverFilterParams.toString();
  const [debouncedServerFilterParamsKey, setDebouncedServerFilterParamsKey] = useState(serverFilterParamsKey);
  const debouncedServerFilterParams = useMemo(
    () => new URLSearchParams(debouncedServerFilterParamsKey),
    [debouncedServerFilterParamsKey]
  );
  const initialSnapshot = useMemo(
    () => readCategoryPageSnapshot(slug, subSlug, linkedBedSize, pageFromQuery, debouncedServerFilterParamsKey),
    [debouncedServerFilterParamsKey, linkedBedSize, pageFromQuery, slug, subSlug]
  );
  const requestedProductKey = getCategoryPageSnapshotKey(
    slug,
    subSlug,
    linkedBedSize,
    pageFromQuery,
    debouncedServerFilterParamsKey
  );
  const requestedFilterScopeKey = `${slug || ''}|${subSlug}`;
  const [category, setCategory] = useState<Category | null>(initialSnapshot?.category ?? null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>(initialSnapshot?.subcategories ?? []);
  const [allProducts, setAllProducts] = useState<Product[]>(initialSnapshot?.products ?? []);
  const [totalProductCount, setTotalProductCount] = useState<number | null>(initialSnapshot?.totalProductCount ?? null);
  const [loadedProductKey, setLoadedProductKey] = useState(initialSnapshot ? requestedProductKey : '');
  const [loadedFilterScopeKey, setLoadedFilterScopeKey] = useState(initialSnapshot ? requestedFilterScopeKey : '');
  const [isLoading, setIsLoading] = useState(!initialSnapshot);
  const [isFiltersLoading, setIsFiltersLoading] = useState(!initialSnapshot);
  const [loadError, setLoadError] = useState(false);

  const [sortBy, setSortBy] = useState(sortFromQuery);
  const [currentPage, setCurrentPage] = useState(pageFromQuery);
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<FilterType[]>(initialSnapshot?.availableFilters ?? []);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const isMattressCategory = (s: string | undefined) => s === 'mattress' || s === 'mattresses';

  const showSizeFilter = category?.slug === 'beds';
  const showBedSizeFilter = isMattressCategory(category?.slug) && !!linkedBedSize;

  const priceBounds = useMemo(() => {
    const prices = allProducts.map((p) => Number(p.price)).filter((v) => !Number.isNaN(v));
    if (prices.length === 0) return { min: 0, max: 1500 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const roundedMin = Math.max(0, Math.floor(min / 50) * 50);
    const roundedMax = Math.max(50, Math.ceil(max / 50) * 50);
    return { min: roundedMin, max: roundedMax };
  }, [allProducts]);

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
    const delay = serverFilterParamsKey ? 80 : 0;
    const timeoutId = window.setTimeout(() => {
      setDebouncedServerFilterParamsKey(serverFilterParamsKey);
    }, delay);
    return () => window.clearTimeout(timeoutId);
  }, [serverFilterParamsKey]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      const cachedSnapshot = readCategoryPageSnapshot(
        slug,
        subSlug,
        linkedBedSize,
        pageFromQuery,
        debouncedServerFilterParamsKey
      );
      const hasScopedFilters = loadedFilterScopeKey === requestedFilterScopeKey && availableFilters.length > 0;
      const needsFilterDefinitions =
        loadedFilterScopeKey !== requestedFilterScopeKey || (!cachedSnapshot && availableFilters.length === 0);
      let latestFilters =
        cachedSnapshot?.availableFilters && cachedSnapshot.availableFilters.length > 0
          ? cachedSnapshot.availableFilters
          : hasScopedFilters
          ? availableFilters
          : [];

      setLoadError(false);
      if (!slug) {
        setCategory(null);
        setSubcategories([]);
        setAllProducts([]);
        setTotalProductCount(null);
        setAvailableFilters([]);
        setLoadedFilterScopeKey('');
        setIsLoading(false);
        setIsFiltersLoading(false);
        return;
      }

      const currentCategorySlug = (category?.slug || '').trim().toLowerCase();
      const requestedSlug = (slug || '').trim().toLowerCase();
      const isSameCategory =
        currentCategorySlug === requestedSlug ||
        (requestedSlug === 'mattress' && currentCategorySlug === 'mattresses') ||
        (requestedSlug === 'mattresses' && currentCategorySlug === 'mattress');

      if (cachedSnapshot) {
        setCategory(cachedSnapshot.category);
        setSubcategories(cachedSnapshot.subcategories);
        setAllProducts(cachedSnapshot.products);
        setTotalProductCount(cachedSnapshot.totalProductCount);
        setLoadedProductKey(requestedProductKey);
        setAvailableFilters(needsFilterDefinitions ? [] : latestFilters);
        if (!needsFilterDefinitions) {
          setLoadedFilterScopeKey(requestedFilterScopeKey);
        }
        setIsLoading(false);
        setIsFiltersLoading(needsFilterDefinitions);
      } else {
        setIsFiltersLoading(needsFilterDefinitions);
        if (needsFilterDefinitions) {
          setAvailableFilters([]);
        }
        if (!isSameCategory) {
          setIsLoading(true);
          setAllProducts([]);
          setTotalProductCount(null);
        } else {
          setIsLoading(true);
        }
      }

      const apiOptions = {
        staleWhileRevalidate: true,
        maxStaleMs: CATEGORY_STALE_CACHE_MS,
        signal: controller.signal,
      };

      try {
        const findCategoryBySlug = (categories: Category[], candidate: string) =>
          categories.find((item) => (item.slug || '').trim().toLowerCase() === candidate.trim().toLowerCase()) ||
          null;
        const loadCategories = () =>
          apiGet<Category[]>('/categories/', apiOptions).catch(() => []);
        const tryFetchBySlug = async (candidate: string) =>
          apiGet<Category[]>(`/categories/?slug=${candidate}`, apiOptions).catch(() => []);

        const aliasSlug = slug === 'mattress' ? 'mattresses' : slug === 'mattresses' ? 'mattress' : '';
        const initialResolvedSlug = slug;
        const shouldLoadSizes = shouldRequestSizesForCategory(initialResolvedSlug, linkedBedSize);
        const productRequestLimit = INITIAL_PRODUCTS_LIMIT;
        const initialOffset = (pageFromQuery - 1) * PRODUCTS_PER_PAGE;
        const shouldIncludeTotal = true;
        const applyProductsResponse = (
          productsRes: ProductListResponse,
          snapshotCategory: Category | null = cachedSnapshot?.category ?? category,
          snapshotSubcategories: SubCategory[] = cachedSnapshot?.subcategories ?? subcategories
        ) => {
          const { products: nextProducts, count: nextCount } = normalizeProductListResponse(productsRes);
          const orderedProducts = placeProductsAtOffset([], nextProducts, initialOffset);
          warmProductImages(orderedProducts);
          setTotalProductCount(nextCount ?? nextProducts.length);
          setAllProducts(orderedProducts);
          setLoadedProductKey(requestedProductKey);
          setIsLoading(false);
          writeCategoryPageSnapshot(slug, subSlug, linkedBedSize, pageFromQuery, debouncedServerFilterParamsKey, {
            category: snapshotCategory,
            subcategories: snapshotSubcategories,
            products: orderedProducts,
            totalProductCount: nextCount ?? nextProducts.length,
            availableFilters: latestFilters,
          });
          return { orderedProducts, count: nextCount, normalizedProducts: nextProducts };
        };
        const productApiOptions = {
          ...apiOptions,
          refreshOnCacheHit: true,
          onUpdate: (data: unknown) => {
            if (cancelled) return;
            applyProductsResponse(data as ProductListResponse);
          },
        };

        const initialProductsPromise = apiGet<ProductListResponse>(
          buildCategoryProductsPath(
            initialResolvedSlug,
            subSlug,
            false,
            shouldLoadSizes,
            productRequestLimit,
            initialOffset,
            debouncedServerFilterParams,
            shouldIncludeTotal
          ),
          productApiOptions
        );
        const shouldRequestFilterDefinitions = needsFilterDefinitions;
        const initialFiltersPromise = shouldRequestFilterDefinitions
          ? apiGet<{ filters: FilterType[] }>(
              buildProductFiltersPath(initialResolvedSlug, subSlug),
              apiOptions
            )
          : Promise.resolve({ filters: latestFilters });
        if (shouldRequestFilterDefinitions) {
          void initialFiltersPromise
            .then((filtersRes) => {
              if (cancelled) return;
              const filters = Array.isArray(filtersRes?.filters) ? filtersRes.filters : [];
              latestFilters = filters;
              setAvailableFilters(filters);
              setLoadedFilterScopeKey(requestedFilterScopeKey);
            })
            .catch(() => {
              if (cancelled) return;
              setAvailableFilters([]);
            })
            .finally(() => {
              if (!cancelled) setIsFiltersLoading(false);
            });
        }
        if (!cachedSnapshot) {
          void initialProductsPromise
            .then((productsRes) => {
              if (cancelled) return;
              const { normalizedProducts } = applyProductsResponse(productsRes, null, []);
              if (normalizedProducts.length === 0) return;
            })
            .catch(() => undefined);
        }

        const allCategories = await loadCategories();
        let categoryItem = findCategoryBySlug(allCategories, slug);
        if (!categoryItem && aliasSlug) {
          categoryItem = findCategoryBySlug(allCategories, aliasSlug);
        }

        if (!categoryItem) {
          categoryItem =
            allCategories.find((c) => c.name?.trim().toLowerCase() === slug.replace(/-/g, ' ').toLowerCase()) ||
            null;
        }

        if (!categoryItem) {
          let categoryRes = await tryFetchBySlug(slug);
          if ((!categoryRes || categoryRes.length === 0) && aliasSlug) {
            categoryRes = await tryFetchBySlug(aliasSlug);
          }
          categoryItem = categoryRes?.[0] || null;
        }

        if (cancelled) return;

        setCategory(categoryItem);
        const resolvedSubcategories = Array.isArray(categoryItem?.subcategories) ? categoryItem.subcategories : [];
        setSubcategories(resolvedSubcategories);

        const resolvedSlug = categoryItem?.slug || slug;
        const needsSlugRetry = resolvedSlug !== initialResolvedSlug;
        const shouldRetryWithSizes = shouldRequestSizesForCategory(resolvedSlug, linkedBedSize);

        const productsRes = await (needsSlugRetry
          ? apiGet<ProductListResponse>(
              buildCategoryProductsPath(
                resolvedSlug,
                subSlug,
                false,
                shouldRetryWithSizes,
                productRequestLimit,
                initialOffset,
                debouncedServerFilterParams,
                shouldIncludeTotal
              ),
              productApiOptions
            )
          : initialProductsPromise);

        if (cancelled) return;

        const { orderedProducts, count, normalizedProducts } = applyProductsResponse(
          productsRes,
          categoryItem,
          resolvedSubcategories
        );
        writeCategoryPageSnapshot(slug, subSlug, linkedBedSize, pageFromQuery, debouncedServerFilterParamsKey, {
          category: categoryItem,
          subcategories: resolvedSubcategories,
          products: orderedProducts,
          totalProductCount: count ?? normalizedProducts.length,
          availableFilters: latestFilters,
        });

        if (!categoryItem && orderedProducts.length === 0) {
          setLoadError(true);
        }

        setIsLoading(false);

        if (!shouldRequestFilterDefinitions) {
          setIsFiltersLoading(false);
          return;
        }

        void (needsSlugRetry
          ? apiGet<{ filters: FilterType[] }>(
              buildProductFiltersPath(resolvedSlug, subSlug),
              apiOptions
            )
          : initialFiltersPromise)
          .then((filtersRes) => {
            const filters = Array.isArray(filtersRes?.filters) ? filtersRes.filters : [];
            latestFilters = filters;
            if (Array.isArray(filtersRes?.filters)) {
              setAvailableFilters(filters);
              setLoadedFilterScopeKey(requestedFilterScopeKey);
            } else {
              setAvailableFilters([]);
            }
            writeCategoryPageSnapshot(slug, subSlug, linkedBedSize, pageFromQuery, debouncedServerFilterParamsKey, {
              category: categoryItem,
              subcategories: resolvedSubcategories,
              products: orderedProducts,
              totalProductCount: count ?? normalizedProducts.length,
              availableFilters: filters,
            });
          })
          .catch(() => {
            setAvailableFilters([]);
          })
          .finally(() => {
            setIsFiltersLoading(false);
          });
      } catch (error) {
        if (cancelled || isAbortError(error)) return;
        setCategory(null);
        setSubcategories([]);
        if (!isSameCategory) {
          setAllProducts([]);
          setTotalProductCount(null);
        }
        setAvailableFilters([]);
        setLoadedFilterScopeKey('');
        setLoadError(true);
        setIsLoading(false);
        setIsFiltersLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedServerFilterParams, debouncedServerFilterParamsKey, linkedBedSize, pageFromQuery, requestedFilterScopeKey, requestedProductKey, slug, subSlug]);

  useEffect(() => {
    if (serverFilterParamsKey) return;
    if (!slug || availableFilters.length === 0) return;
    const categorySlug = category?.slug || slug;
    const includeSizes = shouldRequestSizesForCategory(categorySlug, linkedBedSize);
    const prefetchTargets = availableFilters
      .flatMap((filter) =>
        (filter.options || [])
          .filter((option) => (option.product_count ?? 1) > 0)
          .map((option) => ({ filterSlug: filter.slug, optionSlug: option.slug }))
      )
      .slice(0, FILTER_PREFETCH_SINGLE_LIMIT);

    if (prefetchTargets.length === 0) return;

    const prefetchParams = new Map<string, URLSearchParams>();
    prefetchTargets.forEach(({ filterSlug, optionSlug }) => {
      const params = new URLSearchParams();
      params.set(filterSlug, optionSlug);
      prefetchParams.set(params.toString(), params);
    });
    for (
      let leftIndex = 0;
      leftIndex < prefetchTargets.length && prefetchParams.size < FILTER_PREFETCH_SINGLE_LIMIT + FILTER_PREFETCH_PAIR_LIMIT;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < prefetchTargets.length && prefetchParams.size < FILTER_PREFETCH_SINGLE_LIMIT + FILTER_PREFETCH_PAIR_LIMIT;
        rightIndex += 1
      ) {
        const left = prefetchTargets[leftIndex];
        const right = prefetchTargets[rightIndex];
        const params = new URLSearchParams();
        if (left.filterSlug === right.filterSlug) {
          params.set(left.filterSlug, `${left.optionSlug},${right.optionSlug}`);
        } else {
          params.set(left.filterSlug, left.optionSlug);
          params.set(right.filterSlug, right.optionSlug);
        }
        prefetchParams.set(params.toString(), params);
      }
    }
    const prefetchParamSets = Array.from(prefetchParams.values());

    let cancelled = false;
    const warmFilterResults = async () => {
      for (let index = 0; index < prefetchParamSets.length && !cancelled; index += 2) {
        const batch = prefetchParamSets.slice(index, index + 2);
        await Promise.allSettled(
          batch.map((params) => {
            return apiGet<ProductListResponse>(
              buildCategoryProductsPath(
                categorySlug,
                subSlug,
                false,
                includeSizes,
                INITIAL_PRODUCTS_LIMIT,
                0,
                params,
                true
              ),
              {
                staleWhileRevalidate: true,
                maxStaleMs: CATEGORY_STALE_CACHE_MS,
              }
            );
          })
        );
      }
    };

    const timeoutId = window.setTimeout(() => {
      void warmFilterResults();
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [availableFilters, category?.slug, linkedBedSize, serverFilterParamsKey, slug, subSlug]);

  useEffect(() => {
    if (availableFilters.length === 0) {
      setSelectedFilters((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const next: Record<string, string[]> = {};
    availableFilters.forEach((filter) => {
      const optionSlugs = new Set(filter.options.map((option) => option.slug));
      const selected = parseFilterParamValues(searchParams, filter.slug).filter((value) => optionSlugs.has(value));
      if (selected.length > 0) {
        next[filter.slug] = selected;
      }
    });
    setSelectedFilters((prev) => (recordsEqual(prev, next) ? prev : next));
  }, [availableFilters, searchParams, searchParamsKey]);

  useEffect(() => {
    setSortBy((prev) => (prev === sortFromQuery ? prev : sortFromQuery));
  }, [sortFromQuery]);

  useEffect(() => {
    const minFromQuery = parseNumberParam(searchParams.get('min-price'));
    const maxFromQuery = parseNumberParam(searchParams.get('max-price'));
    let nextMin = minFromQuery == null ? priceBounds.min : clampNumber(minFromQuery, priceBounds.min, priceBounds.max);
    let nextMax = maxFromQuery == null ? priceBounds.max : clampNumber(maxFromQuery, priceBounds.min, priceBounds.max);
    if (nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }
    const nextRange = [nextMin, nextMax];
    setPriceRange((prev) => (rangesEqual(prev, nextRange) ? prev : nextRange));
  }, [priceBounds.max, priceBounds.min, searchParams, searchParamsKey]);

  useEffect(() => {
    if (!showSizeFilter) {
      setSelectedSizes((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const availableSizeMap = new Map(allSizes.map((size) => [toQuerySlug(size), size]));
    const nextSelectedSizes = parseMultiValueParam(searchParams, 'size')
      .map((value) => availableSizeMap.get(value) || '')
      .filter(Boolean);
    setSelectedSizes((prev) => (arraysEqual(prev, nextSelectedSizes) ? prev : nextSelectedSizes));
  }, [allSizes, searchParams, searchParamsKey, showSizeFilter]);

  const updateSearchParams = (updater: (params: URLSearchParams) => void, replace = true) => {
    const nextParams = new URLSearchParams(searchParams);
    updater(nextParams);
    if (nextParams.toString() === searchParamsKey) return;
    setSearchParams(nextParams, { replace });
  };

  const resetPageInSearch = (params: URLSearchParams) => {
    params.delete('page');
  };

  const updatePageInSearch = (nextPage: number, replace = false) => {
    updateSearchParams((nextParams) => {
      if (nextPage <= 1) nextParams.delete('page');
      else nextParams.set('page', String(nextPage));
    }, replace);
  };

  const goToPage = (nextPage: number, replace = false) => {
    const clampedPage = Math.min(Math.max(1, nextPage), totalPages);
    setCurrentPage(clampedPage);
    updatePageInSearch(clampedPage, replace);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    const normalizedSort = normalizeSortParam(value);
    setSortBy(normalizedSort);
    setCurrentPage(1);
    updateSearchParams((nextParams) => {
      if (normalizedSort === DEFAULT_SORT) nextParams.delete('sort');
      else nextParams.set('sort', normalizedSort);
      resetPageInSearch(nextParams);
    }, true);
  };

  const handlePriceRangeChange = (range: number[]) => {
    let [nextMin, nextMax] = range;
    if (nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }
    setPriceRange([nextMin, nextMax]);
    setCurrentPage(1);
    updateSearchParams((nextParams) => {
      if (nextMin <= priceBounds.min) nextParams.delete('min-price');
      else nextParams.set('min-price', String(nextMin));
      if (nextMax >= priceBounds.max) nextParams.delete('max-price');
      else nextParams.set('max-price', String(nextMax));
      resetPageInSearch(nextParams);
    }, true);
  };

  const toggleSize = (size: string) => {
    const nextSelectedSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((value) => value !== size)
      : [...selectedSizes, size];
    setSelectedSizes(nextSelectedSizes);
    setCurrentPage(1);
    updateSearchParams((nextParams) => {
      setMultiValueParam(
        nextParams,
        'size',
        nextSelectedSizes.map((value) => toQuerySlug(value))
      );
      resetPageInSearch(nextParams);
    }, true);
  };

  const toggleFilterOption = async (filterSlug: string, optionSlug: string) => {
    const current = selectedFilters[filterSlug] || [];
    const next = current.includes(optionSlug)
      ? current.filter((value) => value !== optionSlug)
      : [...current, optionSlug];
    const nextSelectedFilters = { ...selectedFilters };
    if (next.length > 0) nextSelectedFilters[filterSlug] = next;
    else delete nextSelectedFilters[filterSlug];
    setSelectedFilters(nextSelectedFilters);
    setCurrentPage(1);
    updateSearchParams((nextParams) => {
      const filterParamKey = getFilterParamKey(filterSlug);
      getFilterParamAliases(filterSlug)
        .filter((key) => key !== filterParamKey)
        .forEach((key) => nextParams.delete(key));
      setMultiValueParam(nextParams, filterParamKey, next);
      resetPageInSearch(nextParams);
    }, true);
  };

  const isFilterSelected = (filterSlug: string, optionSlug: string) =>
    (selectedFilters[filterSlug] || []).includes(optionSlug);

  const clearFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSelectedSizes([]);
    setSelectedFilters({});
    setCurrentPage(1);
    updateSearchParams((nextParams) => {
      nextParams.delete('min-price');
      nextParams.delete('max-price');
      nextParams.delete('size');
      availableFilters.forEach((filter) =>
        getFilterParamAliases(filter.slug).forEach((key) => nextParams.delete(key))
      );
      resetPageInSearch(nextParams);
    }, true);
  };

  const selectedSubcategory = useMemo(() => {
    if (!subSlug) return null;
    return (
      subcategories.find((sub) => sub.slug === subSlug) ||
      category?.subcategories?.find((sub) => sub.slug === subSlug) ||
      null
    );
  }, [category, subSlug, subcategories]);

  const resolvePageDiscountPercentage = (product: Product): number => {
    const productDiscount = Number(product.effective_discount_percentage ?? product.discount_percentage ?? 0);

    return Number.isFinite(productDiscount) ? productDiscount : 0;
  };

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

  useEffect(() => {
    if (!showSizeFilter && selectedSizes.length > 0) {
      setSelectedSizes([]);
    }
  }, [showSizeFilter, selectedSizes.length]);

  const hasPriceFilter = searchParams.has('min-price') || searchParams.has('max-price');

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    if (hasPriceFilter) {
      products = products.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }

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
  }, [allProducts, hasPriceFilter, priceRange, selectedSizes, showSizeFilter, showBedSizeFilter, linkedBedSize, sortBy]);

  const isShowingStaleProducts = loadedProductKey !== requestedProductKey;
  const isProductTransitionPending = isLoading || isShowingStaleProducts;
  const visibleProducts = filteredProducts;
  const hasClientSideFilters =
    selectedSizes.length > 0 ||
    hasPriceFilter ||
    Boolean(showBedSizeFilter && linkedBedSize);
  const displayProductCount = hasClientSideFilters
    ? visibleProducts.length
    : totalProductCount ?? Math.max(visibleProducts.length, currentPage * PRODUCTS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(displayProductCount / PRODUCTS_PER_PAGE));
  const displayRangeStart = displayProductCount === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const displayRangeEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, displayProductCount);

  const paginatedProducts = useMemo(() => {
    if (!hasClientSideFilters) {
      return visibleProducts.slice(0, PRODUCTS_PER_PAGE);
    }
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return visibleProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [currentPage, visibleProducts, hasClientSideFilters]);

  useEffect(() => {
    setCurrentPage((prev) => (prev === pageFromQuery ? prev : pageFromQuery));
  }, [pageFromQuery]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasClientSideFilters && totalProductCount == null) return;
    if (currentPage > totalPages) {
      goToPage(totalPages, true);
    }
  }, [currentPage, totalPages, isLoading, hasClientSideFilters, totalProductCount]);

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
        <div className="w-full px-4 py-3 md:px-8 md:py-4 lg:px-12">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
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

      <section className="w-full px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block sticky top-24 h-fit self-start">
            <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-border/60 p-6 space-y-8">
              <FilterContent
                priceRange={priceRange}
                setPriceRange={handlePriceRangeChange}
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

          <div className="space-y-6">
            <div className="space-y-2 text-left lg:max-w-none">
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
                Showing {displayRangeStart}
                {' '}-{' '}
                {displayRangeEnd} of {displayProductCount} products
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

                <Select value={sortBy} onValueChange={handleSortChange}>
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
                    setPriceRange={handlePriceRangeChange}
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
              {isProductTransitionPending && visibleProducts.length === 0 ? (
                <ProductLoadingNotice />
              ) : visibleProducts.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-card">
                  <div className="text-center">
                    <p className="mb-4 text-lg text-muted-foreground">No products match your filters</p>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        effective_discount_percentage: resolvePageDiscountPercentage(product),
                        discount_percentage: resolvePageDiscountPercentage(product),
                      }}
                      index={(currentPage - 1) * PRODUCTS_PER_PAGE + index}
                      fromBedProduct={linkedBedProduct}
                      selectedBedSize={linkedBedSize}
                      returnTo={returnTo}
                    />
                  ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        const isActive = page === currentPage;
                        return (
                          <button
                            key={page}
                            type="button"
                            aria-label={`Go to page ${page}`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => goToPage(page)}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-transparent text-foreground hover:border-primary/70 hover:bg-primary/10'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
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
