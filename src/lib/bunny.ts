// Bunny Stream: tu trzymamy filmiki ofert. Filmik idzie z telefonu prosto do Bunny (protokół TUS,
// wznawia się po zerwaniu sieci), więc nie przechodzi przez serwer strony ani jego limity.
// Bunny sam przerabia filmik (także HEVC z iPhone’a) na MP4, które odtworzy każda przeglądarka.
import "server-only";
import { createHash } from "node:crypto";

export const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

function config() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  const apiKey = process.env.BUNNY_STREAM_API_KEY?.trim();
  const cdnHost = process.env.BUNNY_STREAM_CDN_HOST?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!libraryId || !apiKey || !cdnHost) return null;
  return { libraryId, apiKey, cdnHost };
}

export const bunnyConfigured = () => config() !== null;

const api = (libraryId: string, path = "") => `https://video.bunnycdn.com/library/${libraryId}/videos${path}`;

export type UploadTicket = {
  videoId: string;
  libraryId: string;
  expire: number;
  signature: string;
};

/** Zakłada pusty filmik w bibliotece i daje podpis, którym telefon może wgrać do niego plik. */
export async function createUploadTicket(title: string): Promise<UploadTicket> {
  const c = config();
  if (!c) throw new Error("Brak ustawień Bunny Stream.");
  const res = await fetch(api(c.libraryId), {
    method: "POST",
    headers: { AccessKey: c.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title: title.slice(0, 200) || "Filmik oferty" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bunny nie założył filmiku (${res.status}). Sprawdź klucz API i numer biblioteki.`);
  const { guid } = (await res.json()) as { guid: string };
  // Podpis ważny 6 godzin: wystarczy na długie wgrywanie po słabym zasięgu.
  const expire = Math.floor(Date.now() / 1000) + 6 * 3600;
  const signature = createHash("sha256").update(`${c.libraryId}${c.apiKey}${expire}${guid}`).digest("hex");
  return { videoId: guid, libraryId: c.libraryId, expire, signature };
}

export type VideoState =
  | { state: "processing"; progress: number }
  | { state: "ready"; videoUrl: string; posterUrl: string; videoLength: string }
  | { state: "error"; message: string };

const clock = (sec: number) => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Sprawdza, czy Bunny skończył przerabiać filmik, i podaje gotowe adresy MP4 i miniatury. */
/** `referer`: adres sklepu, żeby Bunny z listą dozwolonych domen wpuścił też to sprawdzenie. */
export async function getVideoState(videoId: string, referer?: string): Promise<VideoState> {
  const c = config();
  if (!c) return { state: "error", message: "Brak ustawień Bunny Stream." };
  if (!/^[0-9a-f-]{36}$/i.test(videoId)) return { state: "error", message: "Zły numer filmiku." };
  const res = await fetch(api(c.libraryId, `/${videoId}`), {
    headers: { AccessKey: c.apiKey, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return { state: "error", message: `Bunny nie zna tego filmiku (${res.status}).` };
  const v = (await res.json()) as {
    status: number;
    encodeProgress?: number;
    length?: number;
    thumbnailFileName?: string;
    availableResolutions?: string | null;
  };
  // 5 = błąd przetwarzania, 6 = wgrywanie się nie udało.
  if (v.status === 5 || v.status === 6) return { state: "error", message: "Bunny nie przerobił tego filmiku. Spróbuj wgrać go jeszcze raz." };
  if (v.status !== 4) return { state: "processing", progress: Math.max(0, Math.min(100, v.encodeProgress ?? 0)) };

  // Pliki MP4 (MP4 Fallback) Bunny robi do 720p. Bierzemy najwyższą jakość, jaka powstała.
  const have = (v.availableResolutions ?? "").split(",").map((r) => parseInt(r, 10));
  const res720 = [720, 480, 360, 240].find((r) => have.includes(r)) ?? 720;
  const base = `https://${c.cdnHost}/${videoId}`;
  const videoUrl = `${base}/play_${res720}p.mp4`;
  const head = await fetch(videoUrl, { method: "HEAD", cache: "no-store", headers: referer ? { Referer: referer } : {} }).catch(() => null);
  if (head && (head.status === 404 || head.status === 403)) {
    return {
      state: "error",
      message: head.status === 404
        ? "Filmik jest gotowy, ale Bunny nie zrobił pliku MP4. W Bunny: Stream → biblioteka → Encoding → włącz „MP4 Fallback”, potem wgraj filmik jeszcze raz (działa tylko dla filmików wgranych po włączeniu)."
        : "Bunny blokuje dostęp do pliku filmiku (błąd 403). W Bunny: Stream → biblioteka → Security: wyłącz „Block direct URL file access” i „Token authentication”, a „Allowed domains” zostaw puste albo dopisz weberkoisklep.vercel.app. Potem kliknij „Sprawdź jeszcze raz”, nie trzeba wgrywać od nowa.",
    };
  }
  return {
    state: "ready",
    videoUrl,
    posterUrl: `${base}/${v.thumbnailFileName || "thumbnail.jpg"}`,
    videoLength: v.length ? clock(v.length) : "",
  };
}
