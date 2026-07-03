import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, matchPath, useLocation } from "react-router-dom";
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
const SITE_URL = "https://www.reveliving.co.uk";
const INDEXABLE_ROUTES = [
  "/",
  "/category/:slug/subcategories",
  "/category/:slug",
  "/product/:slug",
  "/about",
  "/contact",
  "/categories",
  "/collections",
  "/terms-conditions",
  "/privacy-policy",
  "/delivery",
  "/returns-refunds",
  "/faq",
  "/divan-beds",
  "/transform-your-home/:slug",
];
const NOINDEX_ROUTES = ["/cart", "/checkout", "/login", "/signup", "/coming-soon/:slug"];

const getCanonicalPath = (pathname: string, search: string) => {
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const params = new URLSearchParams(search);
  const subcategory = params.get("sub");

  if (subcategory && matchPath({ path: "/category/:slug", end: true }, normalizedPath)) {
    return `${normalizedPath}?sub=${encodeURIComponent(subcategory)}`;
  }

  return normalizedPath;
};

const SeoMeta = () => {
  const location = useLocation();

  useEffect(() => {
    const canonicalPath = getCanonicalPath(location.pathname, location.search);
    const canonicalHref = `${SITE_URL}${canonicalPath}`;
    const isIndexable = INDEXABLE_ROUTES.some((path) => matchPath({ path, end: true }, location.pathname));
    const isNoindex = NOINDEX_ROUTES.some((path) => matchPath({ path, end: true }, location.pathname));
    const robotsContent = !isIndexable || isNoindex ? "noindex, follow" : "index, follow";

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", robotsContent);
  }, [location.pathname, location.search]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ComingSoonGate>
      <TooltipProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <CartProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <SeoMeta />
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
