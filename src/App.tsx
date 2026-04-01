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
import CategoryPage from "./pages/CategoryPage";
import CategorySubcategoriesPage from "./pages/CategorySubcategoriesPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import CategoriesPage from "./pages/CategoriesPage";
import CollectionsPage from "./pages/CollectionsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ReturnsRefundsPage from "./pages/ReturnsRefundsPage";
import DeliveryInformationPage from "./pages/DeliveryInformationPage";
import FaqPage from "./pages/FaqPage";
import DivanBedsPage from "./pages/DivanBedsPage";
import LifestyleArticlePage from "./pages/LifestyleArticlePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ComingSoonGate>
  </QueryClientProvider>
);

export default App;
