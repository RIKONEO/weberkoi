"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Pond } from "@/lib/pond/createPond";
import { SiteHeader } from "./SiteHeader";

export function PondHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pondRef = useRef<Pond | null>(null);
  const [mode, setMode] = useState<"loading" | "live" | "still" | "none">("loading");
  const [fed, setFed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let onVisibility: (() => void) | undefined;
    // Three.js ładujemy dopiero w przeglądarce, osobnym kawałkiem, żeby nie spowalniał reszty strony.
    import("@/lib/pond/createPond").then(({ createPond }) => {
      if (disposed || !canvasRef.current || !sectionRef.current) return;
      const pond = createPond(canvasRef.current, sectionRef.current, { fishCount: 12 });
      if (!pond) return setMode("none");
      pondRef.current = pond;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return setMode("still");
      setMode("live");
      let visible = true;
      const sync = () => (visible && !document.hidden ? pond.start() : pond.stop());
      observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
      observer.observe(sectionRef.current);
      onVisibility = sync;
      document.addEventListener("visibilitychange", onVisibility);
      sync();
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      pondRef.current?.dispose();
      pondRef.current = null;
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" data-mode={mode}>
      <canvas
        ref={canvasRef}
        className="hero__pond"
        aria-label="Animowany staw z rybami koi. Kliknij w wodę, żeby rzucić karmę."
        onPointerDown={() => setFed(true)}
      />
      {mode === "none" && <div className="hero__fallback" aria-hidden />}
      <div className="hero__scrim" />
      <SiteHeader overlay />
      <div className="wrap hero__copy">
        <div className="eyebrow">Koi z Japonii i z naszej hodowli</div>
        <h1>
          Każda ryba <em>na filmiku</em>, zanim trafi do Twojego stawu.
        </h1>
        <p>Kohaku, Sanke, Showa, Ogon i Chagoi. Wybierz konkretną rybę albo zaufaj nam i kup sztukę z grupy.</p>
        <div className="row">
          <Link href="/katalog" className="btn btn--primary">
            Zobacz katalog
          </Link>
          {mode !== "none" && (
            <button type="button" className="btn btn--glass" onClick={() => { pondRef.current?.feed(); setFed(true); }}>
              Nakarm ryby
            </button>
          )}
        </div>
      </div>
      {mode === "live" && (
        <div className="hero__hint" style={{ opacity: fed ? 0 : 1 }}>
          Kliknij w wodę, żeby rzucić karmę
        </div>
      )}
    </section>
  );
}
