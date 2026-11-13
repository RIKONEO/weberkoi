import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fonty i logo do obrazków podglądu linków czytamy z dysku, więc trzeba je dołączyć do funkcji na Vercelu.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/og/**/*"],
    "/oferta/[id]/opengraph-image*": ["./src/assets/og/**/*"],
  },
  // Dawna strona „Wysyłka i odbiór”; sklep nie wysyła ryb, tylko zaprasza po odbiór.
  async redirects() {
    return [{ source: "/wysylka-i-odbior", destination: "/odbior", permanent: true }];
  },
};

export default nextConfig;
