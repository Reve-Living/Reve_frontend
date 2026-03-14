import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, Wallet, Banknote, Check, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { apiPost } from '@/lib/api';
import type { ProductStyle } from '@/lib/types';
import { toast } from 'sonner';

type CheckoutStep = 'information' | 'payment' | 'confirmation';

const STYLE_OPTION_KEY_RE = /^(\d+)-(\d+)$/;

const resolveVariantValue = (styles: ProductStyle[] | undefined, rawValue: string) => {
  const value = (rawValue || '').trim();
  if (!value) return value;

  const match = STYLE_OPTION_KEY_RE.exec(value);
  if (!match || !styles?.length) return value;

  const styleId = Number(match[1]);
  const optionIndex = Number(match[2]);
  const styleGroup = styles.find((style) => Number(style.id) === styleId);
  if (!styleGroup || !Array.isArray(styleGroup.options)) return value;

  const option = styleGroup.options[optionIndex];
  if (!option || typeof option === 'string') return value;

  return option.label || value;
};

const getVariantsKey = (item: {
  selectedVariants?: Record<string, string>;
  mattresses?: { id: number; position?: 'top' | 'bottom' | 'both' | null }[];
  fabric?: string;
  dimension?: string;
  dimension_details?: string;
  extras_total?: number;
  include_dimension?: boolean;
  mattress_id?: number | null;
}) =>
  JSON.stringify({
    selectedVariants: item.selectedVariants || {},
    mattresses: (item.mattresses || []).map((m) => ({ id: m.id, position: m.position || null })),
    fabric: item.fabric || '',
    dimension: item.dimension || '',
    dimension_details: item.dimension_details || '',
    extras_total: item.extras_total || 0,
    include_dimension: item.include_dimension !== false,
    mattress_id: item.mattress_id || null,
  });

