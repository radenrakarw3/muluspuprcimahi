import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function createAdmin(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "super_admin") throw new Error("Forbidden");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const nama = String(formData.get("nama") ?? "");
  const role = String(formData.get("role") ?? "operator") as
    | "super_admin"
    | "verifikator"
    | "operator";
  const password = String(formData.get("password") ?? "");
  if (!email || !nama || password.length < 6) return;
  const hash = await bcrypt.hash(password, 12);
  await db
    .insert(adminUsers)
    .values({
      id: nanoid(16),
      email,
      passwordHash: hash,
      nama,
      role,
      aktif: true,
    })
    .onConflictDoNothing();
  revalidatePath("/admin/pengguna");
}

async function toggleActive(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "super_admin") throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  const aktif = String(formData.get("aktif") ?? "") === "1";
  if (!id) return;
  await db.update(adminUsers).set({ aktif }).where(eq(adminUsers.id, id));
  revalidatePath("/admin/pengguna");
}

export default async function PenggunaPage() {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    redirect("/admin");
  }
  const users = await db.select().from(adminUsers).orderBy(adminUsers.createdAt);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Pengguna Admin</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akses staf Dinas PUPR.
        </p>
      </header>

      <form
        action={createAdmin}
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
      >
        <div>
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password (min 6)</Label>
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            className="h-11 w-full rounded-lg border bg-background px-3 text-base"
          >
            <option value="operator">Operator</option>
            <option value="verifikator">Verifikator</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Tambah pengguna</Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Aktif</th>
              <th className="px-3 py-2">Login terakhir</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.nama}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.aktif ? "Ya" : "Tidak"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={toggleActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="aktif" value={u.aktif ? "0" : "1"} />
                    <Button type="submit" size="sm" variant="outline">
                      {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
