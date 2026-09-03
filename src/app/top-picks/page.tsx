import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolLogo from "@/components/ToolLogo";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listeSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu } from "@/lib/fiyat";
import { kumeIcindekiCiftler, alternatifSayfasiOlan } from "@/lib/compare";

export const metadata = {
  title: "The Cheapest Tools We Track (2026) | ToolCompare",
  description:
    "The lowest verified starting prices across our whole directory. Price is not quality — this is a price list, not a recommendation.",
};

/*
  BU SAYFA IKI AYRI SEKILDE BOZUKTU (2026-08-31):

  1. TEK BIR CSS SINIFI YOKTU. Butun sayfa <div> ve <span>'lerden
     olusuyordu ve hicbirinde className yoktu; tarayicida ciplak HTML
     olarak akiyordu -- "#1", "H", alt alta bes yildiz. Sitenin geri
     kalani Tailwind ile yazilmis, bu sayfa hic giydirilmemis.

  2. BES YILDIZ BASIYORDU. Sitenin tek satis argumani "uydurma kalite
     puani yayinlamiyoruz" ve /methodology aynen bunu yaziyor. Bu sayfa
     her araca kosulsuz bes dolu yildiz koyuyordu -- yani sitenin kendi
     sozunu yalanlayan tek yerdi. Yildizlar kaldirildi.

  3. SIRALAMA `basePrice ?? 0` ile yapiliyordu: fiyati olmayan arac
     0 sayilip en basa geciyordu. "En ucuz" listesinin ilk sirasinda
     fiyati BILINMEYEN arac cikiyordu. Artik yalnizca dogrulanmis,
     karsilastirilabilir fiyatlar listeye giriyor.
*/

const ADET = 10;

export default function TopPicksPage() {
  const olculebilir = (toolsData as any[])
    .map((t) => ({ arac: t, durum: fiyatDurumu(t) }))
    .filter((x) => x.durum.karsilastirilabilir && x.durum.aylik !== null);

  /*
    UCRETSIZLER AYRI SAYILIYOR. Ilk hal 10 satirin ONUNU "Free" olarak
    listeliyordu: 48 aracin dogrulanmis fiyati $0 ve alfabetik bir
    "Free, Free, Free..." duvari cikiyordu -- "en ucuz" listesi olarak
    hicbir sey soylemiyor. Ucretsizler sayi olarak ustte duyuruluyor,
    siralama ise PARA ISTEYENLER arasinda yapiliyor: asil merak edilen
    "ucretli tarafta taban nedir" sorusu.
  */
  const ucretsizSayisi = olculebilir.filter((x) => x.durum.aylik === 0).length;

  const siralanabilir = olculebilir
    .filter((x) => (x.durum.aylik as number) > 0)
    .sort((a, b) => (a.durum.aylik as number) - (b.durum.aylik as number))
    .slice(0, ADET);

  // Listedeki araclarin GERCEKTEN VAR OLAN karsilastirma ve alternatif
  // sayfalari. Bu sayfa daha once /tools disinda hicbir yere link
  // vermiyordu; karsilastirma sayfalari sitede oksuz kaliyordu.
  const listeSluglari = siralanabilir.map((x) => x.arac.slug);
  const ciftler = kumeIcindekiCiftler(listeSluglari, 6);
  const alternatifliler = alternatifSayfasiOlan(listeSluglari).slice(0, 6);

  const sema = listeSemasi(
    "The Cheapest Tools We Track (2026)",
    "/top-picks",
    siralanabilir.map((x) => x.arac)
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">Ranked by price</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Cheapest tools 2026</h1>

        <p className="mt-4 max-w-2xl text-ink-soft">
          The {siralanabilir.length} lowest <strong className="font-medium text-ink">verified</strong>{" "}
          paid prices in our directory of {(toolsData as any[]).length}. No one paid to be here.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          A further <strong className="font-medium text-ink">{ucretsizSayisi} tools start at $0</strong>{" "}
          on a verified free plan. They are not ranked here — a list of forty-eight identical
          &quot;Free&quot; rows tells you nothing.{" "}
          <Link href="/" className="text-accent underline underline-offset-4">
            Filter the directory by free to start
          </Link>
          .
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Cheapest is not best. This is a price list, not a recommendation, and it says nothing about
          whether any of these fit your team. Tools priced by usage or with a free tier only are left
          out — not because they are worse, but because there is no monthly number to rank them by.{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-4">
            How we rank
          </Link>
          .
        </p>

        <ol className="mt-10 list-none space-y-3 p-0">
          {siralanabilir.map(({ arac, durum }, i) => (
            <li key={arac.slug}>
              <Link
                href={`/tools/${arac.slug}`}
                className="group flex items-center gap-4 rounded-[--radius-card] border border-line bg-surface p-4 no-underline transition-colors duration-150 hover:border-line-strong sm:gap-5"
              >
                <span className="w-6 shrink-0 text-right font-serif text-lg text-ink-muted tabular-nums">
                  {i + 1}
                </span>

                <ToolLogo slug={arac.slug} name={arac.name} size={40} />

                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-base font-semibold text-ink">{arac.name}</span>
                  {arac.shortDescription ? (
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">
                      {arac.shortDescription}
                    </span>
                  ) : null}
                  {arac.category ? (
                    <span className="mt-1 block text-xs text-ink-muted">{arac.category}</span>
                  ) : null}
                </span>

                <span className="shrink-0 text-right">
                  <span className="block font-serif text-lg font-semibold text-ink tabular-nums">
                    {durum.kisa}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">Verified price</span>
                </span>

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="hidden shrink-0 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 sm:block"
                />
              </Link>
            </li>
          ))}
        </ol>

        {(ciftler.length > 0 || alternatifliler.length > 0) && (
          <section className="mt-10 rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Cheap is not the whole answer</h2>
            <p className="mt-2 text-sm text-ink-soft">
              A low starting price only matters next to what you give up. These pages put the tools
              above against the ones that do the same job.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ciftler.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/compare/${c.slug}`}
                    className="inline-flex rounded-[--radius-control] border border-line px-3 py-1.5 text-sm no-underline transition-colors duration-150 hover:border-accent"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              {alternatifliler.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/alternatives/${t.slug}`}
                    className="inline-flex rounded-[--radius-control] border border-line px-3 py-1.5 text-sm no-underline transition-colors duration-150 hover:border-accent"
                  >
                    {t.name} alternatives
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-sm text-ink-soft">
          Looking for a specific kind of tool?{" "}
          <Link href="/categories" className="text-accent underline underline-offset-4">
            Browse by category
          </Link>{" "}
          — inside each one the list is ordered the same way.
        </p>
      </main>

      <Footer />
    </>
  );
}
