import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { toast } from 'sonner';

const categoryInfo: Record<string, { title: string; description: string; image: string }> = {
  wardrobes: {
    title: 'Wardrobes',
    description: 'Our stunning collection of wardrobes is being carefully curated. From sleek sliding door designs to classic hinged options, we\'re preparing storage solutions that combine style with functionality.',
    image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&h=600&fit=crop',
  },
  'bedside-tables': {
    title: 'Bedside Tables',
    description: 'Complete your bedroom with our upcoming range of bedside tables. We\'re handcrafting elegant nightstands that perfectly complement our bed collections.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
  },
  furniture: {
    title: 'Furniture Collection',
    description: 'We\'re expanding our furniture range to help you create the perfect home. Stay tuned for wardrobes, bedside tables, and more beautiful pieces.',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=600&fit=crop',
  },
};

const ComingSoonPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = categoryInfo[slug || 'furniture'] || categoryInfo.furniture;

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('We\'ll notify you when this collection launches!');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      
      <main className="pb-20">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
          <img
            src={category.image}
            alt={category.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/50 to-espresso/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-cream">Coming Soon</span>
              </div>
              <h1 className="font-serif text-4xl font-bold text-cream md:text-5xl lg:text-6xl">
                {category.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            {/* Back Link */}
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="rounded-2xl bg-card p-8 shadow-luxury md:p-12">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-8 w-8 text-primary" />
              </div>

              <h2 className="mb-4 font-serif text-2xl font-bold text-foreground md:text-3xl">
                Something Beautiful is Coming
              </h2>

              <p className="mb-8 text-muted-foreground">
                {category.description}
              </p>

              {/* Notify Form */}
              <div className="mx-auto max-w-md">
                <p className="mb-4 text-sm font-medium text-foreground">
                  Be the first to know when we launch
                </p>
                <form onSubmit={handleNotify} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 flex-1 border-border bg-background"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gradient-bronze h-11 px-6 font-semibold"
                  >
                    {isSubmitting ? 'Submitting...' : 'Notify Me'}
                  </Button>
                </form>
              </div>

              {/* Features Preview */}
              <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-foreground">Handcrafted</p>
                  <p className="text-sm text-muted-foreground">UK Made Quality</p>
                </div>
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-foreground">Free Delivery</p>
                  <p className="text-sm text-muted-foreground">On All Orders</p>
                </div>
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-foreground">10-Year Warranty</p>
                  <p className="text-sm text-muted-foreground">Quality Guaranteed</p>
                </div>
              </div>
            </div>

            {/* Browse Other Categories */}
            <div className="mt-12">
              <p className="mb-4 text-muted-foreground">
                While you wait, explore our current collections
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link to="/category/beds">Shop Beds</Link>
                </Button>
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link to="/category/mattresses">Shop Mattresses</Link>
                </Button>
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link to="/category/sofas">Shop Sofas</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComingSoonPage;
