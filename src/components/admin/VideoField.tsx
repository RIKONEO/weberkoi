"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { checkVideo, startVideoUpload } from "@/app/admin/video-actions";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; sent: number; total: number }
  | { kind: "processing"; progress: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

/**
 * Filmik oferty w formularzu. Z telefonu: wybierz filmik z galerii albo nagraj go, a plik idzie
 * prosto do Bunny Stream z paskiem postępu. Po przerobieniu sami wpisujemy adres, miniaturę i długość.
 * Zostaje też ręczne wklejenie linku.
 */
export function VideoField({
  videoUrl: initialUrl,
  posterUrl: initialPoster,
  videoLength: initialLength,
  uploadEnabled,
}: {
  videoUrl?: string;
  posterUrl?: string;
  videoLength?: string;
  uploadEnabled: boolean;
}) {
  const [videoUrl, setVideoUrl] = useState(initialUrl ?? "");
  const [posterUrl, setPosterUrl] = useState(initialPoster ?? "");
  const [videoLength, setVideoLength] = useState(initialLength ?? "");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const box = useRef<HTMLFieldSetElement>(null);
  const upload = useRef<Upload | null>(null);
  const busy = phase.kind === "uploading" || phase.kind === "processing";

  // Nie da się zapisać oferty, zanim filmik będzie gotowy, i ostrzegamy przed zamknięciem strony.
  useEffect(() => {
    const submit = box.current?.closest("form")?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = busy;
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // Ekran telefonu nie gaśnie w trakcie wgrywania, bo wtedy przeglądarka często je wstrzymuje.
  useEffect(() => {
    if (phase.kind !== "uploading" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => void lock?.release().catch(() => {});
  }, [phase.kind]);

  async function waitForBunny(videoId: string) {
    setPhase({ kind: "processing", progress: 0 });
    for (let i = 0; i < 400; i++) {
      await new Promise((r) => setTimeout(r, i < 5 ? 3000 : 6000));
      let s;
      try {
        s = await checkVideo(videoId);
      } catch {
        continue; // chwilowy brak sieci: pytamy dalej
      }
      if (s.state === "processing") setPhase({ kind: "processing", progress: s.progress });
      else if (s.state === "error") return setPhase({ kind: "error", message: s.message });
      else {
        setVideoUrl(s.videoUrl);
        setPosterUrl(s.posterUrl);
        if (s.videoLength) setVideoLength(s.videoLength);
        return setPhase({ kind: "ready" });
      }
    }
    setPhase({ kind: "error", message: "Bunny przerabia filmik bardzo długo. Odśwież stronę za kilka minut i spróbuj jeszcze raz." });
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/i.test(file.name)) {
      return setPhase({ kind: "error", message: "To nie wygląda na filmik. Wybierz plik wideo." });
    }
    setPhase({ kind: "uploading", sent: 0, total: file.size });
    const form = box.current?.closest("form");
    const title = (form?.querySelector<HTMLInputElement>("#title")?.value || file.name).trim();
    const ticket = await startVideoUpload(title).catch(() => null);
    if (!ticket?.ok) return setPhase({ kind: "error", message: ticket?.error ?? "Brak połączenia. Spróbuj jeszcze raz." });

    const up = new Upload(file, {
      endpoint: ticket.endpoint,
      // Kawałki po 20 MB: po zerwaniu sieci wgrywanie rusza od ostatniego kawałka, nie od zera.
      chunkSize: 20 * 1024 * 1024,
      retryDelays: [0, 2000, 5000, 10000, 20000, 30000, 60000, 60000],
      storeFingerprintForResuming: false,
      headers: {
        AuthorizationSignature: ticket.signature,
        AuthorizationExpire: String(ticket.expire),
        VideoId: ticket.videoId,
        LibraryId: ticket.libraryId,
      },
      metadata: { filetype: file.type || "video/mp4", title },
      onProgress: (sent, total) => setPhase({ kind: "uploading", sent, total }),
      onError: () => setPhase({ kind: "error", message: "Wgrywanie przerwane. Sprawdź internet i wybierz filmik jeszcze raz." }),
      onSuccess: () => void waitForBunny(ticket.videoId),
    });
    upload.current = up;
    up.start();
  }

  function cancel() {
    upload.current?.abort(true).catch(() => {});
    upload.current = null;
    setPhase({ kind: "idle" });
  }

  const pct = phase.kind === "uploading" ? (phase.total ? Math.round((phase.sent / phase.total) * 100) : 0) : phase.kind === "processing" ? phase.progress : 0;

  return (
    <fieldset ref={box}>
      <legend>Filmik</legend>

      {uploadEnabled ? (
        <div className="video-upload">
          {videoUrl && !busy && (
            <video className="video-upload__preview" src={videoUrl} poster={posterUrl || undefined} controls playsInline preload="metadata" />
          )}

          {!busy && (
            <label className="btn btn--primary video-upload__pick">
              {videoUrl ? "Wgraj inny filmik" : "Wgraj filmik z telefonu"}
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => {
                  void pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          )}

          {busy && (
            <div className="video-upload__status" role="status" aria-live="polite">
              <div className="video-upload__bar" aria-hidden>
                <span style={{ width: `${pct}%` }} className={phase.kind === "processing" ? "is-processing" : undefined} />
              </div>
              {phase.kind === "uploading" ? (
                <p className="small">
                  Wysyłanie <b className="num">{pct}%</b> · <span className="num">{mb(phase.sent)} z {mb(phase.total)}</span>
                  <br />
                  <span className="muted">Nie zamykaj tej strony. Jeśli zasięg zniknie, wgrywanie samo ruszy dalej.</span>
                </p>
              ) : (
                <p className="small">
                  Wysłane. Bunny przygotowuje filmik do odtwarzania <b className="num">{pct}%</b>
                  <br />
                  <span className="muted">Zwykle trwa to 1–3 minuty. Potem zapiszesz ofertę.</span>
                </p>
              )}
              {phase.kind === "uploading" && <button type="button" className="link-btn small" onClick={cancel}>Anuluj</button>}
            </div>
          )}

          {phase.kind === "ready" && <p className="small video-upload__ok">Filmik gotowy. Zapisz ofertę na dole, żeby pokazać go w sklepie.</p>}
          {phase.kind === "error" && <p className="small video-upload__err" role="alert">{phase.message}</p>}
        </div>
      ) : (
        <p className="muted small">Wgrywanie z telefonu włączy się, gdy w Vercelu będą ustawione klucze Bunny Stream. Na razie wklej link do pliku MP4.</p>
      )}

      <details className="video-upload__manual" open={!uploadEnabled}>
        {uploadEnabled && <summary className="small muted">Adres filmiku i miniatury (uzupełnia się sam)</summary>}
        <div className="video-upload__fields">
          <label className="field">Adres filmiku (https://…)
            <input id="videoUrl" name="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="link do pliku MP4" />
          </label>
          <div className="two">
            <label className="field">Miniatura (https://…, opcjonalnie)
              <input id="posterUrl" name="posterUrl" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} />
            </label>
            <label className="field">Długość
              <input id="videoLength" name="videoLength" value={videoLength} onChange={(e) => setVideoLength(e.target.value)} placeholder="1:48" />
            </label>
          </div>
        </div>
      </details>
    </fieldset>
  );
}
