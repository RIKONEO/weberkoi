// Obróbka obrazków wgrywanych przez klientów i panel. Tylko po stronie serwera.
import "server-only";

/** JPEG, PNG albo WebP po pierwszych bajtach; przeglądarka i tak wysyła JPEG ze stopklatki. */
export function looksLikeImage(b: Buffer) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 4).toString("hex") === "89504e47";
  const webp = b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
  return jpeg || png || webp;
}

export type CleanImage = { mime: string; data: Buffer; width?: number; height?: number };

/**
 * Przepuszcza obrazek przez sharp: sprawdza, że to naprawdę obrazek, obraca według EXIF i zmniejsza.
 * Gdyby sharp zawiódł, a plik to zwykły JPEG/PNG/WebP (obrazek z przeglądarki jest już zmniejszony),
 * bierzemy go bez zmian, żeby nic nie przepadło. Wtedy wymiarów nie znamy.
 */
export async function normalizeImage(file: File, maxSide = 1600, label = "obrazek"): Promise<CleanImage | null> {
  const input = Buffer.from(await file.arrayBuffer());
  try {
    // Ładowany dopiero tutaj: gdyby natywna biblioteka sharp nie wczytała się na serwerze, przy imporcie
    // na górze pliku padałaby cała trasa (goły błąd 500), a tak zapis i tak się uda.
    const { default: sharp } = await import("sharp");
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { mime: "image/jpeg", data, width: info.width, height: info.height };
  } catch (err) {
    console.error(`${label}: sharp nie przetworzył obrazka`, { type: file.type, size: file.size, err });
    return looksLikeImage(input) ? { mime: file.type || "image/jpeg", data: input } : null;
  }
}
