import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  LogOut,
  Map,
  ScrollText,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { BRAND_SHORT } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-primary/30 bg-card p-4 md:flex md:flex-col">
        <Link href="/admin" className="mb-6 flex items-center gap-2">
          <Image
            src="/logo-pupr.png"
            alt="PUPR"
            width={36}
            height={36}
            className="h-9 w-auto shrink-0 object-contain"
          />
          <div>
            <p className="text-sm font-semibold">{BRAND_SHORT}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Panel Admin
            </p>
          </div>
        </Link>
        <nav className="space-y-1 text-sm">
          <SidebarLink href="/admin" icon={<Map className="h-4 w-4" />}>
            Peta &amp; Laporan
          </SidebarLink>
          <SidebarLink href="/admin/laporan" icon={<ScrollText className="h-4 w-4" />}>
            Daftar Laporan
          </SidebarLink>
          {session.user.role === "super_admin" && (
            <>
              <SidebarLink href="/admin/pengguna" icon={<Users className="h-4 w-4" />}>
                Pengguna
              </SidebarLink>
              <SidebarLink
                href="/admin/templat"
                icon={<Settings2 className="h-4 w-4" />}
              >
                Template WA
              </SidebarLink>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="font-medium">{session.user.nama}</p>
              <p className="text-xs text-muted-foreground">{session.user.role}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-foreground hover:bg-muted"
    >
      {icon}
      {children}
    </Link>
  );
}
