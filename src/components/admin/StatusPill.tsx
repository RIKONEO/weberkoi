import { ENQUIRY_STATUSES } from "@/lib/data";

const TONE: Record<string, string> = { nowe: "hi", odpowiedziano: "ok", zamkniete: "mu" };
const LABELS: Record<string, string> = ENQUIRY_STATUSES;

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill--${TONE[status] ?? "mu"}`}>{LABELS[status] ?? status}</span>;
}
