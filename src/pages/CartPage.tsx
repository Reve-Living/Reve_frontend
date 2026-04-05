import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';


import Header from '@/components/Header';

import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { apiPost } from '@/lib/api';
import type { PromotionAvailabilityResponse, PromotionValidationResponse } from '@/lib/types';
import { buildPromotionItemsPayload } from '@/lib/promo';
import { toast } from 'sonner';

const getVariantsKey = (item: {
  selectedVariants?: Record<string, string>;
  mattresses?: { id: number; position?: 'top' | 'bottom' | 'both' | null }[];
  fabric?: string;
  dimension?: string;
  dimension_details?: string;
  extras_total?: number;
  include_dimension?: boolean;
  assembly_service_selected?: boolean;
  assembly_service_price?: number;
  mattress_id?: number | null;
  mattress_position?: 'top' | 'bottom' | 'both' | null;
}) =>
  JSON.stringify({
    selectedVariants: item.selectedVariants || {},
    mattresses: (item.mattresses || []).map((m) => ({ id: m.id, position: m.position || null })),
    fabric: item.fabric || '',
    dimension: item.dimension || '',
    dimension_details: item.dimension_details || '',
    extras_total: item.extras_total || 0,
    include_dimension: item.include_dimension !== false,
    assembly_service_selected: item.assembly_service_selected === true,
    assembly_service_price: item.assembly_service_price || 0,
    mattress_id: item.mattress_id || null,
    mattress_position: item.mattress_position || null,
  });

