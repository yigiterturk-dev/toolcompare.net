import Link from "next/link";
import type { Arac } from "@/lib/arac";
import { merdiven, planEtiketi, ilkUcretliBasamak } from "@/lib/plan";
import { fiyatDurumu } from "@/lib/fiyat";

/**
 * ARAC SAYFASININ FIYAT BOLUMU.
 *
 * NEDEN (GSC, 90 gun, 2026-09-12): "<arac> pricing / cost / price" bicimindeki
 * 920 sorgu 3.140 gosterim aliyor ve TIK SAYISI SIFIR; agirlikli sira 68,8.
 * Sebebi yapisal: sayfanin baslik etiketi "Features, Pricing & Verdict" diyor
 * ama GOVDESINDE fiyat bolumu yok. 196 aracin dogrulanmis, kaynak satirli
 * merdiveni `planlar` alaninda duruyordu ve yalnizca /data ile API'de
 * basiliyordu -- yani sitenin cevabi vardi, cevabi arayan sayfada yoktu.
 * Ornek: spyfu 242 gosterim / p75 / 0 tik, oysa Basic $39, Pro $119,
 * Team $249 rakamlari kaynak cumleleriyle birlikte kayitli.
 *
 * KURAL: burada UYDURMA rakam yok. Basilan her sayi `planlar` basamagindan
 * gelir ve basamak, saticinin fiyat sayfasindan okunmus `kaynakSatiri` ile
 * birlikte gosterilir. Merdiven yoksa tablo da yoktur; onun yerine modelin
 * kendisi soylenir ("quote required" gibi) -- cunku fiyatini gizleyen araci
 * arayan kisi icin DOGRU cevap zaten budur.
 */

/** Merdiven basamaklarinin tekil kaynak adresleri. */
function kaynaklar(t: Arac): string[] {
  const g = new Set<string>();
  for (const p of merdiven(t)) if (p.kaynakUrl) g.add(p.kaynakUrl);
  return [...g];
}

/** Fiyatin dogrulandigi tarih. `fiyatKontrolTarihi` cogu araca yazilmamis; kanit kaydi yedek. */
function kontrolTarihi(t: Arac): string | null {
  return t.fiyatKontrolTarihi || t.evidence?.reviewedAt || null;
}

export default function FiyatBolumu({ tool, altSayfasiVar }: { tool: Arac; altSayfasiVar: boolean }) {
  const basamaklar = merdiven(tool);
  const durum = fiyatDurumu(tool);
  const tarih = kontrolTarihi(tool);
  const ucretli = ilkUcretliBasamak(tool);
  const bedavaBasamak = basamaklar.some((p) => p.aylik === 0);

  /*
    Acilis cumlesi. Merdiven varsa araligi soyler; yoksa modelin ne oldugunu
    soyler. Ikisi de iddia degil, kayitli veriden turetilmis ifade.
  */
  const acilis = basamaklar.length
    ? ucretli
      ? `${tool.name} publishes ${basamaklar.length} plan${basamaklar.length > 1 ? "s" : ""}. Paid tiers start at ${planEtiketi(ucretli)}${
          // Rakam yazmiyoruz: bedava basamagin tutari da merdivenden
          // okunur ve tabloda zaten gorunur. Metne elle bir sayi koymak,
          // merdivenle celisebilecek ikinci bir kaynak yaratirdi.
          bedavaBasamak ? ", and a free tier is listed alongside them" : ""
        }.`
      : `${tool.name} lists ${basamaklar.length} plan${basamaklar.length > 1 ? "s" : ""} and none of them carries a monthly charge.`
    : `${tool.name} does not publish a plan ladder we could verify. ${durum.metin}.`;

  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-t border-line pt-8"
      aria-labelledby="pricing-baslik"
    >
      <h2 id="pricing-baslik" className="text-xl font-semibold">
        {tool.name} pricing
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{acilis}</p>

      {basamaklar.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              {tool.name} plans and published prices, taken from the vendor&rsquo;s pricing page.
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-4 font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Plan
                </th>
                <th scope="col" className="py-2 pr-4 font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Price
                </th>
                <th scope="col" className="py-2 font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  What the vendor&rsquo;s page says
                </th>
              </tr>
            </thead>
            <tbody>
              {basamaklar.map((p) => (
                <tr key={`${p.ad}-${p.aylik}`} className="border-b border-line/60 align-top">
                  <th scope="row" className="py-3 pr-4 font-sans text-sm font-medium">
                    {p.ad}
                  </th>
                  <td className="py-3 pr-4 font-serif text-base font-semibold whitespace-nowrap">
                    {planEtiketi(p)}
                  </td>
                  {/*
                    Kaynak cumlesi rakamin YANINDA duruyor. Denetimde konulan
                    kural buydu: kaynagini gosterebilen rakam kazanir.
                  */}
                  <td className="py-3 text-sm text-ink-soft">{p.kaynakSatiri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-ink-muted">
        {tarih ? `Prices read from the vendor's own pricing page on ${tarih}. ` : "Prices are read from the vendor's own pricing page. "}
        Vendors change plans without notice — check the source before you budget.
        {kaynaklar(tool).map((u, i) => (
          <span key={u}>
            {" "}
            <a href={u} target="_blank" rel="nofollow noopener" className="underline">
              Source{kaynaklar(tool).length > 1 ? ` ${i + 1}` : ""}
            </a>
          </span>
        ))}
      </p>

      {/*
        PARA HUNISI. Fiyat sorgusu ticari niyetin en yogun oldugu yer: kisi
        rakami gorup "bu bana pahali" diyorsa bir sonraki adimi alternatif
        aramaktir. /alternatives sayfalari 90 gunde 1.545 gosterim / 0 tik
        aliyordu cunku onlara giden nitelikli ic trafik yoktu.
      */}
      {altSayfasiVar ? (
        <p className="mt-4 text-sm">
          <Link href={`/alternatives/${tool.slug}`} className="font-medium underline">
            Cheaper alternatives to {tool.name}
          </Link>{" "}
          <span className="text-ink-soft">— same category, ordered by verified starting price.</span>
        </p>
      ) : null}
    </section>
  );
}
