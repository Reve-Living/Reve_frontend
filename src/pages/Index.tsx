import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-20">
        <section className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Temporarily unavailable
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
            Website is not active right now
          </h1>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

