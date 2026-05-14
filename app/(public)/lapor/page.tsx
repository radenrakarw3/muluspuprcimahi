import { listCategories } from "@/lib/queries";
import ReportWizard from "@/components/report/report-wizard";

export const metadata = {
  title: "Buat Laporan Baru",
};

export const dynamic = "force-dynamic";

export default async function LaporPage() {
  const cats = await listCategories();
  return (
    <div className="container max-w-lg py-4 md:max-w-xl md:py-8">
      <h1 className="sr-only">Buat laporan</h1>
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
