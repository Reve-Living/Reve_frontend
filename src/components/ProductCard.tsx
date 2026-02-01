import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  // Calculate savings if there's an original price
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group block overflow-hidden rounded-lg bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.isBestseller && (
              <Badge className="bg-primary text-primary-foreground">
                Bestseller
              </Badge>
            )}
            {product.isNew && !product.originalPrice && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                New
              </Badge>
            )}
            {savings > 0 && (
              <Badge variant="destructive">
                Save £{savings}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Rating */}
          <div className="mb-2 flex items-center gap-1">
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

          {/* Name */}
          <h3 className="mb-1 font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>

          {/* Short Feature Line */}
          <p className="mb-3 text-sm text-muted-foreground line-clamp-1">
            {product.shortDescription}
          </p>

          {/* Price */}
          <p className="mb-3 text-lg font-bold text-primary">
            From £{product.price}
          </p>

          {/* View Options Button */}
          <Button className="w-full gradient-bronze">
            View Options
          </Button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
