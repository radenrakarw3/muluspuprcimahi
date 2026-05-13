import { listCategories } from "@/lib/queries";
import ReportWizard from "@/components/report/report-wizard";

export const metadata = {
  title: "Buat Laporan Baru",
};

export const dynamic = "force-dynamic";

export default async function LaporPage() {
  const cats = await listCategories();
  return (
    <div className="container max-w-2xl py-6">
      <h1 className="mb-2 text-2xl font-bold">Buat Laporan Baru</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ikuti 4 langkah berikut. Total waktu sekitar 2 menit.
      </p>
      <ReportWizard
        categories={cats.map((c) => ({
          slug: c.slug,
          nama: c.nama,
          ikon: c.ikon,
          deskripsi: c.deskripsi,
        }))}
      />
    </div>
  );
}
