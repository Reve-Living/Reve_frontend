import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopOnNavigate from "@/components/ScrollToTopOnNavigate";
import ComingSoonGate from "@/components/ComingSoonGate";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";

const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const CategorySubcategoriesPage = lazy(() => import("./pages/CategorySubcategoriesPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const TermsConditionsPage = lazy(() => import("./pages/TermsConditionsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const ReturnsRefundsPage = lazy(() => import("./pages/ReturnsRefundsPage"));
const DeliveryInformationPage = lazy(() => import("./pages/DeliveryInformationPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const DivanBedsPage = lazy(() => import("./pages/DivanBedsPage"));
const LifestyleArticlePage = lazy(() => import("./pages/LifestyleArticlePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const routeFallback = <div className="min-h-screen bg-background" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ComingSoonGate>
      <TooltipProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <CartProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <ScrollToTop />
            <ScrollToTopOnNavigate />
            <WhatsAppButton />
            <Suspense fallback={routeFallback}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/category/:slug/subcategories" element={<CategorySubcategoriesPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/coming-soon/:slug" element={<ComingSoonPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/terms-conditions" element={<TermsConditionsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/delivery" element={<DeliveryInformationPage />} />
                <Route path="/returns-refunds" element={<ReturnsRefundsPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/divan-beds" element={<DivanBedsPage />} />
                <Route path="/transform-your-home/:slug" element={<LifestyleArticlePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ComingSoonGate>
  </QueryClientProvider>
);

export default App;
