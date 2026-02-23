import { ReactNode, useEffect, useMemo, useState } from "react";

type ComingSoonGateProps = {
  children: ReactNode;
};

const SLIDE_INTERVAL_MS = 3800;
const STORAGE_KEY = "reve_gate_dismissed";

const ComingSoonGate = ({ children }: ComingSoonGateProps) => {
  const slides = useMemo(
    () => [
      {
        image:
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1800&q=80",
        headline: "Coming Soon",
        subhead: "We’re putting the final polish on your new furniture experience.",
      },
      {
        image:
          "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1800&q=80",
        headline: "Almost Ready",
        subhead: "Curated collections, crafted comfort — launching shortly.",
      },
      {
        image:
          "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1800&q=80",
        headline: "Finishing Touches",
        subhead: "Sneak a peek now or check back soon for the full experience.",
      },
    ],
    []
  );

  const [activeSlide, setActiveSlide] = useState(0);
  const [showGate, setShowGate] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setShowGate(false);
    }
  }, []);

  useEffect(() => {
    if (!showGate) return;
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => {
      document.body.style.overflow = "";
      clearInterval(timer);
    };
  }, [showGate, slides.length]);

  const handleEnter = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShowGate(false);
    // Ensure scroll is re-enabled even if the effect cleanup hasn’t run yet
    document.body.style.overflow = "";
  };

  if (!showGate) return <>{children}</>;

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              idx === activeSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.7)",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="max-w-3xl text-center text-white space-y-6">
          <span className="inline-block rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
            Preview
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            {slides[activeSlide].headline}
          </h1>
          <p className="text-lg sm:text-xl text-white/80">
            {slides[activeSlide].subhead}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleEnter}
              className="w-full sm:w-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-black/40"
            >
              View Current Site
            </button>
            <a
              href="mailto:info@example.com"
              className="w-full sm:w-auto rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Notify Me on Launch
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 pt-4">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition ${
                  idx === activeSlide ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Subtle footer cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center text-xs uppercase tracking-[0.3em] text-white/50">
        Press “View Current Site” to continue
      </div>
    </div>
  );
};

export default ComingSoonGate;
