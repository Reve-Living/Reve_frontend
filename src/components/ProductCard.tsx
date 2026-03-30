import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { formatWholePrice } from '@/lib/pricing';
import EdgeAwareCoverImage from '@/components/EdgeAwareCoverImage';

const normalizeStoredSizePrice = (productBasePrice: number, storedValue?: number): number => {
  const base = Number.isFinite(productBasePrice) ? Number(productBasePrice) : 0;
  const raw = Number(storedValue ?? 0);
  if (!Number.isFinite(raw)) return base;
  if (raw === 0) return base;
  if (base > 0 && raw < base) return base + raw;
  return raw;
};

interface ProductCardProps {
  product: Product;
  index?: number;
  fromBedProduct?: string; // slug of the bed product this mattress is being selected for
  selectedBedSize?: string; // the bed size that was selected on the bed product
}

const ProductCard = ({ product, index = 0, fromBedProduct, selectedBedSize }: ProductCardProps) => {
  // Calculate savings if there's an original price
  const savings = product.original_price ? product.original_price - product.price : 0;
  const sizePrices = Array.isArray(product.sizes)
    ? product.sizes
        .map((size) => normalizeStoredSizePrice(Number(product.price ?? 0), Number(size.price_delta)))
        .filter((price) => Number.isFinite(price) && price >= 0)
    : [];
  const displayBasePrice = sizePrices.length > 0 ? Math.min(...sizePrices) : product.price;
  const imageUrl = product.images?.[0]?.url || "";
  const hasImage = imageUrl.trim().length > 0;
  const shortText = (product.short_description || product.description || "").trim();
  const isDentonReclinerCard = product.name.trim().toLowerCase() === 'denton recliner with footstool - pu & pvc'.toLowerCase();
  const hasMultipleSizePrices = Array.isArray(product.sizes) && product.sizes.length > 1;
  const cardText = [
    product.name,
    product.category_name,
    product.subcategory_name,
    product.category_slug,
    product.subcategory_slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const needsAggressiveImageFill = [
    'table',
    'tables',
    'coffee',
    'console',
    'dining',
    'side table',
    'lamp table',
    'chair',
    'chairs',
    'glass top',
  ].some((token) => cardText.includes(token));
  // Build the product link - if coming from a bed product, add mattress selection params
  const productLink = fromBedProduct
    ? `/product/${product.slug}?select-for-bed=${encodeURIComponent(fromBedProduct)}${
        selectedBedSize ? `&bed-size=${encodeURIComponent(selectedBedSize)}` : ''
      }`
    : `/product/${product.slug}`;

  const isInMattressSelection = !!fromBedProduct;
  const buttonText = isInMattressSelection ? 'Select Mattress' : 'View Options';

  return (
    <div className="h-full">
      <Link
        to={productLink}
        className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        {hasImage && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <EdgeAwareCoverImage
              src={imageUrl}
              alt={product.name}
              containerAspectRatio={4 / 3}
              defaultStyle={
                isDentonReclinerCard
                  ? { objectPosition: '50% 30%' }
                  : needsAggressiveImageFill
                    ? { baseScale: 1.18, hoverScale: 1.24 }
                    : undefined
              }
            />

            {/* Badges */}
            <div className="absolute right-3 top-3 flex flex-col gap-2 items-end">
              {product.is_bestseller && (
                <Badge className="bg-primary text-primary-foreground">
                  Bestseller
                </Badge>
              )}
              {product.is_new && !product.original_price && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  New
                </Badge>
              )}
              {savings > 0 && product.original_price && (
                <Badge className="bg-white text-card-foreground shadow font-semibold">
                  Sale {Math.round((savings / product.original_price) * 100)}%
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 gap-3">
          {!hasImage && (
            <div className="flex flex-wrap gap-2">
              {product.is_bestseller && (
                <Badge className="bg-primary text-primary-foreground">
                  Bestseller
                </Badge>
              )}
              {product.is_new && !product.original_price && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  New
                </Badge>
              )}
              {savings > 0 && product.original_price && (
                <Badge className="bg-white text-card-foreground shadow font-semibold">
                  Sale {Math.round((savings / product.original_price) * 100)}%
                </Badge>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-primary text-primary'
                    : 'fill-transparent text-muted-foreground/60'
                }`}
                strokeWidth={1.8}
              />
            ))}
            <span className="ml-1 text-sm text-muted-foreground">
              ({product.review_count})
            </span>
          </div>

          {/* Name */}
          <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2 min-h-[48px] lining-nums">
            {product.name}
          </h3>

          {/* Short Feature Line */}
          {shortText && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {shortText}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">
              {hasMultipleSizePrices ? `From ${formatWholePrice(displayBasePrice)}` : formatWholePrice(displayBasePrice)}
            </p>
            {product.original_price && product.original_price > displayBasePrice && (
              <p className="text-sm text-muted-foreground line-through">
                {formatWholePrice(product.original_price)}
              </p>
            )}
          </div>

          {/* View Options Button */}
          <Button className="mt-auto w-full gradient-bronze">
            {buttonText}
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
