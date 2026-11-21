import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fonty i logo do obrazków podglądu linków czytamy z dysku, więc trzeba je dołączyć do funkcji na Vercelu.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/og/**/*"],
    "/oferta/[id]/opengraph-image*": ["./src/assets/og/**/*"],
  },
  // Dawna strona „Wysyłka i odbiór”; sklep nie wysyła ryb, tylko zaprasza po odbiór.
  async redirects() {
    return [
      { source: "/wysylka-i-odbior", destination: "/odbior", permanent: true },
      // Dział obrazów nazywał się wcześniej „Koi Light Art”.
      { source: "/koi-light-art", destination: "/koi-art", permanent: true },
      { source: "/koi-light-art/:id", destination: "/koi-art/:id", permanent: true },
      { source: "/admin/light-art/:path*", destination: "/admin/koi-art/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
