import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus";
import "@fontsource-variable/manrope";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { default: "WEBER Nishikigoi · sklep z koi", template: "%s · WEBER Nishikigoi" },
  description: "Karpie koi z Japonii i z naszej hodowli. Każda ryba na filmiku, wysyłka kurierem lub odbiór osobisty.",
  icons: { icon: "/logo-320.jpg" },
};

export const viewport: Viewport = { themeColor: "#0b1416", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <CartProvider>
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
