import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import AnnouncementBar from '@/components/AnnouncementBar';

import Header from '@/components/Header';

import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';

const getVariantsKey = (item: {
  selectedVariants?: Record<string, string>;
  fabric?: string;
  dimension?: string;
  dimension_details?: string;
  extras_total?: number;
  include_dimension?: boolean;
  mattress_id?: number | null;
}) =>
  JSON.stringify({
    selectedVariants: item.selectedVariants || {},
    fabric: item.fabric || '',
    dimension: item.dimension || '',
    dimension_details: item.dimension_details || '',
    extras_total: item.extras_total || 0,
    include_dimension: item.include_dimension !== false,
    mattress_id: item.mattress_id || null,
  });

const CartPage = () => {
  const { state, removeItem, updateQuantity, totalPrice } = useCart();



  const deliveryFee = totalPrice >= 500 ? 0 : 49;

  const orderTotal = totalPrice + deliveryFee;



  return (

    <div className="min-h-screen bg-background">

      <AnnouncementBar />

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

              <Link to="/category/divan-beds">Start Shopping</Link>

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

                    <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">

                      <img
                        src={item.product.images[0]?.url}
                        alt={item.product.name}
                        className="h-24 w-24 rounded-md object-cover md:h-32 md:w-32"
                      />
                    </Link>



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

                          <p className="mt-1 text-sm text-muted-foreground">
                            Size: {item.size} | Colour: {item.color}
                          </p>
                          {item.dimension && (
                            <p className="text-sm text-muted-foreground">Dimension: {item.dimension}</p>
                          )}
                          {item.dimension_details && (
                            <p className="text-xs text-muted-foreground">{item.dimension_details}</p>
                          )}
                          {item.fabric && (
                            <p className="text-sm text-muted-foreground">
                              Fabric: {item.fabric}
                            </p>
                          )}
                          {item.mattress_name && (
                            <p className="text-sm text-muted-foreground">
                              Mattress: {item.mattress_name}
                              {typeof item.mattress_price === 'number'
                                ? ` (${item.mattress_price.toFixed(2)})`
                                : ''}
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

                    Ã¢ÂÂ Continue Shopping

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

                  {totalPrice < 500 && (

                    <p className="text-sm text-muted-foreground">

                      Add GBP {(500 - totalPrice).toFixed(2)} more for free delivery

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

                <div className="mt-6">

                  <div className="flex gap-2">

                    <Input placeholder="Promo code" className="border-accent" />

                    <Button variant="outline" className="border-accent">

                      Apply

                    </Button>

                  </div>

                </div>



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

