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
  const raf = useRef(0);
  const [mode, setMode] = useState<"loading" | "live" | "still" | "none">("loading");
  const [active, setActive] = useState<"koi" | "art" | null>(null);

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
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Ruch kursora: zmienne CSS na sekcji (paralaksa i światło), bez przerysowywania Reacta.
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", ((x / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--my", ((y / r.height) * 2 - 1).toFixed(3));
      el.style.setProperty("--px", `${x.toFixed(0)}px`);
      el.style.setProperty("--py", `${y.toFixed(0)}px`);
    });
  };
  const hover = (side: "koi" | "art" | null) => () => setActive(side);

  return (
    <section
      ref={sectionRef}
      className="hero hero--split"
      data-mode={mode}
      data-active={active ?? undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={hover(null)}
    >
      <canvas ref={canvasRef} className="hero__pond" aria-hidden />
      {mode === "none" && <div className="hero__fallback" aria-hidden />}
      <SiteHeader overlay />
      {/* Nagłówek strony dla Google i czytników ekranu; wizualnie hero mówi to kaflami. */}
      <h1 className="visually-hidden">Karpie koi na sprzedaż: sklep z rybami koi WEBER Nishikigoi w Zakrzewie</h1>
      <nav className="split" aria-label="Co oglądasz?">
        <Link
          href="/katalog"
          className="side side--koi"
          onPointerEnter={hover("koi")}
          onFocus={hover("koi")}
          onBlur={hover(null)}
        >
          <span className="side__shade" aria-hidden />
          <span className="side__light" aria-hidden />
          <span className="side__body">
            <span className="side__eyebrow">Z Japonii i z naszej hodowli</span>
            <span className="side__title">Ryby koi</span>
            <span className="side__kinds">Kohaku, Sanke, Showa, Ogon i Chagoi</span>
            <span className="side__go">Zobacz katalog <span aria-hidden>→</span></span>
          </span>
        </Link>
        <div className="split__art">
          <Link
            href={ART.path}
            className="side side--art"
            onPointerEnter={hover("art")}
            onFocus={hover("art")}
            onBlur={hover(null)}
          >
            <span className="side__img" aria-hidden />
            <span className="side__light" aria-hidden />
            <span className="side__body">
              <span className="side__eyebrow">{ART.tagline}</span>
              <span className="side__title">{ART.name}</span>
              <span className="side__kinds">Nasze wzory, cięte na wymiar do{"\u00a0"}2{"\u00a0"}×{"\u00a0"}2{"\u00a0"}m</span>
              <span className="side__go">Zobacz obrazy <span aria-hidden>→</span></span>
            </span>
          </Link>
        </div>
        <span className="split__seam" aria-hidden />
      </nav>
    </section>
  );
}
