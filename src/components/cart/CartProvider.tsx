"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  offerId: string;
  title: string;
  variety: string;
  size: string;
  unitPrice: number;
  qty: number;
  /** Numery wybranych ryb; null = „ryba z grupy”, wybiera sklep. */
  picks: number[] | null;
};

type CartState = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  total: number;
  add(line: CartLine): void;
  remove(index: number): void;
  clear(): void;
};

const CartContext = createContext<CartState | null>(null);
const KEY = "weberkoi-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((cur) => {
      // „Ryba z grupy” z tej samej oferty łączymy w jedną pozycję; konkretne numery też, bez duplikatów.
      const i = cur.findIndex((l) => l.offerId === line.offerId && (l.picks === null) === (line.picks === null));
      if (i < 0) return [...cur, line];
      const prev = cur[i];
      const merged: CartLine = line.picks
        ? { ...prev, picks: [...new Set([...(prev.picks ?? []), ...line.picks])].sort((a, b) => a - b) }
        : { ...prev, qty: prev.qty + line.qty };
      if (merged.picks) merged.qty = merged.picks.length;
      return cur.map((l, j) => (j === i ? merged : l));
    });
  }, []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
      add,
      remove: (index) => setLines((cur) => cur.filter((_, j) => j !== index)),
      clear: () => setLines([]),
    }),
    [lines, ready, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart musi być użyte wewnątrz CartProvider");
  return ctx;
}
