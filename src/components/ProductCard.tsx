import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  // Calculate savings if there's an original price
  const savings = product.original_price ? product.original_price - product.price : 0;
  const imageUrl = product.images?.[0]?.url || "";
  const shortText = (product.short_description || product.description || "").trim();
  const gbpFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  });

  return (
    <div className="h-full">
      <Link
        to={`/product/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
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
            {savings > 0 && (
              <Badge className="bg-white text-card-foreground shadow">
                Save {gbpFormatter.format(savings)}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 gap-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
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
              From {gbpFormatter.format(product.price)}
            </p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-sm text-muted-foreground line-through">
                {gbpFormatter.format(product.original_price)}
              </p>
            )}
          </div>

          {/* View Options Button */}
          <Button className="mt-auto w-full gradient-bronze">
            View Options
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
