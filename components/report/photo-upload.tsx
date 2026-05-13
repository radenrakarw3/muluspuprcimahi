"use client";

import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadedPhoto = { key: string; publicUrl: string; preview: string };

const MAX_PHOTOS = 3;
const COMPRESS_OPTIONS = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.82,
};

export default function PhotoUpload({
  value,
  onChange,
}: {
  value: UploadedPhoto[];
  onChange: (v: UploadedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      const slots = MAX_PHOTOS - value.length;
      if (slots <= 0) {
        setError(`Maksimal ${MAX_PHOTOS} foto.`);
        return;
      }
      const toProcess = Array.from(files).slice(0, slots);
      setBusy(true);
      try {
        const next: UploadedPhoto[] = [];
        for (const raw of toProcess) {
          if (!raw.type.startsWith("image/")) continue;
          const compressed = await imageCompression(raw, COMPRESS_OPTIONS);
          const presign = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType: "image/jpeg" }),
          });
          if (!presign.ok) {
            const j = await presign.json().catch(() => ({}));
            throw new Error(j.error || "Gagal menyiapkan upload");
          }
          const { key, uploadUrl, publicUrl } = (await presign.json()) as {
            key: string;
            uploadUrl: string;
            publicUrl: string;
          };
          const put = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: compressed,
          });
          if (!put.ok) throw new Error(`Gagal unggah foto (status ${put.status})`);
          next.push({ key, publicUrl, preview: URL.createObjectURL(compressed) });
        }
        onChange([...value, ...next]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal mengunggah foto");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange, value],
  );

  function removeAt(i: number) {
    const copy = [...value];
    copy.splice(i, 1);
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {value.map((p, i) => (
          <div
            key={p.key}
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
              aria-label="Hapus foto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span>{busy ? "Mengunggah..." : "Tambah foto"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute("capture", "environment");
              inputRef.current.click();
            }
          }}
          disabled={busy || value.length >= MAX_PHOTOS}
        >
          <Camera className="h-4 w-4" /> Ambil dari kamera
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.removeAttribute("capture");
              inputRef.current.click();
            }
          }}
          disabled={busy || value.length >= MAX_PHOTOS}
        >
          <ImagePlus className="h-4 w-4" /> Dari galeri
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Maksimal {MAX_PHOTOS} foto. Foto akan otomatis dikompres agar hemat kuota.
      </p>
    </div>
  );
}
