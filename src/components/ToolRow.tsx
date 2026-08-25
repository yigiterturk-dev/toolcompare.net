import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";
import { fiyatDurumu, type FiyatModeli } from "@/lib/fiyat";

/*
  Sikistirilmis arac satiri.

  Kurat"orlu bolumlerde kullaniliyor. Buyuk kart (ToolCard) arama
  sonuclarinda kaliyor; burada amac tarama, okuma degil -- 512 araclik bir
  katalogda ziyaretci once "hangi araclar var" diye goz gezdiriyor.
*/

type Arac = {
  slug: string;
  name: string;
  category?: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: FiyatModeli;
};

export default function ToolRow({ tool }: { tool: Arac }) {
  const d = fiyatDurumu(tool);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="flex w-56 shrink-0 items-center gap-3 rounded-[--radius-card] border border-line bg-surface p-3 no-underline transition-colors duration-150 hover:border-line-strong sm:w-60"
    >
      <ToolLogo slug={tool.slug} name={tool.name} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{tool.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-xs text-ink-soft">{d.kisa}</span>
          <span
            aria-hidden="true"
            className={`size-1.5 shrink-0 rounded-full ${d.karsilastirilabilir ? "bg-verified" : "bg-unverified"}`}
          />
        </span>
      </span>
      <span aria-hidden="true" className="text-ink-muted">
        ↗
      </span>
    </Link>
  );
}
