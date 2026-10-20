"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import s from "./ScrollKoi.module.css";

// Film „przewijany” scrollem: ScrollyVideo dekoduje klatki (WebCodecs) i ustawia je
// według postępu, a GSAP ScrollTrigger mierzy scroll i prowadzi napisy nad wodą.
// Filmy w /public/animated to na razie wersja tymczasowa wyrenderowana z naszego stawu.
const CLIPS = {
  poziom: { src: "/animated/koi-poziomo.mp4", poster: "/animated/koi-poziomo.jpg" },
  pion: { src: "/animated/koi-pionowo.mp4", poster: "/animated/koi-pionowo.jpg" },
} as const;

type Direction = "auto" | keyof typeof CLIPS;

const CHAPTERS = [
  {
    eyebrow: "WEBER Nishikigoi",
    title: (
      <>
        Koi, które widzisz, <em>zanim kupisz</em>.
      </>
    ),
    text: "Przewiń powoli. Ryby płyną razem z Tobą.",
  },
  {
    eyebrow: "Z Japonii i z naszej hodowli",
    title: <>Kohaku, Sanke, Showa, Ogon, Chagoi.</>,
    text: "Każdą grupę nagrywamy w naszym stawie, w naturalnym świetle, bez filtrów.",
  },
  {
    eyebrow: "Jak kupić",
    title: <>Zatrzymaj film. Wybierz rybę.</>,
    text: "Zrób screenshot ryby, którą chcesz, i wyślij go przy ofercie. Potwierdzimy ją i ustalimy płatność.",
  },
  {
    eyebrow: "Do Twojego stawu",
    title: (
      <>
        Kurier pn–śr albo <em>odbiór osobisty</em>.
      </>
    ),
    text: "Pakujemy w worki z tlenem i kartony termiczne.",
    cta: true,
  },
];

export function ScrollKoi({ direction }: { direction: Direction }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<keyof typeof CLIPS | null>(direction === "auto" ? null : direction);
  const [ready, setReady] = useState(false);

  // „auto”: poziomy film na szerokim ekranie, pionowy na telefonie trzymanym pionowo.
  useEffect(() => {
    if (direction !== "auto") return setClip(direction);
    const mq = window.matchMedia("(orientation: portrait)");
    const pick = () => setClip(mq.matches ? "pion" : "poziom");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, [direction]);

  useEffect(() => {
    if (!clip) return;
    let disposed = false;
    let cleanup = () => {};
    setReady(false);
    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("scrolly-video/dist/ScrollyVideo.js")]).then(
      ([{ gsap }, { ScrollTrigger }, { default: ScrollyVideo }]) => {
        const section = sectionRef.current, stage = stageRef.current, box = videoRef.current, rail = railRef.current;
        if (disposed || !section || !stage || !box || !rail) return;
        gsap.registerPlugin(ScrollTrigger);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let progress = 0;
        const video = new ScrollyVideo({
          src: CLIPS[clip].src,
          scrollyVideoContainer: box,
          cover: true,
          sticky: false,
          full: false,
          trackScroll: false,
          transitionSpeed: 10,
          useWebCodecs: true,
          onReady: () => {
            if (disposed) return;
            video.setVideoPercentage(progress, { jump: true });
            setReady(true);
          },
        });

        const ctx = gsap.context(() => {
          const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", stage);
          const setRail = gsap.quickSetter(rail, "scaleX");
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: reduce ? true : 0.8,
              onUpdate: (st) => {
                progress = st.progress;
                video.setVideoPercentage(progress);
                setRail(progress);
              },
            },
          });
          // delikatny „najazd kamery” na wodę przez całą sekwencję
          if (!reduce) tl.fromTo(box, { scale: 1.12 }, { scale: 1, ease: "none", duration: chapters.length }, 0);
          chapters.forEach((el, i) => {
            const parts = el.querySelectorAll("[data-part]");
            const from = reduce ? { autoAlpha: 0 } : { autoAlpha: 0, y: 36, filter: "blur(10px)" };
            const to = reduce ? { autoAlpha: 1 } : { autoAlpha: 1, y: 0, filter: "blur(0px)" };
            if (i === 0) gsap.set(parts, to);
            else tl.fromTo(parts, from, { ...to, duration: 0.35, stagger: 0.08 }, i - 0.15);
            if (i < chapters.length - 1) {
              tl.to(parts, { autoAlpha: 0, y: reduce ? 0 : -28, filter: reduce ? "none" : "blur(6px)", duration: 0.3, stagger: 0.05, ease: "power1.in" }, i + 0.55);
            }
          });
          tl.fromTo(`.${s.scrim}`, { opacity: 0.35 }, { opacity: 0.75, duration: 0.6 }, chapters.length - 1);
          tl.to(`.${s.hint}`, { autoAlpha: 0, duration: 0.2 }, 0.1);
        }, stage);

        cleanup = () => {
          ctx.revert();
          video.destroy();
        };
      },
    );
    return () => {
      disposed = true;
      cleanup();
    };
  }, [clip]);

  const poster = clip ? CLIPS[clip].poster : undefined;

  return (
    <main>
      <section ref={sectionRef} className={s.scene} style={{ height: `${CHAPTERS.length * 115}svh` }}>
        <div ref={stageRef} className={s.stage} data-ready={ready}>
          <div className={s.poster} style={poster ? { backgroundImage: `url(${poster})` } : undefined} aria-hidden />
          <div ref={videoRef} className={s.video} aria-hidden />
          <div className={s.scrim} aria-hidden />
          <SiteHeader overlay />
          {CHAPTERS.map((c, i) => (
            <div key={i} className={`wrap ${s.chapter} ${i === 0 ? s.first : ""}`} data-chapter>
              <div className="eyebrow" data-part>
                {c.eyebrow}
              </div>
              {i === 0 ? <h1 data-part>{c.title}</h1> : <h2 data-part>{c.title}</h2>}
              <p data-part>{c.text}</p>
              {c.cta && (
                <div className="row" data-part>
                  <Link href="/katalog" className="btn btn--primary">
                    Zobacz katalog
                  </Link>
                  <Link href="/kontakt" className="btn btn--glass">
                    Kontakt
                  </Link>
                </div>
              )}
            </div>
          ))}
          <div className={s.hint} aria-hidden>
            <span />
            Przewiń
          </div>
          <div className={s.rail} aria-hidden>
            <div ref={railRef} />
          </div>
        </div>
      </section>

      <aside className={s.preview} aria-label="Wersja poglądowa">
        <b>Podgląd</b>
        <Link href="/animated?kierunek=poziom" scroll={false} className="chip" aria-pressed={clip === "poziom"}>
          Z lewej na prawą
        </Link>
        <Link href="/animated?kierunek=pion" scroll={false} className="chip" aria-pressed={clip === "pion"}>
          Z góry w dół
        </Link>
      </aside>
    </main>
  );
}
