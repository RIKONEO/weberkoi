import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Koszyk", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="wrap section stack">
      <div>
        <div className="eyebrow">Zgłoszenie</div>
        <h1 className="page-title">Koszyk</h1>
      </div>
      <CartView />
    </div>
  );
}
