"use client";

import { useState } from "react";

/* Rozet kodunu gosterir ve tek tikla kopyalar. JS yoksa metin yine secilebilir. */
export default function KopyalaKodu({ etiket, kod }: { etiket: string; kod: string }) {
  const [durum, setDurum] = useState<"bos" | "tamam" | "hata">("bos");

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(kod);
      setDurum("tamam");
    } catch {
      setDurum("hata");
    }
    setTimeout(() => setDurum("bos"), 2000);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">{etiket}</p>
        <button
          type="button"
          onClick={kopyala}
          data-tap
          className="rounded-[--radius-control] border border-line bg-surface px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:border-line-strong"
          aria-live="polite"
        >
          {durum === "tamam" ? "Copied" : durum === "hata" ? "Select and copy" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-[--radius-control] border border-line bg-surface-sunken p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
        <code>{kod}</code>
      </pre>
    </div>
  );
}
