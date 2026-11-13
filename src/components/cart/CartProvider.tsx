"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_ITEMS } from "@/lib/enquiry";

/**
 * Koszyk zgłoszenia: ryby wybrane z filmików, każda ze swoją stopklatką z zaznaczoną rybą.
 * Nic tu nie jest płatnością ani zamówieniem: z koszyka wysyłamy jedno zgłoszenie do sklepu.
 * Trzymamy go w IndexedDB przeglądarki (stopklatki to obrazki, nie zmieściłyby się w localStorage),
 * żeby przetrwał przejście na inną ofertę i odświeżenie strony.
 */
export type CartItem = {
  id: string;
  offerId: string;
  title: string;
  /** Cena za sztukę w chwili dodania; null = „zapytaj o cenę”. */
  price: number | null;
  qty: number;
  second: string;
  shot: Blob;
  addedAt: number;
};

type Cart = {
  items: CartItem[];
  /** false, dopóki koszyk nie wczyta się z przeglądarki. */
  ready: boolean;
  count: number;
  add: (item: Omit<CartItem, "id" | "addedAt">) => Promise<boolean>;
  update: (id: string, patch: Partial<Pick<CartItem, "qty" | "second" | "shot">>) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | null>(null);

const DB = "weberkoi-koszyk";
const STORE = "items";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function getDb() {
  dbPromise ??= openDb().catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

/** Zapis do IndexedDB; gdy przeglądarka go nie pozwala (np. tryb prywatny), koszyk działa tylko do odświeżenia strony. */
async function tx(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest | void): Promise<unknown> {
  try {
    const db = await getDb();
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = run(t.objectStore(STORE));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } catch {
    return undefined;
  }
}

const loadAll = async () => ((await tx("readonly", (s) => s.getAll())) as CartItem[] | undefined)?.sort((a, b) => a.addedAt - b.addedAt);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    const reload = () =>
      loadAll().then((all) => {
        if (!live) return;
        if (all) setItems(all);
        setReady(true);
      });
    reload();
    // Koszyk mógł się zmienić w innej karcie (np. klient otworzył dwie oferty obok siebie).
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Aktualny stan koszyka dla funkcji poniżej (bez efektów ubocznych w setItems).
  const current = useRef(items);
  current.current = items;

  const add = useCallback<Cart["add"]>(async (item) => {
    if (current.current.length >= MAX_ITEMS) return false;
    const full: CartItem = { ...item, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, addedAt: Date.now() };
    current.current = [...current.current, full];
    setItems(current.current);
    await tx("readwrite", (s) => s.put(full));
    return true;
  }, []);

  const update = useCallback<Cart["update"]>((id, patch) => {
    const old = current.current.find((it) => it.id === id);
    if (!old) return;
    const changed = { ...old, ...patch };
    current.current = current.current.map((it) => (it.id === id ? changed : it));
    setItems(current.current);
    void tx("readwrite", (s) => s.put(changed));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((cur) => cur.filter((it) => it.id !== id));
    void tx("readwrite", (s) => s.delete(id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    void tx("readwrite", (s) => s.clear());
  }, []);

  const value = useMemo<Cart>(
    () => ({ items, ready, count: items.reduce((s, it) => s + it.qty, 0), add, update, remove, clear }),
    [items, ready, add, update, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart poza CartProvider");
  return cart;
}

/** Adres obrazka z koszyka do <img>, zwalniany, gdy przestaje być potrzebny. */
export function useBlobUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return setUrl(undefined);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
