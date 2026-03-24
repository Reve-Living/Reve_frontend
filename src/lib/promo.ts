import type { CartItem, CartStatePromo } from '@/context/CartContext';

export const buildPromotionItemsPayload = (items: CartItem[]) =>
  items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.unit_price ?? item.product.price + (item.extras_total || 0),
  }));

export const getDiscountedUnitPriceMap = (
  items: CartItem[],
  promo: CartStatePromo | null
) => {
  const priceMap = new Map<string, number>();
  const applicableSet = new Set(promo?.applicableProductIds || []);
  const discountRate = (promo?.discountPercentage || 0) / 100;

  items.forEach((item) => {
    const baseUnit = item.unit_price ?? item.product.price + (item.extras_total || 0);
    const discountedUnit = applicableSet.has(item.product.id)
      ? Number((baseUnit * (1 - discountRate)).toFixed(2))
      : Number(baseUnit.toFixed(2));
    priceMap.set(
      `${item.product.id}-${item.size}-${item.color}-${JSON.stringify(item.selectedVariants || {})}-${item.quantity}`,
      discountedUnit
    );
  });

  return priceMap;
};
