import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus";
import "@fontsource-variable/manrope";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "WEBER Nishikigoi · sklep z koi", template: "%s · WEBER Nishikigoi" },
  description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie.",
  icons: { icon: "/logo-320.jpg" },
  metadataBase: SITE_URL,
  openGraph: { ...OPEN_GRAPH_BASE, title: "WEBER Nishikigoi · koi na filmiku", description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, odbiór osobisty w Zakrzewie." },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0b1416", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
