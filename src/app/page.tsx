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
    /*
      keyFeatures BASLIGA indiriliyor.

      OLCUM (2026-08-31): anasayfa 472 KB'ti; gorunur metin 5 KB, RSC
      yuku 321 KB. Tek basina `keyFeatures` 124.7 KB tutuyordu ve RSC
      sinirinda iki kez serilestiginden ~250 KB'a mal oluyordu. Oysa
      ToolCard bu alandan YALNIZCA ilk uc maddenin `title`'ini okuyor
      (ozellikBasliklari); her maddenin `description` metni istemciye
      gidiyor ve hicbir yerde gorunmuyordu.

      ToolCard zaten dizi elemaninin string olmasini destekliyor, o
      yuzden basliklari duz string dizisi olarak geciriyoruz: 124.7 KB
      -> ~12 KB.
    */
    const kf = kucuk.keyFeatures as { title?: string }[] | undefined;
    if (kf) {
      kucuk.keyFeatures = kf
        .slice(0, 3)
        .map((f) => (typeof f === "string" ? f : (f?.title ?? "")))
        .filter(Boolean);
    }
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
        /*
          Ilk 50 ile sinirli: 512 kalemlik liste tek basina 52 KB tutuyordu
          ve anasayfanin %11'iydi. Katalogun TAMAMINI Google zaten
          sitemap'ten (1.993 adres) goruyor; buradaki listenin isi kapsam
          sinyali vermek, katalogu kopyalamak degil. `numberOfItems`
          gercek sayiyi bildirmeye devam ediyor.
        */
        itemListElement: tools
          .filter((t: any) => t?.slug && t?.name)
          .slice(0, 50)
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
