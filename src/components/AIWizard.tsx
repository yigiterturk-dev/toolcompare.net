"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fiyatDurumu, type FiyatModeli } from "@/lib/fiyat";

/*
  "Bana uygun olani bul" secicisi.

  DENETIMDE BULUNAN (2026-08-25): bu bilesen "Our AI Recommendations"
  basligiyla siralama yapiyordu ve siralamayi UC alandan uretiyordu:

    t.ease           -> 512 kaydin 108'inde var (%21)
    t.featuresScore  -> 512 kaydin 108'inde var (%21)
    t.trial          -> 512 kaydin SIFIRINDA var

  Sonuclari:
  - `t.trial` hicbir kayitta olmadigi icin "ucretsiz" dali hicbir zaman
    puan eklemiyordu; olu koddu.
  - `score += t.ease` 404 aracta `undefined` ekliyordu, yani skor NaN
    oluyordu. NaN ile sort() sonucu tanimsizdir -- "AI onerisi" pratikte
    rastgele bir siralamaydi.
  - Daha onemlisi: `ease` ve `featuresScore` bu depoda UYDURMA PUAN olarak
    tespit edilip sayfalardan sokulmustu. Site "uydurma kalite puani
    yayinlamiyoruz" diye satarken, oneri motoru tam olarak onlari
    kullaniyordu.

  Yeni surum yalnizca DOGRULANABILIR veriyle calisiyor: kategori, fiyat
  modeli ve dogrulanmis aylik fiyat. Adi da artik yaptigi seyi soyluyor --
  bu bir filtre, AI degil.
*/

type Arac = {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: FiyatModeli;
};

type Butce = "free" | "under25" | "any";

const BUTCELER: { deger: Butce; etiket: string; aciklama: string }[] = [
  { deger: "free", etiket: "Free to start", aciklama: "Free plan or a free tier" },
  { deger: "under25", etiket: "Under $25", aciklama: "Verified monthly price" },
  { deger: "any", etiket: "Any price", aciklama: "Show everything" },
];

function butceyeUyar(t: Arac, butce: Butce): boolean {
  const d = fiyatDurumu(t);
  if (butce === "any") return true;
  if (butce === "free") {
    // "Bedava" ve "ucretsiz katman" veriden geliyor, tahmin degil.
    return d.kisa === "Free" || d.kisa === "Free tier";
  }
  // Fiyat dogrulanmamissa "25 dolarin altinda" DIYEMEYIZ; listeye almiyoruz.
  return d.karsilastirilabilir && d.aylik !== null && d.aylik > 0 && d.aylik < 25;
}

export default function AIWizard({ tools }: { tools: Arac[] }) {
  const [kategori, setKategori] = useState<string>("");
  const [butce, setButce] = useState<Butce>("any");

  const kategoriler = useMemo(
    () =>
      Array.from(new Set(tools.map((t) => t.category).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b),
      ),
    [tools],
  );

  /*
    ONCEDEN: kategori secilene kadar `sonuclar` bostu ve sag sutunda
    "Choose a category to see matching tools." yazan kocaman kesikli
    bir kutu duruyordu -- ekranin yarisi bos, hicbir ise yaramayan bir
    bosluk. Artik secim yokken TUM kategorilerden en ucuz dogrulanmis
    araclar listeleniyor; bolum ilk bakista zaten calisir durumda.
  */
  const sonuclar = useMemo(() => {
    return tools
      .filter((t) => !kategori || t.category === kategori)
      .filter((t) => butceyeUyar(t, butce))
      .sort((a, b) => {
        const da = fiyatDurumu(a);
        const db = fiyatDurumu(b);
        // Dogrulanmis fiyati olan once; sonra ucuzdan pahaliya; sonra ada gore.
        const ga = da.karsilastirilabilir ? 0 : 1;
        const gb = db.karsilastirilabilir ? 0 : 1;
        if (ga !== gb) return ga - gb;
        if (da.aylik !== null && db.aylik !== null && da.aylik !== db.aylik) {
          return da.aylik - db.aylik;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 9);
  }, [tools, kategori, butce]);

  return (
    <div>
      <h2 className="text-2xl font-semibold sm:text-3xl">Not sure where to start?</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Pick a category and a budget. Results are ordered by verified monthly price — nothing here
        is scored or ranked by us.
      </p>

      {/*
        DUZEN DEGISTI: filtreler dar bir sol sutunda dikey yigiliyordu;
        butce kartlari gereksiz yer kapliyor, sag taraf bos kaliyordu.
        Artik filtreler tam genislikte tek serit, sonuclar altinda uc
        sutunlu izgara.
      */}
      <div className="mt-8">
        <div className="flex flex-col gap-5 border-y border-line py-5">
          <fieldset>
            <legend className="text-xs font-medium tracking-wide text-ink-muted uppercase">
              Category
            </legend>
            {/*
              Native <select> kullanilmiyor (proje kurali). Yerine gorunur
              secenek listesi; klavyeyle gezilebiliyor ve secili olan
              aria-pressed ile bildiriliyor.
            */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKategori("")}
                aria-pressed={kategori === ""}
                data-tap
                className={`rounded-[--radius-pill] border px-3 py-1.5 text-sm transition-colors duration-150 ${
                  kategori === ""
                    ? "border-brand bg-brand text-brand-ink"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                }`}
              >
                All
              </button>
              {kategoriler.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategori(k === kategori ? "" : k)}
                  aria-pressed={k === kategori}
                  data-tap
                  className={`rounded-[--radius-pill] border px-3 py-1.5 text-sm transition-colors duration-150 ${
                    k === kategori
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium tracking-wide text-ink-muted uppercase">
              Budget
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUTCELER.map((b) => (
                <button
                  key={b.deger}
                  type="button"
                  onClick={() => setButce(b.deger)}
                  aria-pressed={b.deger === butce}
                  data-tap
                  title={b.aciklama}
                  className={`rounded-[--radius-pill] border px-3 py-1.5 text-sm transition-colors duration-150 ${
                    b.deger === butce
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {b.etiket}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-6">
          {sonuclar.length === 0 ? (
            <div className="rounded-[--radius-card] border border-line bg-surface p-8">
              <p className="font-serif text-lg font-semibold">
                No {kategori || "tool"} matches that budget.
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {butce === "under25"
                  ? "Only tools with a verified monthly price under $25 are listed here — a tool whose price we have not verified is never counted as cheap."
                  : "Try a wider budget."}
              </p>
            </div>
          ) : (
            <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {sonuclar.map((t) => {
                const d = fiyatDurumu(t);
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/tools/${t.slug}`}
                      className="block h-full rounded-[--radius-card] border border-line bg-surface p-4 no-underline transition-colors duration-150 hover:border-line-strong"
                    >
                      <p className="font-serif text-base font-semibold">{t.name}</p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium">{d.kisa}</span>
                        <span
                          className={`rounded-[--radius-pill] px-1.5 py-0.5 text-[11px] ${
                            d.karsilastirilabilir
                              ? "bg-verified-soft text-verified"
                              : "bg-unverified-soft text-unverified"
                          }`}
                        >
                          {d.karsilastirilabilir ? "Verified" : "Not a monthly price"}
                        </span>
                      </p>
                      {t.shortDescription ? (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                          {t.shortDescription}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
