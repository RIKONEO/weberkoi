"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type FishMap, type MapMarker, type MapStatuses, nextMarkerNo } from "@/lib/offers";

type Img = { src: string; blob?: Blob; width: number; height: number };

const STEP = 0.04;

function clock(t: number) {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Kopiuje obrazek do JPEG o dłuższym boku najwyżej 1600 px. */
async function toJpeg(source: CanvasImageSource, w: number, h: number): Promise<Img> {
  const scale = Math.min(1, 1600 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.88));
  if (!blob) throw new Error("brak klatki");
  return { src: URL.createObjectURL(blob), blob, width: canvas.width, height: canvas.height };
}

/**
 * Mapa ryb w panelu: Marcin wybiera jedną klatkę z filmiku (albo wgrywa zdjęcie) i stuka w każdą
 * rybę. Ryby dostają kolejne numery. Znacznik można przesunąć palcem albo usunąć.
 */
export function FishMapEditor({
  offerId,
  videoUrl,
  initial,
  statuses,
  count,
  sold = [],
}: {
  offerId: string;
  videoUrl?: string;
  initial?: FishMap;
  statuses: MapStatuses;
  count: number;
  /** Numery wpisane w ofercie jako sprzedane: na mapie te ryby są szare. */
  sold?: number[];
}) {
  const router = useRouter();
  const [img, setImg] = useState<Img | null>(initial ? { src: `/admin/mapa/${offerId}?v=${initial.version}`, width: initial.width, height: initial.height } : null);
  const [markers, setMarkers] = useState<MapMarker[]>(initial?.markers ?? []);
  const [mode, setMode] = useState<"edit" | "frame">(initial ? "edit" : videoUrl ? "frame" : "edit");
  const [selected, setSelected] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [setCount, setSetCount] = useState(true);
  const [zoom, setZoom] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drag = useRef<{ n: number; x0: number; y0: number; moved: boolean } | null>(null);

  // Wybór klatki z filmiku.
  const video = useRef<HTMLVideoElement>(null);
  const [cors, setCors] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (mode !== "frame") return;
    const v = video.current;
    if (!v) return;
    let raf = 0;
    const loop = () => {
      setTime(v.currentTime);
      if (Number.isFinite(v.duration)) setDuration(v.duration);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [mode, cors]);

  // Ostrzeżenie przed wyjściem ze strony z niezapisaną mapą.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function seek(to: number) {
    const v = video.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, Math.min(Number.isFinite(v.duration) ? v.duration : to, to));
  }

  async function useFrame() {
    const v = video.current;
    if (!v) return;
    v.pause();
    if (v.readyState < 2 || !v.videoWidth) {
      setMsg({ ok: false, text: "Filmik jeszcze się wczytuje. Puść go na chwilę i spróbuj jeszcze raz." });
      return;
    }
    try {
      setImg(await toJpeg(v, v.videoWidth, v.videoHeight));
      setMode("edit");
      setDirty(true);
      setMsg(null);
    } catch {
      setCors(false);
      setMsg({ ok: false, text: "Serwer z filmikami nie pozwala skopiować klatki (CORS w Bunny). Zrób zrzut ekranu filmiku i wgraj go jako zdjęcie." });
    }
  }

  async function upload(list: FileList | null) {
    const f = list?.[0];
    if (file.current) file.current.value = "";
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f);
      const next = await toJpeg(bmp, bmp.width, bmp.height);
      bmp.close();
      setImg(next);
      setMode("edit");
      setDirty(true);
      setMsg(null);
    } catch {
      setMsg({ ok: false, text: "Nie udało się odczytać zdjęcia. Spróbuj z innym plikiem (JPG albo PNG)." });
    }
  }

  function pos(e: React.PointerEvent) {
    const box = stage.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    };
  }

  function addAt(e: React.PointerEvent) {
    if (e.target !== e.currentTarget && !(e.target instanceof HTMLImageElement)) return;
    if (selected != null) return setSelected(null);
    const { x, y } = pos(e);
    setMarkers((ms) => [...ms, { n: nextMarkerNo(ms), x, y }].sort((a, b) => a.n - b.n));
    setDirty(true);
  }

  function pinDown(e: React.PointerEvent<HTMLButtonElement>, n: number) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { n, x0: e.clientX, y0: e.clientY, moved: false };
  }

  function pinMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
    d.moved = true;
    const { x, y } = pos(e);
    setMarkers((ms) => ms.map((m) => (m.n === d.n ? { ...m, x, y } : m)));
    setDirty(true);
  }

  function pinUp() {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setSelected((cur) => (cur === d.n ? null : d.n));
  }

  function removeSelected() {
    setMarkers((ms) => ms.filter((m) => m.n !== selected));
    setSelected(null);
    setDirty(true);
  }

  async function save() {
    if (!img) return;
    setSaving(true);
    setMsg(null);
    const body = new FormData();
    if (img.blob) {
      body.set("image", img.blob, "mapa.jpg");
      body.set("width", String(img.width));
      body.set("height", String(img.height));
    }
    body.set("markers", JSON.stringify(markers));
    if (setCount && markers.length !== count) body.set("setCount", "1");
    try {
      const res = await fetch(`/admin/mapa/${offerId}`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Błąd zapisu (${res.status}).`);
      if (data.map) setImg({ src: `/admin/mapa/${offerId}?v=${data.map.version}`, width: data.map.width, height: data.map.height });
      setDirty(false);
      setMsg({ ok: true, text: "Mapa zapisana. Klienci widzą ją już pod filmikiem." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Nie udało się zapisać mapy." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Usunąć mapę ryb? Klienci znowu będą robić własne stopklatki.")) return;
    setSaving(true);
    const res = await fetch(`/admin/mapa/${offerId}`, { method: "DELETE" }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return setMsg({ ok: false, text: "Nie udało się usunąć mapy." });
    setImg(null);
    setMarkers([]);
    setDirty(false);
    setMode(videoUrl ? "frame" : "edit");
    setMsg({ ok: true, text: "Mapa usunięta." });
    router.refresh();
  }

  const taken = (n: number) => statuses[n];

  return (
    <section className="panel stack mapedit" aria-labelledby="mapedit-title">
      <div>
        <h2 id="mapedit-title" className="panel__title">Mapa ryb pod filmikiem</h2>
        <p className="muted small">
          Wybierz jedną klatkę, na której dobrze widać wszystkie ryby, i stuknij w każdą rybę. Klienci zobaczą tę klatkę pod filmikiem: wolne ryby na zielono,
          zarezerwowane na żółto, sprzedane na szaro. Stukają w wolną rybę i dodają ją do koszyka.
        </p>
      </div>

      {mode === "frame" && videoUrl && (
        <div className="picker">
          <div className="video">
            <video
              ref={video}
              key={cors ? "cors" : "plain"}
              src={videoUrl}
              crossOrigin={cors ? "anonymous" : undefined}
              onError={() => cors && setCors(false)}
              muted
              playsInline
              controls
              preload="auto"
            />
          </div>
          <p className="picker__hint small">Zatrzymaj filmik w miejscu, gdzie widać wszystkie ryby, albo przesuń suwak.</p>
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
            <button type="button" className="btn picker__step" onClick={() => seek(time + STEP)} aria-label="Klatka dalej">▶❘</button>
            <span className="picker__time num">{clock(time)} / {clock(duration)}</span>
          </div>
          <div className="picker__row">
            <button type="button" className="btn btn--primary picker__go" onClick={useFrame} disabled={!cors}>Użyj tej klatki</button>
            {img && <button type="button" className="btn" onClick={() => setMode("edit")}>Anuluj</button>}
          </div>
        </div>
      )}

      {mode === "edit" && img && (
        <>
          <div className="row row--between">
            <span className="small muted">Ryby blisko siebie? Powiększ klatkę.</span>
            <button type="button" className="chip" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? "Pomniejsz" : "Powiększ"}</button>
          </div>
          <div className={zoom ? "fishmap__scroll fishmap__scroll--zoom" : "fishmap__scroll"}>
          <div
            ref={stage}
            className="fishmap__stage mapedit__stage"
            style={{ aspectRatio: `${img.width} / ${img.height}` }}
            onPointerDown={addAt}
            onPointerMove={pinMove}
            onPointerUp={pinUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="Klatka mapy ryb" draggable={false} />
            {markers.map((m) => (
              <button
                key={m.n}
                type="button"
                className={`fishmap__pin fishmap__pin--${taken(m.n) ?? "wolna"}${selected === m.n ? " is-selected" : ""}`}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                onPointerDown={(e) => pinDown(e, m.n)}
                aria-label={`Ryba nr ${m.n}`}
              >
                {m.n}
              </button>
            ))}
          </div>
          </div>
          {selected != null ? (
            <div className="fishmap__bar">
              <span>
                <b>Ryba nr {selected}</b>
                {taken(selected) && <span className="small muted"> · {taken(selected)} w zgłoszeniu</span>}
              </span>
              <div className="row">
                <button type="button" className="btn btn--sm" onClick={removeSelected}>Usuń nr {selected}</button>
                <button type="button" className="chip" onClick={() => setSelected(null)}>Gotowe</button>
              </div>
            </div>
          ) : (
            <p className="muted small">
              Stuknij w rybę, żeby dodać numer ({markers.length ? `na mapie: ${markers.length}` : "jeszcze żadnej"}). Numer przesuniesz palcem, a stuknięcie w numer pozwala go usunąć.
            </p>
          )}
          {sold.length > 0 && markers.length > 0 && (
            <p className="muted small">
              Numery sprzedanych z oferty ({sold.join(", ")}) są na mapie szare. Jeśli to były inne ryby niż te numery na mapie, popraw pole „Numery sprzedanych ryb” wyżej.
            </p>
          )}
          {markers.length > 0 && markers.length !== count && (
            <label className="check small">
              <input type="checkbox" checked={setCount} onChange={(e) => setSetCount(e.target.checked)} />
              Ustaw „Ryb na filmiku” na {markers.length} (teraz {count})
            </label>
          )}
        </>
      )}

      {mode === "edit" && !img && <p className="notice small">Ta oferta nie ma jeszcze filmiku. Wgraj zdjęcie ryb (np. zrzut ekranu z filmiku).</p>}

      {msg && <p className={msg.ok ? "notice small" : "notice notice--error small"} role="status">{msg.text}</p>}

      <div className="row">
        {mode === "edit" && img && (
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving || (!dirty && !img.blob)}>
            {saving ? "Zapisuję…" : dirty ? "Zapisz mapę" : "Zapisano"}
          </button>
        )}
        {mode === "edit" && videoUrl && (
          <button type="button" className="btn" onClick={() => setMode("frame")}>{img ? "Zmień klatkę" : "Wybierz klatkę z filmiku"}</button>
        )}
        <label className="btn">
          <input ref={file} type="file" accept="image/*" className="visually-hidden" onChange={(e) => upload(e.target.files)} />
          Wgraj zdjęcie
        </label>
        {initial && <button type="button" className="link-btn small" onClick={remove} disabled={saving}>Usuń mapę</button>}
      </div>
      {mode === "edit" && initial && img?.blob && markers.length > 0 && (
        <p className="muted small">Numery zostają przy nowej klatce. Przesuń je na ryby, jeśli pływają w innych miejscach.</p>
      )}
    </section>
  );
}
