"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { CheckCircle2, Loader2, ShieldAlert, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptReport,
  duplicateReport,
  rejectReport,
  resolveReport,
} from "@/app/admin/actions";
import type { ReportStatusValue } from "@/db/schema";

export default function StatusActions({
  reportId,
  status,
}: {
  reportId: string;
  status: ReportStatusValue;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal");
      }
    });
  }

  const canAccept = status === "baru";
  const canReject = status === "baru" || status === "diterima";
  const canResolve = status === "diterima";
  const canDuplicate = status === "baru" || status === "diterima";

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Aksi Admin</h2>
      <p className="text-xs text-muted-foreground">
        Status saat ini diteruskan otomatis ke pelapor via WhatsApp.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={!canAccept || pending}
          onClick={() => run(() => acceptReport({ reportId }))}
        >
          <CheckCircle2 className="h-4 w-4" /> Terima
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canResolve || pending}
          onClick={() => setResolveOpen(true)}
        >
          <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canDuplicate || pending}
          onClick={() => setDupOpen(true)}
        >
          <Users className="h-4 w-4" /> Gabung Duplikat
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={!canReject || pending}
          onClick={() => setRejectOpen(true)}
        >
          <ShieldAlert className="h-4 w-4" /> Tolak
        </Button>
      </div>

      {error && <p className="pt-2 text-sm text-destructive">{error}</p>}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={(alasan) => run(() => rejectReport({ reportId, alasan }))}
      />
      <ResolveDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        reportKode={reportId}
        onSubmit={(catatan, fotoAfterUrl) =>
          run(() => resolveReport({ reportId, catatan, fotoAfterUrl }))
        }
      />
      <DuplicateDialog
        open={dupOpen}
        onOpenChange={setDupOpen}
        onSubmit={(parentKode) =>
          run(async () => {
            const lookup = await fetch(`/api/admin/report-lookup?kode=${parentKode}`);
            if (!lookup.ok) throw new Error("Kode laporan parent tidak ditemukan.");
            const data = (await lookup.json()) as { id: string };
            await duplicateReport({ reportId, parentReportId: data.id });
          })
        }
      />
    </div>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (alasan: string) => void;
}) {
  const [alasan, setAlasan] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak laporan</DialogTitle>
          <DialogDescription>
            Alasan akan dikirim ke pelapor via WA. Tulis dengan jelas & sopan.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Mis. Lokasi yang Anda laporkan bukan jalan kewenangan Kota Cimahi. Mohon laporkan ke instansi terkait."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" /> Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (alasan.length < 5) return;
              onSubmit(alasan);
              onOpenChange(false);
            }}
          >
            Tolak Laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({
  open,
  onOpenChange,
  reportKode,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportKode: string;
  onSubmit: (catatan: string, fotoAfterUrl: string) => void;
}) {
  const [catatan, setCatatan] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "image/jpeg", reportKode }),
      });
      if (!presign.ok) throw new Error("Gagal siapkan upload");
      const { uploadUrl, publicUrl } = (await presign.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: compressed,
      });
      if (!put.ok) throw new Error("Gagal upload");
      setPhotoUrl(publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tandai selesai</DialogTitle>
          <DialogDescription>
            Wajib upload foto bukti perbaikan + catatan singkat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Foto bukti setelah perbaikan</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
              disabled={busy}
            />
            {busy && <p className="text-xs text-muted-foreground">Mengunggah...</p>}
            {photoUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="bukti"
                  className="aspect-video w-full rounded-md object-cover"
                />
              </div>
            )}
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <div>
            <Label>Catatan tindak lanjut</Label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Mis. Lubang telah ditambal dengan aspal pada 14 Mei 2026."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={!photoUrl || catatan.length < 5 || busy}
            onClick={() => {
              if (!photoUrl) return;
              onSubmit(catatan, photoUrl);
              onOpenChange(false);
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Selesaikan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DuplicateDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (parentKode: string) => void;
}) {
  const [kode, setKode] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gabungkan ke laporan lain</DialogTitle>
          <DialogDescription>
            Masukkan kode laporan asal (mis. <code>CMH-202605-1234</code>). Laporan ini
            akan ditandai sebagai duplikat.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={kode}
          onChange={(e) => setKode(e.target.value.toUpperCase())}
          placeholder="CMH-202605-1234"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={!kode}
            onClick={() => {
              onSubmit(kode);
              onOpenChange(false);
            }}
          >
            Gabung
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
