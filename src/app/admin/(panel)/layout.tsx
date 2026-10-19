import type { Metadata } from "next";
import Link from "next/link";
import { logout, requireAdmin } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel WEBER" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="site-header">
        <div className="wrap site-header__bar">
          <Link href="/admin" className="brand"><span><b>WEBER</b><small>Panel sklepu</small></span></Link>
          <AdminNav />
          <form action={logout}><button className="link-btn small" type="submit">Wyloguj</button></form>
        </div>
      </header>
      <main className="wrap section admin">{children}</main>
    </>
  );
}
