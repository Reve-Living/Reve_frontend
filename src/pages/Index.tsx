import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import CategoryGrid from '@/components/CategoryGrid';
import BestsellersSection from '@/components/BestsellersSection';
import LifestyleSection from '@/components/LifestyleSection';
import TrustSection from '@/components/TrustSection';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
<Header />
      <main>
        <HeroSlider />
        <CategoryGrid />
        <BestsellersSection />
        <TrustSection />

                        <LifestyleSection />

        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

