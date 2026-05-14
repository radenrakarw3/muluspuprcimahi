"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePublicReportKode } from "@/lib/report-code";

export default function CekLaporanPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const k = normalizePublicReportKode(value);
    if (!k) {
      setError("Isi nomor laporan dulu.");
      return;
    }
    if (k.startsWith("CMH-")) {
      router.push(`/laporan/${encodeURIComponent(k)}`);
      return;
    }
    if (!/^\d{7}$/.test(k)) {
      setError("Nomor laporan terdiri dari 7 angka (boleh ada spasi, akan dirapikan).");
      return;
    }
    router.push(`/laporan/${k}`);
  }

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10 lg:gap-12">
        <div className="order-2 space-y-6 md:order-1">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cek laporan</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Masukkan nomor 7 digit yang Anda terima setelah mengirim laporan untuk melihat status
              penanganan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomor">Nomor laporan</Label>
              <Input
                id="nomor"
                className="h-12 text-center font-mono text-lg tracking-widest"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0123456"
                maxLength={32}
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d\s]/g, ""))}
              />
            </div>
            {error && (
              <p className="text-center text-sm text-destructive-foreground md:text-left">{error}</p>
            )}
            <Button type="submit" className="h-12 w-full gap-2 text-base font-semibold">
              <Search className="h-4 w-4" />
              Buka status
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground md:text-left">
            <Link href="/lapor" className="text-primary underline underline-offset-2">
              Belum punya nomor? Buat laporan baru
            </Link>
          </p>
        </div>

        <figure className="order-1 md:order-2">
          <div className="overflow-hidden rounded-2xl border-2 border-primary/35 bg-card/40 shadow-[0_20px_50px_hsl(220_85%_4%/0.35)] ring-1 ring-primary/15">
            <Image
              src="/cek-laporan-ilustrasi.png"
              alt="Ilustrasi layanan PUPR Kota Cimahi: perencanaan infrastruktur dan transparansi laporan warga"
              width={960}
              height={720}
              className="h-auto w-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 480px"
              priority
            />
          </div>
          <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground md:text-left">
            Dinas PUPR Kota Cimahi — Melayani dengan hati, membangun infrastruktur bersama warga.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
