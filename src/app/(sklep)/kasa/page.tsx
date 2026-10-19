import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getShippingPaused } from "@/lib/data";

export const metadata: Metadata = { title: "Kasa" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  return <CheckoutForm shippingPaused={await getShippingPaused()} />;
}
