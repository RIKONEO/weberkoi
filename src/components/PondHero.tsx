"use client";

import Link from "next/link";
import { ART } from "@/lib/offers";
import { useEffect, useRef, useState } from "react";
import type { Pond } from "@/lib/pond/createPond";
import { SiteHeader } from "./SiteHeader";

export function PondHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pondRef = useRef<Pond | null>(null);
  const [mode, setMode] = useState<"loading" | "live" | "still" | "none">("loading");

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
      />
      {mode === "none" && <div className="hero__fallback" aria-hidden />}
      <div className="hero__scrim" />
      <SiteHeader overlay />
      <nav className="wrap hero__doors" aria-label="Co oglądasz?">
        <Link href="/katalog" className="door door--koi">
          <span className="door__glass" aria-hidden />
          <span className="door__body">
            <span className="door__eyebrow">Z Japonii i z naszej hodowli</span>
            <span className="door__title">Ryby koi</span>
            <span className="door__go">Zobacz katalog <span aria-hidden>→</span></span>
          </span>
        </Link>
        <Link href={ART.path} className="door door--art">
          <span className="door__img" aria-hidden />
          <span className="door__glow" aria-hidden />
          <span className="door__body">
            <span className="door__eyebrow">{ART.tagline}</span>
            <span className="door__title">{ART.name}</span>
            <span className="door__go">Zobacz obrazy <span aria-hidden>→</span></span>
          </span>
        </Link>
      </nav>
    </section>
  );
}
