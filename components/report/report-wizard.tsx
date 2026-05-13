"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PinPicker } from "@/components/map/loaders";
import PhotoUpload, { type UploadedPhoto } from "./photo-upload";
import DuplicateCheck from "./duplicate-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NearbyReport } from "@/lib/geo";

type LatLng = { lat: number; lng: number };

type Category = {
  slug: string;
  nama: string;
  ikon: string;
  deskripsi: string | null;
};

type RegionInfo = {
  insideCimahi: boolean;
  kecamatan?: string | null;
  kelurahan?: string | null;
};

const STEPS = ["Lokasi", "Detail", "Identitas", "Kirim"] as const;

export default function ReportWizard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [pos, setPos] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [alamat, setAlamat] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");

  // Step 2
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [deskripsi, setDeskripsi] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  // Step 3
  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Step 4
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cek duplikat
  const [nearby, setNearby] = useState<NearbyReport[]>([]);
  const [proceedAnyway, setProceedAnyway] = useState(false);

  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [tsToken, setTsToken] = useState<string | undefined>();

  /** Lookup region whenever pos changes */
  useEffect(() => {
    if (!pos) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/region?lat=${pos.lat}&lng=${pos.lng}`);
        const data = (await res.json()) as RegionInfo;
        if (!cancel) setRegion(data);
      } catch {
        if (!cancel) setRegion({ insideCimahi: false });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pos]);

  /** Cek duplikasi saat masuk step 2 selesai (kategori + posisi siap) */
  useEffect(() => {
    if (!pos || !categorySlug) {
      setNearby([]);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/nearby?lat=${pos.lat}&lng=${pos.lng}&category=${encodeURIComponent(categorySlug)}`,
        );
        const data = (await res.json()) as { items: NearbyReport[] };
        if (!cancel) setNearby(data.items ?? []);
      } catch {
        if (!cancel) setNearby([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pos, categorySlug]);

  /** OTP cooldown countdown */
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const i = setInterval(() => setOtpCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [otpCooldown]);

  /** Turnstile script (kalau di-set) */
  useEffect(() => {
    if (!turnstileKey) return;
    const id = "cf-turnstile";
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);
  }, [turnstileKey]);

  const requestOtp = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request",
        pelaporWa: wa,
        turnstileToken: tsToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal kirim OTP");
      if (data.cooldown) setOtpCooldown(Number(data.cooldown));
      return;
    }
    setOtpSent(true);
    setOtpCooldown(60);
  }, [wa, tsToken]);

  const verifyOtp = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pelaporWa: wa, code: otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "OTP salah");
      return;
    }
    setOtpVerified(true);
  }, [wa, otp]);

  async function submit(parentReportId?: string) {
    if (!pos || !categorySlug) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        categorySlug,
        deskripsi,
        lat: pos.lat,
        lng: pos.lng,
        alamat: alamat || null,
        rw: rw || null,
        rt: rt || null,
        pelaporNama: nama,
        pelaporWa: wa,
        otpCode: otp,
        fotoKeys: photos.map((p) => p.key),
        fotoUrls: photos.map((p) => p.publicUrl),
        consent: true as const,
        turnstileToken: tsToken,
        parentReportId,
      };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim laporan");
        return;
      }
      router.push(`/laporan/${data.kode}?baru=1`);
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = useMemo(() => {
    if (step === 0)
      return Boolean(pos && region?.insideCimahi !== false);
    if (step === 1) return Boolean(categorySlug && deskripsi.length >= 10 && photos.length >= 1);
    if (step === 2) return Boolean(nama.length >= 2 && otpVerified);
    return false;
  }, [step, pos, region, categorySlug, deskripsi, photos, nama, otpVerified]);

  return (
    <div className="space-y-5">
      <Stepper step={step} />

      {step === 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tunjukkan lokasi kerusakan</h2>
          <p className="text-sm text-muted-foreground">
            Geser peta atau klik untuk menempatkan pin. Anda juga bisa pakai lokasi GPS HP.
          </p>
          <PinPicker value={pos} onChange={setPos} />
          {pos && region && region.insideCimahi === false && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              Titik di luar wilayah Kota Cimahi. Pindahkan pin ke dalam wilayah Cimahi.
            </p>
          )}
          {pos && region?.insideCimahi && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4" /> Wilayah terdeteksi
              </div>
              <p className="text-muted-foreground">
                Kecamatan: <span className="text-foreground">{region.kecamatan ?? "-"}</span>
                {" • "}
                Kelurahan: <span className="text-foreground">{region.kelurahan ?? "-"}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="rt">RT (opsional)</Label>
                  <Input
                    id="rt"
                    placeholder="contoh: 01"
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label htmlFor="rw">RW (opsional)</Label>
                  <Input
                    id="rw"
                    placeholder="contoh: 05"
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="alamat">Patokan alamat (opsional)</Label>
                <Input
                  id="alamat"
                  placeholder="mis. depan SD Negeri 1, dekat warung Pak Asep"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Apa yang rusak?</h2>
          <div>
            <Label className="mb-2 block">Pilih kategori</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => {
                const active = c.slug === categorySlug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategorySlug(c.slug)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <p className="font-medium">{c.nama}</p>
                    {c.deskripsi && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {c.deskripsi}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="deskripsi">Ceritakan masalahnya (minimal 10 karakter)</Label>
            <Textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: jalan berlubang cukup dalam, sudah ada beberapa motor yang oleng."
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {deskripsi.length}/1000
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Foto (minimal 1, maksimal 3)</Label>
            <PhotoUpload value={photos} onChange={setPhotos} />
          </div>

          {nearby.length > 0 && !proceedAnyway && (
            <DuplicateCheck
              items={nearby}
              onSupport={(parentId) => {
                // tetap minta identitas + OTP sebelum support
                // Simpan parent id, lanjut ke step identitas, lalu submit dengan parentReportId.
                (window as unknown as { __parentReportId?: string }).__parentReportId =
                  parentId;
                setStep(2);
              }}
              onContinue={() => setProceedAnyway(true)}
            />
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Identitas pelapor</h2>
          <p className="text-sm text-muted-foreground">
            Nomor WhatsApp diperlukan supaya kami bisa kabari progres laporan Anda.
            Nomor disimpan terenkripsi dan tidak ditampilkan ke publik.
          </p>

          <div>
            <Label htmlFor="nama">Nama lengkap</Label>
            <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="wa">Nomor WhatsApp aktif</Label>
            <div className="flex gap-2">
              <Input
                id="wa"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="numeric"
                disabled={otpVerified}
              />
              <Button
                type="button"
                onClick={requestOtp}
                disabled={!wa || otpCooldown > 0 || otpVerified}
              >
                {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Kirim ulang" : "Kirim OTP"}
              </Button>
            </div>
          </div>

          {turnstileKey && (
            <div className="cf-turnstile" data-sitekey={turnstileKey} data-callback="onTurnstileSuccess" />
          )}

          {otpSent && !otpVerified && (
            <div>
              <Label htmlFor="otp">Kode OTP (6 digit dikirim via WA)</Label>
              <div className="flex gap-2">
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                />
                <Button type="button" onClick={verifyOtp} disabled={otp.length !== 6}>
                  Verifikasi
                </Button>
              </div>
            </div>
          )}
          {otpVerified && (
            <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Nomor terverifikasi
            </p>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Ringkasan & kirim</h2>
          <ul className="space-y-2 rounded-xl border p-4 text-sm">
            <li>
              <span className="text-muted-foreground">Kategori:</span>{" "}
              {categories.find((c) => c.slug === categorySlug)?.nama}
            </li>
            <li>
              <span className="text-muted-foreground">Lokasi:</span>{" "}
              {region?.kecamatan ?? "-"} / {region?.kelurahan ?? "-"}
              {(rw || rt) && ` • RT ${rt || "-"}/RW ${rw || "-"}`}
            </li>
            <li>
              <span className="text-muted-foreground">Pelapor:</span> {nama}
            </li>
            <li>
              <span className="text-muted-foreground">Deskripsi:</span> {deskripsi}
            </li>
            <li>
              <span className="text-muted-foreground">Foto:</span> {photos.length} berkas
            </li>
          </ul>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Saya menyetujui{" "}
              <a href="/privasi" className="text-primary underline" target="_blank">
                Kebijakan Privasi
              </a>{" "}
              dan{" "}
              <a href="/panduan" className="text-primary underline" target="_blank">
                Ketentuan Pelaporan
              </a>
              . Data saya dipakai sebatas tindak lanjut PUPR Kota Cimahi.
            </span>
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>Bukan kanal darurat.</strong> Untuk kebakaran/longsor segera hubungi
            112 atau aparat setempat.
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!consent || submitting}
            onClick={() => {
              const parent = (window as unknown as { __parentReportId?: string })
                .__parentReportId;
              submit(parent);
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Kirim laporan
              </>
            )}
          </Button>
        </section>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Sebelumnya
        </Button>
        {step < 3 && (
          <Button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canNext}
          >
            Lanjut <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Turnstile callback supaya tsToken ter-set */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onTurnstileSuccess = function(token) {
              window.__tsToken = token;
              var ev = new CustomEvent('ts-success', { detail: token });
              window.dispatchEvent(ev);
            };
          `,
        }}
      />
      <TurnstileListener onToken={setTsToken} />
    </div>
  );
}

function TurnstileListener({ onToken }: { onToken: (t: string) => void }) {
  useEffect(() => {
    function listener(e: Event) {
      const token = (e as CustomEvent<string>).detail;
      if (typeof token === "string") onToken(token);
    }
    window.addEventListener("ts-success", listener);
    return () => window.removeEventListener("ts-success", listener);
  }, [onToken]);
  return null;
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex gap-1">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`flex-1 rounded-md border px-2 py-1.5 text-center text-xs font-medium transition ${
            i < step
              ? "border-primary bg-primary text-primary-foreground"
              : i === step
                ? "border-primary text-primary"
                : "text-muted-foreground"
          }`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}
