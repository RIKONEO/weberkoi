import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dawna strona „Wysyłka i odbiór”; sklep nie wysyła ryb, tylko zaprasza po odbiór.
  async redirects() {
    return [{ source: "/wysylka-i-odbior", destination: "/odbior", permanent: true }];
  },
};

export default nextConfig;
