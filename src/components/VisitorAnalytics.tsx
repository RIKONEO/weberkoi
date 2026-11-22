"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Statystyki odwiedzin Vercel (zakładka Analytics w Vercelu). Nie liczymy wejść do panelu admina
// ani strony z hasłem, żeby Marcin nie nabijał sobie odwiedzin.
function skipInternal(event: BeforeSendEvent) {
  const path = new URL(event.url).pathname;
  if (path === "/admin" || path.startsWith("/admin/") || path === "/wejscie") return null;
  return event;
}

export function VisitorAnalytics() {
  return <Analytics beforeSend={skipInternal} />;
}