const CartPage = () => {
  const {
    state,
    removeItem,
    updateQuantity,
    totalPrice,
    promoDiscount,
    discountedTotalPrice,
    setAppliedPromo,
    clearAppliedPromo,
  } = useCart();
  const [promoCode, setPromoCode] = useState(state.appliedPromo?.code || '');
  const [promoAvailable, setPromoAvailable] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const sanitize = (value?: string) =>
    (value || '')
      .replace(/[^A-Za-z0-9\s\-\.,:()£€'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const metaLine = (item: any) => {
    const parts: string[] = [];
    const size = sanitize(item.size);
    const color = sanitize(item.color);
    if (size) parts.push(`Size: ${size}`);
    if (color) parts.push(`Colour: ${color}`);
    return parts.join(' | ');
  };

  const deliveryFee = discountedTotalPrice >= 500 ? 0 : 49;

  const orderTotal = discountedTotalPrice + deliveryFee;

  useEffect(() => {
    setPromoCode(state.appliedPromo?.code || '');
  }, [state.appliedPromo?.code]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (state.items.length === 0) {
        setPromoAvailable(false);
        clearAppliedPromo();
        return;
      }

      setIsCheckingPromo(true);
      try {
        const response = await apiPost<PromotionAvailabilityResponse>('/promotions/availability/', {
          items: buildPromotionItemsPayload(state.items),
        });
        setPromoAvailable(Boolean(response.has_applicable_promotion));
        if (!response.has_applicable_promotion) {
          clearAppliedPromo();
          setPromoCode('');
        }
      } catch {
        setPromoAvailable(false);
      } finally {
        setIsCheckingPromo(false);
      }
    };

    void checkAvailability();
  }, [state.items, clearAppliedPromo]);

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    try {
      const response = await apiPost<PromotionValidationResponse>('/promotions/validate_code/', {
        code: promoCode.trim(),
        items: buildPromotionItemsPayload(state.items),
      });
      setAppliedPromo({
        promotionId: response.promotion_id,
        promotionName: response.promotion_name,
        code: response.code,
        discountPercentage: response.discount_percentage,
        discountAmount: response.discount_amount,
        applicableProductIds: response.applicable_product_ids,
      });
      setPromoCode(response.code);
      toast.success('Promo code applied');
    } catch {
      clearAppliedPromo();
      toast.error('Promo code is invalid for the current cart');
    } finally {
      setIsApplyingPromo(false);
    }
  };



  return (

    <div className="min-h-screen bg-background">
<Header />



      <main className="container mx-auto px-4 py-8">

        <h1 className="mb-8 font-serif text-3xl font-bold md:text-4xl">Shopping Cart</h1>



        {state.items.length === 0 ? (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="flex flex-col items-center justify-center py-16"

          >

            <ShoppingBag className="mb-4 h-24 w-24 text-muted-foreground/30" />

            <h2 className="mb-2 text-2xl font-semibold text-muted-foreground">

              Your cart is empty

            </h2>

            <p className="mb-6 text-muted-foreground">

              Looks like you haven't added any items to your cart yet.

            </p>

            <Button asChild size="lg" className="gradient-bronze">

              <Link to="/collections">Start Shopping</Link>

            </Button>

          </motion.div>

        ) : (

          <div className="grid gap-8 lg:grid-cols-3">

            {/* Cart Items */}

            <div className="lg:col-span-2">

              <div className="space-y-4">

                {state.items.map((item) => (
                  <motion.div
                    key={`${item.product.id}-${item.size}-${item.color}-${getVariantsKey(item)}`}
                    layout

                    initial={{ opacity: 0, y: 10 }}

                    animate={{ opacity: 1, y: 0 }}

                    exit={{ opacity: 0, x: -100 }}

                    className="flex gap-4 rounded-lg bg-card p-4 shadow-luxury md:gap-6 md:p-6"

                  >

                    {/* Image */}

                    {item.product.images[0]?.url && (
                      <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">
                        <img
                          src={item.product.images[0]?.url}
                          alt={item.product.name}
                          className="h-24 w-24 rounded-md object-cover md:h-32 md:w-32"
                        />
                      </Link>
                    )}



                    {/* Details */}

                    <div className="flex flex-1 flex-col">

                      <div className="flex items-start justify-between">

                        <div>

                          <Link

                            to={`/product/${item.product.slug}`}

                            className="font-serif text-lg font-semibold text-foreground hover:text-primary md:text-xl"

                          >

                            {item.product.name}

                          </Link>

                          {metaLine(item) && (
                            <p className="mt-1 text-sm text-muted-foreground">{metaLine(item)}</p>
                          )}
                          {item.dimension && (
                            <p className="text-sm text-muted-foreground">
                              Dimension: {sanitize(item.dimension)}
                            </p>
                          )}
                          {item.dimension_details && (
                            <p className="text-xs text-muted-foreground">
                              {sanitize(item.dimension_details)}
                            </p>
                          )}
                          {item.fabric && (
                            <p className="text-sm text-muted-foreground">
                              Fabric: {sanitize(item.fabric)}
                            </p>
                          )}
                          {Array.isArray(item.mattresses) && item.mattresses.length > 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Mattresses:{' '}
                              {item.mattresses
                                .map((m) => {
                                  const label = m.name || 'Mattress';
                                  const pos = m.position ? ` (${m.position})` : '';
                                  const price =
                                    typeof m.price === 'number' ? ` (${m.price.toFixed(2)})` : '';
                                  return `${label}${pos}${price}`;
                                })
                                .join(' • ')}
                            </p>
                          ) : item.mattress_name ? (
                            <p className="text-sm text-muted-foreground">
                              Mattress: {item.mattress_name}
                              {typeof item.mattress_price === 'number'
                                ? ` (${item.mattress_price.toFixed(2)})`
                                : ''}
                            </p>
                          ) : null}
                          {item.assembly_service_selected && (
                            <p className="text-sm text-muted-foreground">
                              Assembly Service: GBP {Number(item.assembly_service_price || 0).toFixed(2)}
                            </p>
                          )}
                          {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {Object.entries(item.selectedVariants)
                                .map(([group, value]) => `${group}: ${value}`)
                                .join(' | ')}
                            </p>
                          )}
                        </div>

                        <p className="text-lg font-bold text-primary md:text-xl">

                          GBP {((item.unit_price ?? item.product.price) * item.quantity).toFixed(2)}

                        </p>

                      </div>



                      <div className="mt-auto flex items-center justify-between pt-4">

                        {/* Quantity Controls */}

                        <div className="flex items-center rounded-md border border-border">

                          <button

                            onClick={() =>

                              updateQuantity(

                                item.product.id,
                                item.size,
                                item.color,
                                getVariantsKey(item),
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="p-2 hover:bg-muted"

                          >

                            <Minus className="h-4 w-4" />

                          </button>

                          <span className="w-10 text-center text-sm">{item.quantity}</span>

                          <button

                            onClick={() =>

                              updateQuantity(

                                item.product.id,
                                item.size,
                                item.color,
                                getVariantsKey(item),
                                item.quantity + 1
                              )
                            }
                            className="p-2 hover:bg-muted"

                          >

                            <Plus className="h-4 w-4" />

                          </button>

                        </div>



                        {/* Remove */}

                        <button

                          onClick={() => removeItem(item.product.id, item.size, item.color, getVariantsKey(item))}
                          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-destructive"

                        >

                          <Trash2 className="h-4 w-4" />

                          <span className="hidden sm:inline">Remove</span>

                        </button>

                      </div>

                    </div>

                  </motion.div>

                ))}

              </div>



              {/* Continue Shopping */}

              <div className="mt-6">

                <Button asChild variant="outline" className="gap-2 border-accent">

                  <Link to="/">

                    Continue Shopping

                  </Link>

                </Button>

              </div>

            </div>



            {/* Order Summary */}

            <div className="lg:col-span-1">

              <div className="sticky top-32 rounded-lg bg-card p-6 shadow-luxury">

                <h2 className="mb-6 font-serif text-xl font-semibold">Order Summary</h2>



                <div className="space-y-4">

                  <div className="flex justify-between">

                    <span className="text-muted-foreground">Subtotal</span>

                    <span className="font-medium">GBP {totalPrice.toFixed(2)}</span>

                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Promo {state.appliedPromo?.code ? `(${state.appliedPromo.code})` : ''}
                      </span>
                      <span className="font-medium text-primary">-GBP {promoDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">

                    <span className="text-muted-foreground">Delivery</span>

                    <span className="font-medium">

                      {deliveryFee === 0 ? (

                        <span className="text-primary">FREE</span>

                      ) : (

                        `GBP ${deliveryFee.toFixed(2)}`

                      )}

                    </span>

                  </div>

                  {discountedTotalPrice < 500 && (

                    <p className="text-sm text-muted-foreground">

                      Add GBP {(500 - discountedTotalPrice).toFixed(2)} more for free delivery

                    </p>

                  )}



                  <div className="border-t border-border pt-4">

                    <div className="flex justify-between">

                      <span className="text-lg font-semibold">Total</span>

                      <span className="text-xl font-bold text-primary">

                        GBP {orderTotal.toFixed(2)}

                      </span>

                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">Including VAT</p>

                  </div>

                </div>



                {/* Promo Code */}

                {promoAvailable && (
                  <div className="mt-6 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code"
                        className="border-accent"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      />
                      <Button
                        variant="outline"
                        className="border-accent"
                        onClick={applyPromo}
                        disabled={isApplyingPromo}
                      >
                        {isApplyingPromo ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                    {state.appliedPromo && (
                      <div className="flex items-center justify-between rounded-md bg-primary/5 px-3 py-2 text-sm">
                        <span>
                          {state.appliedPromo.code} applied for {state.appliedPromo.discountPercentage}% off
                        </span>
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => {
                            clearAppliedPromo();
                            setPromoCode('');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {!promoAvailable && !isCheckingPromo && (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Promo codes are not available for the current cart items.
                  </p>
                )}



                {/* Checkout Button */}

                <Button asChild size="lg" className="mt-6 w-full gradient-bronze gap-2">

                  <Link to="/checkout">

                    Proceed to Checkout

                    <ArrowRight className="h-4 w-4" />

                  </Link>

                </Button>



                {/* Payment Methods */}

                <div className="mt-6 text-center">

                  <p className="mb-2 text-sm text-muted-foreground">We Accept</p>

                  <div className="flex justify-center gap-2">

                    {['Visa', 'Mastercard', 'PayPal', 'COD'].map((method) => (

                      <span

                        key={method}

                        className="rounded bg-muted px-2 py-1 text-xs"

                      >

                        {method}

                      </span>

                    ))}

                  </div>

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



export default CartPage;


