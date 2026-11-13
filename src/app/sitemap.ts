import type { MetadataRoute } from "next";
import { listOffers, listVarieties } from "@/lib/data";
import { varietySlug } from "@/lib/varieties";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const [offers, varieties] = await Promise.all([listOffers(), listVarieties()]);
  const withOffers = new Set(offers.map((o) => o.variety));
  const newest = offers.reduce((m, o) => (o.addedAt > m ? o.addedAt : m), "");
  return [
    { url: url("/"), lastModified: newest || undefined, changeFrequency: "daily", priority: 1 },
    { url: url("/katalog"), lastModified: newest || undefined, changeFrequency: "daily", priority: 0.9 },
    ...varieties
      .filter((v) => withOffers.has(v))
      .map((v) => ({ url: url(`/odmiany/${varietySlug(v)}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...offers.map((o) => ({ url: url(`/oferta/${o.id}`), lastModified: o.addedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: url("/odbior"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/kontakt"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/polityka-prywatnosci"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
