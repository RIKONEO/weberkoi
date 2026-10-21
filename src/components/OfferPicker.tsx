"use client";

import { useEffect, useRef, useState } from "react";
import { type Offer, available } from "@/lib/offers";
import { OfferVideo } from "./OfferVideo";
import { OfferEnquiry, type EnquiryHandle } from "./OfferEnquiry";

function clock(t: number) {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Filmik oferty z przyciskiem „Zrób stopklatkę” i formularzem zgłoszenia obok. Stopklatka trafia
 * prosto do formularza, więc klient nie musi robić i wgrywać zrzutu ekranu.
 */
export function OfferPicker({ offer, details }: { offer: Offer; details: React.ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const enquiry = useRef<EnquiryHandle>(null);
  // Klatkę da się odczytać tylko, gdy serwer z filmikami pozwala (CORS). Jeśli nie pozwala,
  // wczytujemy filmik zwyczajnie i zostaje sam screenshot.
  const [cors, setCors] = useState(true);
  const [note, setNote] = useState("");
  // Błąd wczytania mógł się zdarzyć, zanim React podpiął onError.
  useEffect(() => {
    if (cors && video.current?.error) setCors(false);
  }, [cors]);
  const canGrab = Boolean(offer.videoUrl) && cors && available(offer) > 0;

  async function grab() {
    const v = video.current;
    if (!v) return;
    if (!v.videoWidth) {
      setNote("Najpierw włącz filmik i zatrzymaj go na rybie.");
      return;
    }
    v.pause();
    const scale = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    try {
      canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
      const frame = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
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
          <button type="button" className="btn btn--primary grab" onClick={grab}>
            Zrób stopklatkę
          </button>
        )}
        {note && <p className="notice notice--warn small" role="status">{note}</p>}
        <p className="muted small">
          {canGrab
            ? "Podoba Ci się ryba? Zatrzymaj filmik, kliknij „Zrób stopklatkę” i stuknij w rybę."
            : "Podoba Ci się ryba? Zatrzymaj filmik, zrób screenshot i wyślij go nam w formularzu obok."}
        </p>
      </div>
      <div className="stack">
        {details}
        <OfferEnquiry offer={offer} frameGrab={canGrab} ref={enquiry} />
      </div>
    </div>
  );
}
