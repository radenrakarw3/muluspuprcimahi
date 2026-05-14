"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BRAND_PROGRAM, TAGLINE } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "mulus-welcome-dismissed-v1";

export default function WelcomeDialog() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    setOpen(false);
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) dismiss();
      else setOpen(next);
    },
    [dismiss],
  );

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex flex-col sm:max-h-[min(90vh,640px)] sm:flex-row">
          <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-[42%] sm:min-h-[280px]">
            <Image
              src="/welcome-kepala-dinas.png"
              alt="Wilman Sugiansyah, Kepala Dinas PUPR Kota Cimahi"
              fill
              className="object-cover object-[center_15%]"
              sizes="(max-width: 640px) 100vw, 280px"
              priority
            />
          </div>

          <div className="flex flex-1 flex-col justify-center gap-4 p-6 pt-5 sm:p-8">
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Wilujeng Sumping
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-left text-base leading-relaxed text-muted-foreground">
                  <p>
                    Wilujeng sumping di portal <strong className="text-foreground">{BRAND_PROGRAM}</strong>. Hatur
                    nuhun atos kunjungan anjeun; babarengan urang jaga infrastruktur Kota Cimahi tetep aman sareng
                    tertib.
                  </p>
                  <p className="text-sm italic text-foreground/90">&ldquo;{TAGLINE}&rdquo;</p>
                  <p className="border-l-2 border-primary/60 pl-3 text-sm text-foreground">
                    <span className="text-muted-foreground">&mdash; </span>
                    <span className="font-semibold">Wilman Sugiansyah</span>
                    <br />
                    <span className="text-muted-foreground">Kepala Dinas PUPR Kota Cimahi</span>
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-start">
              <Button type="button" className="w-full sm:w-auto" onClick={dismiss}>
                Lanjutkan
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
