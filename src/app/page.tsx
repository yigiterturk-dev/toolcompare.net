import Link from "next/link";
import ToolGridClient, { type IzgaraArac } from "@/components/ToolGridClient";
import { getTools } from "@/lib/tools";
import { izgaraKaydi } from "@/lib/izgara";
import { aracIndekslenir } from "@/lib/indeks";


export const metadata = {
  // Kanonik SAYFA BASINA yazilir; kok layout artik miras birakmiyor
  // (bkz. src/app/layout.tsx, 2026-09-09 olcumu).
  alternates: { canonical: "/" },
};
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
  /*
    Kirpma mantigi lib/izgara.ts'te: denetim betigi de AYNI fonksiyonu
    calistirsin diye (bkz. o dosyanin basligi). Burada tutuldugunda betik
    kirpmayi taklit etmek zorunda kaliyor ve turetilmis alanlari goremiyordu.
  */
  /*
    LINK KAPISI (2026-10-23): anasayfa 518 aracin tamamina link veriyordu.
    Cekirdek disi ve talep almamis sayfalar noindex oldugu icin bu, indekslenebilir
    bir sayfadan noindex sayfaya 300+ ic link demekti (ic-link-sizintisi testi).
    Kural ayni: SITEMAP'TE OL ANI LINKLE. /tools dizini bunu zaten yapiyordu,
    anasayfa yapmiyordu.
  */
  const indeksli = tumArac.filter((t) => aracIndekslenir(t));
  const tools: IzgaraArac[] = indeksli.map(
    (t: Record<string, unknown>) => izgaraKaydi(t) as unknown as IzgaraArac,
  );

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
  /*
    SSS (2026-09-21): icerik olarak eklendi -- FAQPage zengin sonucu
    Google 2023'ten beri otoriter sitelerle sinirli oldugu icin sema
    yine de veriliyor; gorunen metinle harfiyen ayni kalmak zorunda.
    Cevaplar /affiliate-disclosure ve /methodology ile ayyni gercegi
    soyluyor; uclu celisme durumunda en dogru olan kaybeder.
  */
  const sssListe = [
    {
      soru: 'What does "verified" mean on a price?',
      cevap:
        "A human opened the vendor's own pricing page and recorded the starting price, with the date. When a tool cannot honestly be put on that scale — usage-based pricing, quote-only enterprise plans, or a price we could not verify — the entry says so instead of showing a number.",
    },
    {
      soru: 'How current are the prices?',
      cevap:
        'We re-verify prices on a rolling basis. Every tool page shows the date it was last reviewed, so you can judge freshness yourself. If you spot a wrong price, tell us — corrections go through the submit page.',
    },
    {
      soru: 'Why is there no quality score?',
      cevap:
        'Because we would be inventing a number. We publish what we can actually check: verified starting prices, free-tier status and the features we looked at. Which tool is better for your team is a fit question, not a scoreboard.',
    },
    {
      soru: 'Do vendors pay for placement?',
      cevap:
        'No. Lists are ordered by verified starting price. ToolCompare takes part in affiliate programmes — some outbound links earn us a commission if you sign up — but that never changes the price you pay, a verdict, or the order of any list.',
    },
    {
      soru: 'What is "not a monthly price"?',
      cevap:
        'Some tools cannot honestly be expressed as a monthly figure: usage-based platforms bill by what you consume, and some enterprise products only give quotes. We label those as such rather than presenting them as free or as a made-up number.',
    },
  ];


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
        /*
          Ilk 50 ile sinirli: 512 kalemlik liste tek basina 52 KB tutuyordu
          ve anasayfanin %11'iydi. Katalogun TAMAMINI Google zaten
          sitemap'ten (1.993 adres) goruyor; buradaki listenin isi kapsam
          sinyali vermek, katalogu kopyalamak degil. `numberOfItems`
          gercek sayiyi bildirmeye devam ediyor.
        */
        itemListElement: tools
          .filter((t) => t?.slug && t?.name)
          .slice(0, 50)
          .map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: `https://toolcompare.net/tools/${t.slug}`,
          })),
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://toolcompare.net/#faq',
        mainEntity: sssListe.map((s) => ({
          '@type': 'Question',
          name: s.soru,
          acceptedAnswer: { '@type': 'Answer', text: s.cevap },
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
  /*
    Kategori dizini.

    ONCE 512 aracin TAMAMI listeleniyordu ve acildiginda 8.855 piksellik
    bir duvar oluyordu (sayfa 12.246px'e cikiyordu). Bozulma sebebi
    kategorilerin cok farkli buyuklukte olmasi: "Developer Tools" tek
    basina 115 arac, dort kolonluk izgarada tek hucrede binlerce piksellik
    bir sutun oluyor, yanindaki uc kolon bombos kaliyordu.

    Uzun liste, 512 urun sayfasi oksuz kalmasin diye konmustu. OLCULDU:
    o yol zaten var ve tam -- /categories 14 kategorinin hepsine link
    veriyor, /categories/developer-tools kendi 115 aracinin hepsini
    listeliyor. Yani her arac ana sayfadan uc tikla erisilebilir ve
    taranabilir. Duvara gerek yok.

    Geriye insana da yarayan sey kaldi: 14 kategori, arac sayilariyla.

    `key` bilerek var: bu JSX sunucu bileseninden istemci bilesenine prop
    olarak geciyor ve RSC sinirinda serilestiriliyor. Anahtarsiz birakinca
    React "Each child in a list should have a unique key prop" uyariyor.
  */
  const dizin = (
    <details
      key="kategori-dizini"
      className="mx-auto max-w-7xl border-t border-line px-4 py-8 sm:px-6"
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-[--radius-control] border border-line bg-surface px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:border-line-strong [&::-webkit-details-marker]:hidden">
        Browse all {tools.length} tools by category
        <span aria-hidden="true" className="text-ink-muted">
          ▾
        </span>
      </summary>

      <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {sirali.map(([kategori, liste]) => (
          <li key={kategori}>
            <Link
              href={`/categories/${kategori.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-baseline justify-between gap-3 rounded-[--radius-card] border border-line bg-surface px-4 py-3 no-underline transition-colors duration-150 hover:border-line-strong"
            >
              <span className="font-medium">{kategori}</span>
              <span className="shrink-0 text-sm text-ink-muted">
                {liste.length} {liste.length === 1 ? "tool" : "tools"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );

  const sss = (
    <section className="mx-auto max-w-4xl border-t border-line px-4 py-12 sm:px-6">
      <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
      <div className="mt-6 space-y-5">
        {sssListe.map((s) => (
          <div key={s.soru}>
            <h3 className="font-medium">{s.soru}</h3>
            <p className="mt-1 text-ink-soft">{s.cevap}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        The full method, with its limits, is on the{' '}
        <Link href="/methodology" className="text-accent underline underline-offset-4">
          methodology
        </Link>{' '}
        page. Corrections are welcome via{' '}
        <Link href="/submit" className="text-accent underline underline-offset-4">
          submit
        </Link>
        .
      </p>
    </section>
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
      <ToolGridClient initialTools={tools} dizin={dizin} sss={sss} />

    </>
  );
}
