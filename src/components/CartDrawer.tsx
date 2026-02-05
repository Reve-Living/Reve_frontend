import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

const CartDrawer = () => {
  const { state, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-espresso/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 right-0 top-0 z-[60] flex w-full max-w-md flex-col bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-semibold">Your Cart</h2>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <p className="mb-2 text-lg font-medium text-muted-foreground">
                    Your cart is empty
                  </p>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Start shopping to add items
                  </p>
                  <Button onClick={closeCart} asChild>
                    <Link to="/category/divan-beds">Shop Now</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 rounded-lg bg-card p-4"
                    >
                      <img
                        src={item.product.images[0]?.url}
                        alt={item.product.name}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <div className="flex flex-1 flex-col">
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {item.size} • {item.color}
                        </p>
                        <p className="mt-1 font-semibold text-primary">
                          £{item.product.price}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 rounded-md border border-border">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="p-1 hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() =>
                              removeItem(item.product.id, item.size, item.color)
                            }
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t border-border px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-bold text-foreground">
                    £{totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Shipping calculated at checkout
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="gradient-bronze w-full">
                    <Link to="/checkout" onClick={closeCart}>
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full border-accent"
                    onClick={closeCart}
                  >
                    <Link to="/cart">View Cart</Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
