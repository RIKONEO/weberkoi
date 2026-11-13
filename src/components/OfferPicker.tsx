"use client";

import { useEffect, useRef, useState } from "react";
import { type Offer, type TakenFish, available } from "@/lib/offers";
import { OfferVideo } from "./OfferVideo";
import { OfferEnquiry, type EnquiryHandle } from "./OfferEnquiry";
import { TakenGallery } from "./TakenFish";

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

/**
 * Upewnia się, że filmik ma zdekodowaną klatkę do skopiowania. Jeśli klient jeszcze go nie włączył
 * (przeglądarka ma wtedy tylko okładkę, a kopia klatki wychodzi czarna), puszczamy go na chwilę
 * bez dźwięku i zatrzymujemy na pierwszej klatce.
 */
async function ensureFrame(v: HTMLVideoElement) {
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
export function OfferPicker({ offer, taken, details }: { offer: Offer; taken: TakenFish[]; details: React.ReactNode }) {
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
  const canGrab = Boolean(offer.videoUrl) && cors && available(offer) > 0;

  async function grab() {
    const v = video.current;
    if (!v || busy) return;
    setBusy(true);
    try {
      if (!(await ensureFrame(v))) {
        setNote("Filmik jeszcze się wczytuje. Włącz go na chwilę i kliknij „Zrób stopklatkę” jeszcze raz.");
        return;
      }
      await capture(v);
    } finally {
      setBusy(false);
    }
  }

  async function capture(v: HTMLVideoElement) {
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    try {
      canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
      const frame = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
      if (!frame) throw new Error("brak klatki");
      setNote(enquiry.current?.addFrame(frame, clock(v.currentTime)) ? "" : "Masz już komplet zdjęć w zgłoszeniu. Usuń któreś, żeby dodać nowe.");
    } catch {
      setNote("Nie udało się zrobić stopklatki. Zrób zwykły screenshot i dodaj go w formularzu.");
    }
  }

  return (
    <div className="offer">
      <div>
        <OfferVideo
          offer={offer}
          controls
          videoRef={video}
          key={cors ? "cors" : "plain"}
          crossOrigin={cors ? "anonymous" : undefined}
          onError={() => cors && setCors(false)}
        />
        {canGrab && (
          <button type="button" className="btn btn--primary grab" onClick={grab} disabled={busy}>
            {busy ? "Robię stopklatkę…" : "Zrób stopklatkę"}
          </button>
        )}
        {note && <p className="notice notice--warn small" role="status">{note}</p>}
        <p className="muted small">
          {canGrab
            ? "Podoba Ci się ryba? Zatrzymaj filmik, kliknij „Zrób stopklatkę” i stuknij w rybę."
            : "Podoba Ci się ryba? Zatrzymaj filmik, zrób screenshot i wyślij go nam w formularzu obok."}
        </p>
        <TakenGallery taken={taken} />
      </div>
      <div className="stack">
        {details}
        <OfferEnquiry offer={offer} taken={taken} frameGrab={canGrab} ref={enquiry} />
      </div>
    </div>
  );
}
