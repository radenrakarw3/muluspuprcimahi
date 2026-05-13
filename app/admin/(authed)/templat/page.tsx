import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { waTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

async function saveTemplate(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Hanya super admin yang bisa mengubah template.");
  }
  const key = String(formData.get("key") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!key || !body) return;
  await db
    .update(waTemplates)
    .set({ body, updatedAt: new Date() })
    .where(eq(waTemplates.key, key));
  revalidatePath("/admin/templat");
}

export default async function TemplatePage() {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    redirect("/admin");
  }
  const templates = await db.select().from(waTemplates);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Template Pesan WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Edit teks notifikasi otomatis ke pelapor. Variabel pakai sintaks{" "}
          <code>{`{nama_variabel}`}</code>.
        </p>
      </header>

      <div className="space-y-4">
        {templates.map((t) => (
          <form
            key={t.key}
            action={saveTemplate}
            className="space-y-2 rounded-xl border p-4"
          >
            <input type="hidden" name="key" value={t.key} />
            <div>
              <p className="text-sm font-semibold">{t.nama}</p>
              <p className="text-xs text-muted-foreground">
                key: <code>{t.key}</code> • variabel:{" "}
                <code>{t.variables}</code>
              </p>
            </div>
            <div>
              <Label htmlFor={`body-${t.key}`}>Isi pesan</Label>
              <Textarea
                id={`body-${t.key}`}
                name="body"
                defaultValue={t.body}
                rows={6}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Simpan
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
