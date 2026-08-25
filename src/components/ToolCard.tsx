import Link from "next/link";
import { fiyatDurumu, type FiyatModeli } from "@/lib/fiyat";

/*
  Arac karti.

  Eski kartta uc problem vardi ve ucu de olculdu:

  1. FIYAT IKI KEZ yaziyordu -- ustte "How to start / $7/user/mo" kutusu,
     altta yine buyuk puntoyla "$7/user". Ayni bilgi, iki yer.

  2. "Review" butonu her kartta BASKA renkteydi (turuncu, mor, siyah, yesil,
     mavi, pembe). Renk hicbir sey ifade etmiyordu; tool.color1 neyse o
     kullaniliyordu. Kullanicinin kurali: renk yalnizca anlam tasidigi yerde.
     Artik butonun rengi hep ayni, cunku eylem hep ayni.

  3. Ikon kutusu tool.iconName + color1/color2 istiyordu; 512 kaydin yalnizca
     108'inde (%21) bu alanlar var. Kalan %79'da kutu bos bir gradient
     olarak ciziliyordu. Yerine harf rozeti: her kayitta calisir, tutarli
     gorunur, ve dekoratif oldugu icin aria-hidden.

  Kartin one cikardigi sey artik fiyatin KENDISI degil, fiyatin DURUMU --
  sitenin rakiplerinden ayristigi tek nokta o.
*/

type Arac = {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: FiyatModeli;
  features?: unknown[];
  keyFeatures?: unknown[];
};

function ozellikBasliklari(tool: Arac): string[] {
  const ham = (tool.keyFeatures ?? tool.features ?? []) as unknown[];
  return ham
    .slice(0, 3)
    .map((f) => (typeof f === "string" ? f : ((f as { title?: string })?.title ?? "")))
    .filter(Boolean);
}

export default function ToolCard({
  tool,
  selected,
  onToggleCompare,
}: {
  tool: Arac;
  selected: boolean;
  onToggleCompare: (name: string) => void;
}) {
  const fiyat = fiyatDurumu(tool);
  const ozellikler = ozellikBasliklari(tool);
  const dogrulandi = fiyat.karsilastirilabilir;

  return (
    <article className="group relative flex flex-col rounded-[--radius-card] border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-[--radius-control] bg-surface-sunken font-serif text-lg font-semibold text-ink-soft"
        >
          {tool.name.charAt(0)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold break-words">
            <Link
              href={`/tools/${tool.slug}`}
              className="no-underline after:absolute after:inset-0 after:content-['']"
            >
              {tool.name}
            </Link>
          </h3>
          {tool.category ? (
            <p className="mt-0.5 text-xs text-ink-muted">{tool.category}</p>
          ) : null}
        </div>

        {/*
          Karsilastirma secimi. Kartin tamami zaten bir link (yukaridaki
          after: yayilmasi), o yuzden bu buton z-10 ile onun ustunde durmali
          -- yoksa tiklanamaz.
        */}
        <button
          type="button"
          onClick={() => onToggleCompare(tool.name)}
          aria-pressed={selected}
          data-tap
          className={`relative z-10 shrink-0 rounded-[--radius-control] border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
            selected
              ? "border-brand bg-brand text-brand-ink"
              : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          {selected ? "Selected" : "Compare"}
        </button>
      </div>

      {/*
        Fiyat satiri. Tek yerde, ve yanindaki rozet fiyatin DOGRULANMIS mi
        yoksa modele mi bagli oldugunu soyluyor. Renk burada bilgi tasiyor,
        o yuzden var.
      */}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-serif text-xl font-semibold">{fiyat.kisa}</span>
        <span
          className={`rounded-[--radius-pill] px-2 py-0.5 text-[11px] font-medium ${
            dogrulandi
              ? "bg-verified-soft text-verified"
              : "bg-unverified-soft text-unverified"
          }`}
        >
          {dogrulandi ? "Verified price" : "Not a monthly price"}
        </span>
      </p>

      {tool.shortDescription ? (
        <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{tool.shortDescription}</p>
      ) : null}

      {ozellikler.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {ozellikler.map((baslik) => (
            <li
              key={baslik}
              className="rounded-[--radius-pill] bg-surface-sunken px-2 py-0.5 text-xs text-ink-soft"
            >
              {baslik}
            </li>
          ))}
        </ul>
      ) : null}

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Read the review
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </article>
  );
}
