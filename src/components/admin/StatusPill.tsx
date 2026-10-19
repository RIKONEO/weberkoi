import { ENQUIRY_STATUSES, ORDER_STATUSES } from "@/lib/data";

const TONE: Record<string, string> = {
  nowe: "hi", oplacone: "hi", pakowane: "warn", wyslane: "ok", "do-odbioru": "ok", zakonczone: "mu", anulowane: "mu",
  odpowiedziano: "ok", zamkniete: "mu",
};
const LABELS: Record<string, string> = { ...ORDER_STATUSES, ...ENQUIRY_STATUSES };

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill--${TONE[status] ?? "mu"}`}>{LABELS[status] ?? status}</span>;
}
