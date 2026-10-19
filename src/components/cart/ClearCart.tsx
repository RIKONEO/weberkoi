"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Czyści koszyk po złożeniu zamówienia (ryby są już zarezerwowane w zamówieniu). */
export function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
