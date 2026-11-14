"use client";

import { useEffect, useRef, useState } from "react";
import { type FishMap as FishMapData, type MapStatuses, type Offer, type TakenFish, available } from "@/lib/offers";
import { OfferVideo } from "./OfferVideo";
import { OfferEnquiry, type EnquiryHandle } from "./OfferEnquiry";
import { TakenGallery } from "./TakenFish";
import { FishMap } from "./FishMap";

function clock(t: number) {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Czeka na pierwszą wyświetloną klatkę filmiku (albo na upływ czasu). */
function nextFrame(v: HTMLVideoElement, timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.removeEventListener("timeupdate", onTime);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(v.readyState >= 2), timeoutMs);
    const start = v.currentTime;
    // Przeglądarki bez requestVideoFrameCallback: wystarczy, że czas filmiku ruszył.
    const onTime = () => v.currentTime !== start && v.readyState >= 2 && finish(true);
    if (typeof v.requestVideoFrameCallback === "function") v.requestVideoFrameCallback(() => finish(true));
    else (v as HTMLVideoElement).addEventListener("timeupdate", onTime);
  });
}

/** Czeka, aż przeglądarka skończy przewijanie i pokaże klatkę z nowego miejsca. */
function seekDone(v: HTMLVideoElement) {
  if (!v.seeking) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 4000);
    v.addEventListener("seeked", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

/** Krok przycisków „klatka w przód / w tył” (ok. 1/25 s, czyli jedna klatka). */
const STEP = 0.04;

/**
 * Upewnia się, że filmik ma zdekodowaną klatkę do skopiowania. Jeśli klient jeszcze go nie włączył
 * (przeglądarka ma wtedy tylko okładkę, a kopia klatki wychodzi czarna), puszczamy go na chwilę
 * bez dźwięku i zatrzymujemy na pierwszej klatce.
 */
async function ensureFrame(v: HTMLVideoElement) {
  await seekDone(v);
  if (v.readyState >= 2 && v.played.length > 0 && v.videoWidth) {
    v.pause();
    return true;
  }
  v.muted = true;
  const ready = nextFrame(v, 6000);
  try {
    await v.play();
  } catch {
    // Odtwarzanie zablokowane: spróbujemy jeszcze, jeśli klatka i tak się wczyta.
  }
  const ok = await ready;
  v.pause();
  return ok && v.videoWidth > 0;
}

/**
 * Filmik oferty z przyciskiem „Zrób stopklatkę” i formularzem zgłoszenia obok. Stopklatka trafia
 * prosto do formularza, więc klient nie musi robić i wgrywać zrzutu ekranu.
 */
export function OfferPicker({
  offer,
  taken,
  details,
  map,
  statuses = {},
}: {
  offer: Offer;
  taken: TakenFish[];
  details: React.ReactNode;
  /** Wspólna mapa ryb; gdy jest, zastępuje „Zrób stopklatkę”. */
  map?: FishMapData;
  statuses?: MapStatuses;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const enquiry = useRef<EnquiryHandle>(null);
  // Klatkę da się odczytać tylko, gdy serwer z filmikami pozwala (CORS). Jeśli nie pozwala,
  // wczytujemy filmik zwyczajnie i zostaje sam screenshot.
  const [cors, setCors] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // Błąd wczytania mógł się zdarzyć, zanim React podpiął onError.
  useEffect(() => {
    if (cors && video.current?.error) setCors(false);
  }, [cors]);
  const hasMap = Boolean(map && map.markers.length);
  const canGrab = !hasMap && Boolean(offer.videoUrl) && cors && available(offer) > 0;

  // Tryb wyboru klatki: duży suwak i przyciski klatka po klatce, wygodne na telefonie.
  const [picking, setPicking] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Suwak podąża za filmikiem (także gdy klient używa przycisków odtwarzacza).
  useEffect(() => {
    const v = video.current;
    if (!v || !picking) return;
    let raf = 0;
    const sync = () => {
      setTime(v.currentTime);
      if (Number.isFinite(v.duration)) setDuration(v.duration);
      setPlaying(!v.paused);
    };
    const loop = () => {
      sync();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [picking, cors]);

  async function startPicking() {
    const v = video.current;
    if (!v) return;
    setNote("");
    setPicking(true);
    v.muted = true;
    // Puszczamy filmik: klient zatrzymuje go na rybie albo przewija suwakiem.
    try {
      await v.play();
    } catch {
      // Odtwarzanie zablokowane: zostaje suwak, klatka wczyta się przy przewijaniu.
    }
    requestAnimationFrame(() => wrap.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function seek(to: number) {
    const v = video.current;
    if (!v) return;
    v.pause();
    const end = Number.isFinite(v.duration) ? v.duration : to;
    v.currentTime = Math.max(0, Math.min(end, to));
    setTime(v.currentTime);
  }

  function togglePlay() {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.muted = true;
      v.play().catch(() => {});
    } else v.pause();
  }

  async function grab() {
    const v = video.current;
    if (!v || busy) return;
    setBusy(true);
    try {
      if (!(await ensureFrame(v))) {
        setNote("Filmik jeszcze się wczytuje. Poczekaj chwilę i kliknij jeszcze raz.");
        return;
      }
      if (await capture(v)) setPicking(false);
    } finally {
      setBusy(false);
    }
  }

  async function capture(v: HTMLVideoElement): Promise<boolean> {
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    try {
      canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
      const frame = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
      if (!frame) throw new Error("brak klatki");
      const why = enquiry.current ? enquiry.current.addFrame(frame, clock(v.currentTime)) : "Formularz jeszcze się wczytuje.";
      if (!why) return true;
      setNote(why);
      return false;
    } catch {
      setNote("Nie udało się zrobić stopklatki. Zrób zwykły screenshot i dodaj go w formularzu.");
    }
    return false;
  }

  return (
    <div className="offer">
      <div ref={wrap}>
        <OfferVideo
          offer={offer}
          controls
          videoRef={video}
          key={cors ? "cors" : "plain"}
          crossOrigin={cors ? "anonymous" : undefined}
          onError={() => cors && setCors(false)}
        />
        {canGrab && !picking && (
          <button type="button" className="btn btn--primary grab" onClick={startPicking}>
            Zrób stopklatkę
          </button>
        )}
        {canGrab && picking && (
          <div className="picker" role="group" aria-label="Wybór klatki do stopklatki">
            <p className="picker__hint small">
              Zatrzymaj filmik na rybie albo przesuń suwak. Strzałkami ustawisz dokładną klatkę.
            </p>
            <input
              type="range"
              className="picker__range"
              min={0}
              max={duration || 0}
              step={STEP}
              value={Math.min(time, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Moment filmiku"
              disabled={!duration}
            />
            <div className="picker__row">
              <button type="button" className="btn picker__step" onClick={() => seek(time - STEP)} aria-label="Klatka wstecz">❘◀</button>
              <button type="button" className="btn picker__step" onClick={togglePlay} aria-label={playing ? "Zatrzymaj" : "Odtwórz"}>
                {playing ? "❚❚" : "▶"}
              </button>
              <button type="button" className="btn picker__step" onClick={() => seek(time + STEP)} aria-label="Klatka dalej">▶❘</button>
              <span className="picker__time num">{clock(time)} / {clock(duration)}</span>
            </div>
            <div className="picker__row">
              <button type="button" className="btn btn--primary picker__go" onClick={grab} disabled={busy}>
                {busy ? "Robię stopklatkę…" : "Zaznacz rybę na tej klatce"}
              </button>
              <button type="button" className="btn" onClick={() => setPicking(false)}>Anuluj</button>
            </div>
          </div>
        )}
        {note && <p className="notice notice--warn small" role="status">{note}</p>}
        {hasMap && map ? (
          <FishMap offer={offer} map={map} statuses={statuses} />
        ) : (
        <p className="muted small">
          {canGrab
            ? "Podoba Ci się ryba? Kliknij „Zrób stopklatkę”, wybierz moment z rybą, stuknij w nią i dodaj do koszyka."
            : "Podoba Ci się ryba? Zatrzymaj filmik, zrób screenshot i dodaj go w formularzu obok do koszyka."}
        </p>
        )}
        <TakenGallery taken={taken} />
      </div>
      <div className="stack">
        {details}
        <OfferEnquiry offer={offer} taken={taken} frameGrab={canGrab} hasMap={hasMap} ref={enquiry} />
      </div>
    </div>
  );
}
