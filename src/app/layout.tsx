import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus";
import "@fontsource-variable/manrope";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { storeSchema } from "@/lib/schema-org";

export const metadata: Metadata = {
  title: { default: "WEBER Nishikigoi · sklep z koi", template: "%s · WEBER Nishikigoi" },
  description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie.",
  icons: { icon: "/logo-320.jpg" },
  metadataBase: SITE_URL,
  openGraph: { ...OPEN_GRAPH_BASE, title: "WEBER Nishikigoi · koi na filmiku", description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie." },
  twitter: { card: "summary_large_image" },
  // Kod z Google Search Console (Ustawienia > Weryfikacja własności > Tag HTML), wpisywany w zmiennych Vercela.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: "#0b1416", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <JsonLd data={storeSchema()} />
        <CartProvider>
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
