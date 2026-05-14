"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { PinPicker } from "@/components/map/loaders";
import PhotoUpload, { type UploadedPhoto } from "./photo-upload";
import DuplicateCheck from "./duplicate-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KECAMATAN_CIMAHI, getKelurahanList, isValidWilayah } from "@/lib/cimahi-wilayah";
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

const RT_RW_NUMBERS = Array.from({ length: 40 }, (_, i) => String(i + 1));

function isRtRwValid(v: string): boolean {
  return /^(?:[1-9]|[12][0-9]|3[0-9]|40)$/.test(v);
}

/** Lima layar: satu tugas utama tiap layar (gaya “level” game). */
const STEP_LAST = 4;

const STEP_TITLE = [
  "Letakkan pin",
  "Wilayah",
  "Kerusakan",
  "WhatsApp",
  "Kirim",
] as const;

export default function ReportWizard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [pos, setPos] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [alamat, setAlamat] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [wilayahTouched, setWilayahTouched] = useState(false);

  const [categorySlug, setCategorySlug] = useState<string>("");
  const [deskripsi, setDeskripsi] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nearby, setNearby] = useState<NearbyReport[]>([]);
  const [proceedAnyway, setProceedAnyway] = useState(false);

  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [tsToken, setTsToken] = useState<string | undefined>();

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

  useEffect(() => {
    if (!region?.insideCimahi || wilayahTouched) return;
    const k = region.kecamatan?.trim();
    const kl = region.kelurahan?.trim();
    if (k && kl && isValidWilayah(k, kl)) {
      setKecamatan(k);
      setKelurahan(kl);
    }
  }, [region, wilayahTouched]);

  useEffect(() => {
    setWilayahTouched(false);
  }, [pos?.lat, pos?.lng]);

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

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const i = setInterval(() => setOtpCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [otpCooldown]);

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
        kecamatan,
        kelurahan,
        alamat: alamat || null,
        rw: rw,
        rt: rt,
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
      const data = (await res.json().catch(() => ({}))) as { error?: string; kode?: string };
      if (!res.ok) {
        setError(data.error ?? `Gagal mengirim (${res.status}). Coba lagi.`);
        queueMicrotask(() =>
          document.getElementById("report-submit-error")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        );
        return;
      }
      if (!data.kode) {
        setError("Respons server tidak lengkap. Hubungi admin.");
        return;
      }
      router.push(`/laporan/${data.kode}?baru=1`);
    } finally {
      setSubmitting(false);
    }
  }

  const kelurahanOptions = useMemo(() => getKelurahanList(kecamatan), [kecamatan]);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(pos && region?.insideCimahi === true);
    if (step === 1)
      return Boolean(
        kecamatan &&
          kelurahan &&
          isValidWilayah(kecamatan, kelurahan) &&
          isRtRwValid(rt) &&
          isRtRwValid(rw),
      );
    if (step === 2)
      return Boolean(
        categorySlug &&
          deskripsi.length >= 10 &&
          photos.length >= 1 &&
          (nearby.length === 0 || proceedAnyway),
      );
    if (step === 3) return Boolean(nama.length >= 2 && otpVerified);
    return false;
  }, [
    step,
    pos,
    region,
    kecamatan,
    kelurahan,
    rt,
    rw,
    categorySlug,
    deskripsi,
    photos,
    nama,
    otpVerified,
    nearby.length,
    proceedAnyway,
  ]);

  const catNama = categories.find((c) => c.slug === categorySlug)?.nama;

  return (
    <div className="flex min-h-[min(85vh,720px)] flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <DotProgress current={step} total={STEP_LAST + 1} />
        <span className="text-xs font-medium text-muted-foreground">
          {step + 1}/{STEP_LAST + 1}
        </span>
      </div>

      <h2 className="text-center text-xl font-bold leading-tight text-foreground md:text-2xl">
        {STEP_TITLE[step]}
      </h2>

      <div className="min-h-0 flex-1 space-y-4">
        {step === 0 && (
          <section className="space-y-3">
            <PinPicker value={pos} onChange={setPos} />
            {pos && region && region.insideCimahi === false && (
              <p className="rounded-lg border-2 border-primary bg-destructive p-3 text-center text-sm text-destructive-foreground">
                Pin di luar Cimahi — geser ke dalam kota.
              </p>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="mx-auto w-full max-w-md space-y-4">
            {region?.insideCimahi && (region.kecamatan || region.kelurahan) && (
              <p className="text-center text-xs text-muted-foreground">
                Saran dari peta: {region.kecamatan ?? "—"} / {region.kelurahan ?? "—"}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="kecamatan" className="text-base">
                Kecamatan
              </Label>
              <Select
                value={kecamatan || undefined}
                onValueChange={(v) => {
                  setWilayahTouched(true);
                  setKecamatan(v);
                  setKelurahan("");
                }}
              >
                <SelectTrigger id="kecamatan" className="h-12 bg-card text-base">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {KECAMATAN_CIMAHI.map((k) => (
                    <SelectItem key={k.nama} value={k.nama}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelurahan" className="text-base">
                Kelurahan
              </Label>
              <Select
                value={kelurahan || undefined}
                onValueChange={(v) => {
                  setWilayahTouched(true);
                  setKelurahan(v);
                }}
                disabled={!kecamatan}
              >
                <SelectTrigger id="kelurahan" className="h-12 bg-card text-base">
                  <SelectValue placeholder={kecamatan ? "Pilih" : "…"} />
                </SelectTrigger>
                <SelectContent>
                  {kelurahanOptions.map((kl) => (
                    <SelectItem key={kl.nama} value={kl.nama}>
                      {kl.nama} ({kl.kodePos})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rt" className="text-base">
                  RT <span className="text-primary">*</span>
                </Label>
                <Select
                  value={rt || undefined}
                  onValueChange={(v) => {
                    setWilayahTouched(true);
                    setRt(v);
                  }}
                >
                  <SelectTrigger id="rt" className="h-12 bg-card text-base">
                    <SelectValue placeholder="1–40" />
                  </SelectTrigger>
                  <SelectContent>
                    {RT_RW_NUMBERS.map((n) => (
                      <SelectItem key={`rt-${n}`} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rw" className="text-base">
                  RW <span className="text-primary">*</span>
                </Label>
                <Select
                  value={rw || undefined}
                  onValueChange={(v) => {
                    setWilayahTouched(true);
                    setRw(v);
                  }}
                >
                  <SelectTrigger id="rw" className="h-12 bg-card text-base">
                    <SelectValue placeholder="1–40" />
                  </SelectTrigger>
                  <SelectContent>
                    {RT_RW_NUMBERS.map((n) => (
                      <SelectItem key={`rw-${n}`} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <details className="rounded-lg border border-border bg-card/50 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium text-foreground">Patokan alamat (opsional)</summary>
              <div className="mt-2">
                <Label htmlFor="alamat" className="text-xs">
                  Patokan
                </Label>
                <Input
                  id="alamat"
                  className="mt-1"
                  placeholder="mis. depan gapura"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>
            </details>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {categories.map((c) => {
                const active = c.slug === categorySlug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategorySlug(c.slug)}
                    className={`rounded-xl border-2 p-4 text-left text-base font-semibold transition active:scale-[0.98] ${
                      active
                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-border bg-card text-foreground hover:border-primary/60"
                    }`}
                  >
                    {c.nama}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi" className="text-base">
                Cerita singkat
              </Label>
              <Textarea
                id="deskripsi"
                className="min-h-[100px] resize-none text-base"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Apa kondisinya?"
                maxLength={1000}
              />
              <p className="text-right text-xs text-muted-foreground">{deskripsi.length}/1000</p>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Foto (1–3)</Label>
              <PhotoUpload value={photos} onChange={setPhotos} />
            </div>

            {nearby.length > 0 && !proceedAnyway && (
              <DuplicateCheck
                items={nearby}
                onSupport={(parentId) => {
                  (window as unknown as { __parentReportId?: string }).__parentReportId = parentId;
                  setStep(3);
                }}
                onContinue={() => setProceedAnyway(true)}
              />
            )}
          </section>
        )}

        {step === 3 && (
          <section className="mx-auto w-full max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-base">
                Nama
              </Label>
              <Input
                id="nama"
                className="h-12 text-base"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa" className="text-base">
                WhatsApp
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wa"
                  className="h-12 flex-1 text-base"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="08…"
                  inputMode="numeric"
                  disabled={otpVerified}
                />
                <Button
                  type="button"
                  className="h-12 shrink-0 px-4"
                  onClick={requestOtp}
                  disabled={!wa || otpCooldown > 0 || otpVerified}
                >
                  {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Ulang" : "OTP"}
                </Button>
              </div>
            </div>

            {turnstileKey && (
              <div className="cf-turnstile flex justify-center" data-sitekey={turnstileKey} data-callback="onTurnstileSuccess" />
            )}

            {otpSent && !otpVerified && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-base">
                  Kode 6 digit
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    className="h-12 flex-1 text-center text-lg tracking-[0.3em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="••••••"
                  />
                  <Button type="button" className="h-12 shrink-0" onClick={verifyOtp} disabled={otp.length !== 6}>
                    OK
                  </Button>
                </div>
              </div>
            )}
            {otpVerified && (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-5 w-5" /> Terverifikasi
              </p>
            )}
          </section>
        )}

        {step === 4 && (
          <section className="mx-auto w-full max-w-md space-y-5">
            <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
              <p>
                <span className="text-muted-foreground">Kategori:</span> {catNama ?? "—"}
              </p>
              <p className="mt-1">
                <span className="text-muted-foreground">Lokasi:</span> {kecamatan} / {kelurahan} · RT{rt}/RW{rw}
              </p>
              <p className="mt-1">
                <span className="text-muted-foreground">Nama:</span> {nama}
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-sm leading-snug">
                Saya setuju{" "}
                <a href="/privasi" className="text-primary underline" target="_blank">
                  privasi
                </a>{" "}
                &{" "}
                <a href="/panduan" className="text-primary underline" target="_blank">
                  panduan
                </a>
                .
              </span>
            </label>

            <p className="text-center text-xs text-muted-foreground">Bukan nomor darurat — kebakaran hubungi 112.</p>

            {error && (
              <p
                id="report-submit-error"
                className="rounded-lg border-2 border-primary bg-destructive p-3 text-center text-sm text-destructive-foreground"
              >
                {error}
              </p>
            )}

            <Button
              type="button"
              size="lg"
              className="h-14 w-full text-lg font-bold"
              disabled={!consent || submitting}
              onClick={() => {
                const parent = (window as unknown as { __parentReportId?: string }).__parentReportId;
                submit(parent);
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" /> Kirim
                </>
              )}
            </Button>
          </section>
        )}
      </div>

      {step < 4 && (
        <footer className="sticky bottom-0 z-10 mt-auto flex gap-2 border-t border-border bg-background/95 py-3 pt-4 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            className="h-12 min-w-0 flex-1 text-base font-bold"
            disabled={!canNext}
            onClick={() => setStep((s) => Math.min(STEP_LAST, s + 1))}
          >
            Lanjut
          </Button>
        </footer>
      )}

      {step === 4 && (
        <footer className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/95 py-3 pt-4 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Ubah data
          </Button>
        </footer>
      )}

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

function DotProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-1 items-center gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
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
