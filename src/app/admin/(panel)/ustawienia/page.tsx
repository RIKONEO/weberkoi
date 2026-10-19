import type { Metadata } from "next";
import { getShippingPaused } from "@/lib/data";
import { setShippingPausedAction } from "../../actions";
import { Flash } from "@/components/admin/Flash";

export const metadata: Metadata = { title: "Ustawienia" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ zapisano?: string }> }) {
  const [paused, sp] = await Promise.all([getShippingPaused(), searchParams]);
  return (
    <div className="stack admin-narrow">
      <h1 className="page-title">Ustawienia</h1>
      <Flash saved={sp.zapisano} />
      <form action={setShippingPausedAction} className="panel">
        <label className="opt">
          <input type="checkbox" id="paused" name="paused" defaultChecked={paused} />
          <span>Wstrzymaj wysyłki kurierem<small>Na upał lub mróz. Na stronie „Wysyłka i odbiór” klienci zobaczą, że zapraszamy tylko po odbiór osobisty.</small></span>
        </label>
        <div><button type="submit" className="btn btn--primary">Zapisz</button></div>
      </form>
    </div>
  );
}
