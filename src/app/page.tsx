import Link from "next/link";
import ToolGridClient, { type IzgaraArac } from "@/components/ToolGridClient";
import { getTools } from "@/lib/tools";

// Sunucu bileseni: veriyi burada yukluyoruz ki urun linkleri HTML'e girsin.
// Onceden sayfanin tamami "use client" idi ve useSearchParams() yuzunden
// statik uretimde bailout ediyordu; Google yalnizca "Loading..." goruyordu.
export const revalidate = 3600;

export default async function Home() {
  const tumArac = await getTools();

  // Izgaranin gercekten kullandigi alanlar. Tam kayitlari prop gecirince
  // (longDescription, pros, cons, keyFeatures, targetAudience, verdict...)
  // hepsi HTML'e seri hale geliyor ve dokuman 518 KB'a cikiyordu. Bu alanlar
  // yalnizca urun detay sayfasinda lazim; orada zaten dogrudan okunuyor.
  /*
    DENETIMDE BULUNAN (2026-08-25): bu liste ELLE yazilmisti ve
    `fiyatModeli` icinde yoktu. fiyatDurumu() o alan olmayinca basePrice'a
    dusuyor; basePrice 0 olan her arac icin "Pricing not verified" diyordu.
    Olculdu: 266 arac anasayfada "not verified" gorunurken KENDI URUN
    SAYFASINDA dogru etiketi gosteriyordu (HubSpot anasayfada
    "not verified", kendi sayfasinda "Free tier available"). Site kendi
    kendisiyle celisiyordu -- hem de tam sattigi konuda.

    Elle tutulan alan listesi, bir alan eklendiginde sessizce eskiyen bir
    liste demek. scripts/check-izgara-alanlari.mjs bu celiskiyi olcuyor.

    `ease`, `featuresScore`, `iconName`, `color*` cikarildi: uydurma
    puanlar sokulmustu ve ikon/renk yerine artik gercek logo kullaniliyor.
  */
  const IZGARA_ALANLARI = [
    "slug", "name", "category", "shortDescription",
    "basePrice", "isFlat", "fiyatModeli", "features", "keyFeatures",
  ] as const;

  /*
    Kirpma ciktisi TIPLI. Onceden `Record<string, unknown>` donuyordu ve
    o yuzden asagidaki `t.slug` / `t.name` kullanimlari derleyicide hata
    veriyordu (5 adet, aylardir duruyordu). Tip verilince hem o hatalar
    kapandi hem de bir alan kirpildiginda derleyici uyariyor.
  */
  const tools: IzgaraArac[] = tumArac.map((t: Record<string, unknown>) => {
    const kucuk: Record<string, unknown> = {};
    for (const alan of IZGARA_ALANLARI) if (t?.[alan] !== undefined) kucuk[alan] = t[alan];
    return kucuk as unknown as IzgaraArac;
  });

  // Izgara sayfalama yaptigi icin HTML'e yalnizca ilk sayfanin linkleri
  // giriyordu; kalan urun sayfalari hicbir yerden linklenmiyordu (orphan).
  // Kategoriye gore gruplanmis tam dizin hem taranabilirligi hem de
  // gezinmeyi cozer.
  const kategoriler = new Map<string, { slug: string; name: string }[]>();
  for (const t of tools) {
    if (!t?.slug || !t?.name) continue;
    const k = t.category || "Other";
    if (!kategoriler.has(k)) kategoriler.set(k, []);
    kategoriler.get(k)!.push({ slug: t.slug, name: t.name });
  }
  const sirali = [...kategoriler.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, liste] of sirali) liste.sort((a, b) => a.name.localeCompare(b.name));

  // Site geneli yapilandirilmis veri: arama kutusu (sitelinks searchbox) ve
  // yayinci kimligi. Arac listesi ItemList olarak veriliyor ki Google
  // katalogun kapsamini tek istekte gorsun.
  const siteSemasi = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://toolcompare.net/#org",
        name: "ToolCompare",
        url: "https://toolcompare.net",
      },
      {
        "@type": "WebSite",
        "@id": "https://toolcompare.net/#site",
        url: "https://toolcompare.net",
        name: "ToolCompare",
        publisher: { "@id": "https://toolcompare.net/#org" },
      },
      {
        "@type": "ItemList",
        name: `${tools.length} software tools reviewed`,
        numberOfItems: tools.length,
        itemListElement: tools
          .filter((t: any) => t?.slug && t?.name)
          .map((t: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: `https://toolcompare.net/tools/${t.slug}`,
          })),
      },
    ],
  };

  /*
    `key` bilerek var: bu JSX sunucu bileseninden istemci bilesenine prop
    olarak geciyor ve RSC sinirinda serilestiriliyor. Anahtarsiz birakinca
    React "Each child in a list should have a unique key prop -- it was
    passed a child from Home" uyarisi veriyor.
  */
  const dizin = (
      <details key="tam-dizin" className="mx-auto max-w-7xl border-t border-line px-4 py-8 sm:px-6">
        {/*
          Katlanmis: acikken 512 linklik bir duvar oluyordu ve sayfanin
          gorsel agirliginin cogunu kapliyordu. Kapaliyken de linkler
          HTML'de duruyor -- tarayicilar goruyor, ziyaretci duvarla
          karsilasmiyor. Bu liste 512 urun sayfasinin oksuz kalmamasini
          saglayan tek ic link yolu, o yuzden silinmiyor.
        */}
        <summary className="cursor-pointer text-sm font-medium marker:text-ink-muted">
          Browse all {tools.length} tools by category
        </summary>
        <div className="pt-6">
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {sirali.map(([kategori, liste]) => (
            <div key={kategori}>
              {/*
                Baslik rengi #9ca3af idi; beyaz zeminde olculen kontrast 2.43
                (WCAG minimumu 4.5). Token'a baglandi.
              */}
              <h3 className="font-sans text-xs font-medium tracking-wide text-ink-muted uppercase">
                {kategori}
              </h3>
              <ul className="mt-3 list-none space-y-1.5 p-0">
                {liste.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tools/${t.slug}`}
                      className="text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </div>
      </details>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSemasi) }}
      />
      {/*
        Dizin ARTIK ToolGridClient'IN ICINDE, footer'dan once.

        DENETIMDE BULUNAN (2026-08-25): burada <ToolGridClient /> zaten
        kendi icinde Footer render ediyor; dizin ondan SONRA geliyordu.
        Yani sayfa sirasi soyleydi: icerik -> footer -> telif -> ve altinda
        512 linklik dev liste. Footer sayfanin ortasinda kaliyor, liste
        ondan sarkiyordu.
      */}
      <ToolGridClient initialTools={tools} dizin={dizin} />

    </>
  );
}
