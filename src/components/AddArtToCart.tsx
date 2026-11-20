"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";
import { MAX_ITEMS } from "@/lib/enquiry";

/**
 * „Dodaj do koszyka” przy obrazie z metalu. Zamiast stopklatki z filmiku do koszyka trafia
 * zdjęcie obrazu, żeby Marcin w zgłoszeniu i w mailu od razu widział, o który chodzi.
 */
export function AddArtToCart({ offerId, title, price, photo, soldOut }: { offerId: string; title: string; price: number | null; photo?: string; soldOut: boolean }) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "busy" | "added" | "error">("idle");
  const [error, setError] = useState("");
  const inCart = cart.items.some((it) => it.offerId === offerId);

  async function add() {
    setState("busy");
    setError("");
    try {
      const res = photo ? await fetch(photo) : null;
      if (!res?.ok) throw new Error("zdjęcie");
      const shot = await res.blob();
      const ok = await cart.add({ offerId, title, price, qty: 1, second: "", shot, kind: "obraz" });
      if (!ok) {
        setState("error");
        setError(`W koszyku może być najwyżej ${MAX_ITEMS} pozycji. Wyślij najpierw to zgłoszenie.`);
        return;
      }
      setState("added");
    } catch {
      setState("error");
      setError("Nie udało się dodać obrazu. Sprawdź internet i spróbuj jeszcze raz.");
    }
  }

  if (soldOut) return <p className="notice notice--warn small">Ten obraz jest chwilowo wyprzedany. Zadzwoń albo napisz, a powiemy, kiedy będzie kolejny.</p>;
  if (state === "added" || inCart) {
    return (
      <div className="stack">
        <p className="notice small" role="status">Obraz jest w koszyku.</p>
        <Link href="/koszyk" className="btn btn--primary">Przejdź do koszyka i wyślij zgłoszenie</Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <button type="button" className="btn btn--primary" onClick={add} disabled={state === "busy"}>
        {state === "busy" ? "Dodaję…" : price ? "Dodaj do koszyka" : "Zapytaj o cenę (dodaj do koszyka)"}
      </button>
      {state === "error" && <p className="notice notice--error small" role="alert">{error}</p>}
    </div>
  );
}