const getVariantSummary = (item: {
  product?: { styles?: ProductStyle[] };
  selectedVariants?: Record<string, string>;
  mattresses?: { name?: string | null; position?: 'top' | 'bottom' | 'both' | null }[];
  fabric?: string;
  dimension?: string;
  dimension_details?: string;
  extras_total?: number;
  include_dimension?: boolean;
  mattress_name?: string | null;
}) => {
  const parts: string[] = [];
  const seen = new Set<string>();
  const addPart = (text?: string) => {
    const cleaned = (text || '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(cleaned);
  };

  const hasExplicitMattress =
    (item.mattresses && item.mattresses.length > 0) || Boolean(item.mattress_name);

  // Variants, skipping mattress-like entries if a dedicated mattress field exists
  Object.entries(item.selectedVariants || {}).forEach(([group, value]) => {
    const lowerGroup = group.trim().toLowerCase();
    if (hasExplicitMattress && lowerGroup.includes('mattress')) return;
    addPart(`${group}: ${resolveVariantValue(item.product?.styles, String(value))}`);
  });

  if (item.fabric) addPart(`Fabric: ${item.fabric}`);

  // Prefer detailed dimensions block; fall back to simple dimension label
  if (item.dimension_details) {
    addPart(item.dimension_details);
  } else if (item.dimension) {
    addPart(`Dimension: ${item.dimension}`);
  }

  // Mattress info – choose one source to avoid repeats
  if (Array.isArray(item.mattresses) && item.mattresses.length > 0) {
    addPart(
      `Mattress${item.mattresses.length > 1 ? 'es' : ''}: ${item.mattresses
        .map((m) => `${m.name || 'Mattress'}${m.position ? ` (${m.position})` : ''}`)
        .join(', ')}`
    );
  } else if (item.mattress_name) {
    addPart(`Mattress: ${item.mattress_name}`);
  }

  return parts.join(' | ');
};

const getStyleSummary = (item: {
  product?: { styles?: ProductStyle[] };
  selectedVariants?: Record<string, string>;
  mattresses?: { name?: string | null; position?: 'top' | 'bottom' | 'both' | null }[];
  fabric?: string;
  mattress_name?: string | null;
}) => {
  const parts: string[] = [];
  const seen = new Set<string>();
  const addPart = (text?: string) => {
    const cleaned = (text || '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(cleaned);
  };

  const hasExplicitMattress =
    (item.mattresses && item.mattresses.length > 0) || Boolean(item.mattress_name);

  Object.entries(item.selectedVariants || {}).forEach(([group, value]) => {
    const lowerGroup = group.trim().toLowerCase();
    if (hasExplicitMattress && lowerGroup.includes('mattress')) return;
    addPart(`${group}: ${resolveVariantValue(item.product?.styles, String(value))}`);
  });

  if (item.fabric) addPart(`Fabric: ${item.fabric}`);

  if (Array.isArray(item.mattresses) && item.mattresses.length > 0) {
    addPart(
      `Mattress${item.mattresses.length > 1 ? 'es' : ''}: ${item.mattresses
        .map((m) => `${m.name || 'Mattress'}${m.position ? ` (${m.position})` : ''}`)
        .join(', ')}`
    );
  } else if (item.mattress_name) {
    addPart(`Mattress: ${item.mattress_name}`);
  }

  return parts.join(' | ');
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { state, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('information');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = state.items.reduce(
    (sum, item) => sum + (item.product.delivery_charges || 0) * item.quantity,
    0
  );
  const orderTotal = totalPrice + deliveryFee;

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    saveInfo: false,
    termsAccepted: false,
    specialNotes: '',
  });
  const [referenceImages, setReferenceImages] = useState<
    { id: string; previewUrl: string; dataUrl: string; name: string }[]
  >([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const paypalToken = params.get('token');
    if (paypalToken) {
      apiPost('/payments/capture_paypal_order/', { orderID: paypalToken });
    }
    if (success === '1' || paypalToken) {
      const lastOrderId = localStorage.getItem('last_order_id');
      if (lastOrderId) {
        apiPost(`/orders/${lastOrderId}/mark_paid/`, {
          payment_method: 'paypal',
          payment_id: paypalToken || 'paypal',
        });
      }
      setStep('confirmation');
      clearCart();
    }
  }, [clearCart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, specialNotes: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImages((prev) => [
          ...prev,
          {
            id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            previewUrl: URL.createObjectURL(file),
            dataUrl: reader.result as string,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setReferenceImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleContinue = () => {
    if (step === 'information') {
      if (
        !formData.email ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.address ||
        !formData.city ||
        !formData.postcode ||
        !formData.phone
      ) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep('payment');
    } else if (step === 'payment') {
      if (!formData.termsAccepted) {
        toast.error('Please accept the Terms & Conditions to continue');
        return;
      }
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const orderPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postcode,
        total_amount: orderTotal,
        delivery_charges: deliveryFee,
        payment_method: paymentMethod,
        items: state.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.unit_price ?? item.product.price,
          size: item.size,
          color: item.color,
          style: getStyleSummary(item),
          dimension: item.dimension,
          dimension_details: item.dimension_details,
          selected_variants: item.selectedVariants || {},
          extras_total: item.extras_total || 0,
          include_dimension: item.include_dimension !== false,
        })),
        special_notes: formData.specialNotes.trim() || undefined,
        reference_images: referenceImages.map((img) => img.dataUrl),
      };

      const orderRes = await apiPost<{ id: number }>('/orders/', orderPayload);
      localStorage.setItem('last_order_id', String(orderRes.id));

      if (paymentMethod === 'cod') {
        setStep('confirmation');
        clearCart();
        return;
      }

      if (paymentMethod === 'card') {
        try {
          const session = await apiPost<{ url: string; id: string }>('/payments/create_stripe_session/', {
            items: state.items.map((item) => ({
              name: item.product.name,
              price: String(item.unit_price ?? item.product.price),
              quantity: item.quantity,
            })),
            delivery_charges: String(deliveryFee),
            currency: 'gbp',
            order_id: orderRes.id,
            success_url: `${window.location.origin}/checkout?success=1`,
            cancel_url: `${window.location.origin}/checkout?canceled=1`,
          });
          if (session.url) {
            window.location.href = session.url;
            return;
          } else {
            toast.error('Failed to initialize payment. Please try again.');
            return;
          }
        } catch (error: any) {
          console.error('Stripe session creation failed:', error);
          const serverMessage =
            error?.response?.data?.error ||
            error?.message ||
            'Payment initialization failed. Please try again.';
          toast.error(serverMessage);
          return;
        }
      }

      if (paymentMethod === 'paypal') {
        const paypalOrder = await apiPost<{ links: { rel: string; href: string }[] }>(
          '/payments/create_paypal_order/',
          {
            total: orderTotal.toFixed(2),
            currency: 'GBP',
            order_id: orderRes.id,
            return_url: `${window.location.origin}/checkout?success=1`,
            cancel_url: `${window.location.origin}/checkout?canceled=1`,
          }
        );
        const approvalLink = paypalOrder.links.find((link) => link.rel === 'approve');
        if (approvalLink) {
          window.location.href = approvalLink.href;
          return;
        }
        toast.error('Failed to initialize PayPal. Please try again.');
        return;
      }
    } catch (err) {
      toast.error('Order failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (state.items.length === 0 && step !== 'confirmation') {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<Header />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-8 flex items-center gap-2 text-sm">
          <Link to="/cart" className="text-muted-foreground hover:text-primary">
            Cart
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 'information' ? 'text-primary' : 'text-muted-foreground'}>
            Information
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 'payment' ? 'text-primary' : 'text-muted-foreground'}>
            Payment
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 'confirmation' ? 'text-primary' : 'text-muted-foreground'}>
            Confirmation
          </span>
        </nav>

        {step === 'confirmation' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                <Check className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="mb-4 font-serif text-3xl font-bold">Thank You for Your Order!</h1>
            <p className="mb-2 text-muted-foreground">Order placed successfully</p>
            <p className="mb-8 text-muted-foreground">
              We've sent a confirmation email to {formData.email}
            </p>
            <div className="mb-8 rounded-lg bg-card p-6 text-left">
              <h3 className="mb-4 font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• You'll receive an order confirmation email shortly</li>
                <li>• Our team will prepare your order for delivery</li>
                <li>• Estimated delivery: 3-5 working days</li>
              </ul>
            </div>
            <Button asChild size="lg" className="gradient-bronze">
              <Link to="/">Continue Shopping</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {step === 'information' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg bg-card p-6 shadow-luxury"
                >
                  <h2 className="mb-6 font-serif text-2xl font-semibold">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="mt-1 border-accent"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1 border-accent"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1 border-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Delivery Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="mt-1 border-accent"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1 border-accent"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          name="postcode"
                          value={formData.postcode}
                          onChange={handleInputChange}
                          className="mt-1 border-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+44"
                        className="mt-1 border-accent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="saveInfo"
                        checked={formData.saveInfo}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, saveInfo: checked as boolean })
                        }
                      />
                      <Label htmlFor="saveInfo" className="text-sm">
                        Save this information for next time
                      </Label>
                    </div>

                    <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Special notes & reference images (optional)</p>
                          <p className="text-xs text-muted-foreground">
                            Tell us about custom requests and attach inspiration photos. Both fields are optional.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div>
                          <Label htmlFor="specialNotes" className="text-sm">Special notes</Label>
                          <Textarea
                            id="specialNotes"
                            name="specialNotes"
                            value={formData.specialNotes}
                            onChange={handleNotesChange}
                            placeholder="e.g., Please match buttons to swatch attached. Deliver after 5pm."
                            className="mt-1 border-accent"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="referenceImages" className="text-sm">Reference images</Label>
                          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              id="referenceImages"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              className="border-accent"
                            />
                            <p className="text-xs text-muted-foreground sm:ml-2">
                              Optional. You can add multiple images (JPG, PNG, WEBP).
                            </p>
                          </div>
                          {referenceImages.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {referenceImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-white"
                                >
                                  <img
                                    src={img.previewUrl}
                                    alt={img.name || 'Reference'}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                                    aria-label="Remove image"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg bg-card p-6 shadow-luxury"
                >
                  <h2 className="mb-6 font-serif text-2xl font-semibold">Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
                      <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                        paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex flex-1 cursor-pointer items-center gap-3">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Credit / Debit Card</p>
                            <p className="text-sm text-muted-foreground">
                              Visa, Mastercard, American Express
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                        paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex flex-1 cursor-pointer items-center gap-3">
                          <Wallet className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-muted-foreground">
                              Pay securely with PayPal. Pay in 3 available.
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                        paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex flex-1 cursor-pointer items-center gap-3">
                          <Banknote className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">
                              Pay when your order arrives
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-4">
                        <Checkbox
                          id="termsAccepted"
                          checked={formData.termsAccepted}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, termsAccepted: checked as boolean })
                          }
                        />
                        <Label htmlFor="termsAccepted" className="text-sm leading-relaxed cursor-pointer">
                          I accept the{' '}
                          <Link to="/terms-conditions" target="_blank" className="text-primary hover:underline">
                            Terms & Conditions
                          </Link>
                          {', '}
                          <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                          {', and '}
                          <Link to="/returns-refunds" target="_blank" className="text-primary hover:underline">
                            Returns & Refunds Policy
                          </Link>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setStep('information')}
                      className="text-muted-foreground"
                    >
                      ← Back to Information
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={isProcessing}
                  className="w-full gradient-bronze text-lg font-semibold sm:w-auto"
                >
                  {isProcessing
                    ? 'Processing...'
                    : step === 'information'
                    ? 'Continue to Payment'
                    : `Pay £${orderTotal.toFixed(2)}`}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-32 rounded-lg bg-card p-6 shadow-luxury">
                <h2 className="mb-6 font-serif text-xl font-semibold">Order Summary</h2>
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}-${item.color}-${getVariantsKey(item)}`}
                      className="flex gap-3"
                    >
                      <div className="relative">
                        <img
                          src={item.product.images[0]?.url}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} / {item.color}
                        </p>
                        {getVariantSummary(item) && (
                          <p className="text-xs text-muted-foreground">{getVariantSummary(item)}</p>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        £{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>£{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>£{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary">£{orderTotal.toFixed(2)}</span>
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

export default CheckoutPage;

