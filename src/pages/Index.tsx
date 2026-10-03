const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-center">
      <section
        aria-labelledby="site-status-heading"
        className="mx-auto max-w-2xl"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Site unavailable
        </p>
        <h1
          id="site-status-heading"
          className="font-serif text-4xl font-bold text-foreground md:text-5xl"
        >
          Website is not active right now
        </h1>
      </section>
    </main>
  );
};

export default Index;
