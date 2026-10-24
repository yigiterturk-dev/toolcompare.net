import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReklamBirimi from "@/components/ReklamBirimi";
import { ciftReklamAlir, reklamYayinci, icerikSlotu } from "@/lib/reklam";
import toolsData from "@/data/tools.json"
import type { Arac, Kanit, Kaynak, OneCikanOzellik } from "@/lib/arac";
import { gitLinki } from "@/lib/outbound";
import { relDegeri } from "@/lib/affiliate";
import AffiliateNotu from "@/components/AffiliateNotu";
import { kanonikSlug, akranlar, karsilastirmaCiftleri, ciftIndekslenebilirMi, ayrimCumlesi } from "@/lib/compare";
import { listeSemasi, kirintiSemasi, sssSemasi } from "@/lib/yapilandirilmis";
import { karsilastirmaSss } from "@/lib/sss";
import { elleYazilmisSorular, elleYazilmisKisaCevap } from "@/lib/karsilastirma-notlari";
import { ilkUcretliBasamak, koltukMaliyeti, merdiven, planEtiketi } from "@/lib/plan";
import { linklenebilirAkranlar, aracTaranmayaDeger } from "@/lib/tarama";
import { fiyatDurumu } from "@/lib/fiyat";
import { ciftMetaAciklamasi } from "@/lib/meta";
import { entegrasyonKaydi, entegrasyonBasligi, durumEtiketi } from "@/lib/entegrasyon";
import { evidenceLabel, toolEvidence } from "@/lib/evidence";
import { KRITER_SIRA, KRITER_ETIKET } from "@/lib/kriterler";
import { notFound } from "next/navigation";
import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";
import { CheckCircle2, X, Zap, Star, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";

import { paylasimMeta } from "@/lib/paylasim";
import { aracIndekslenir } from "@/lib/indeks";

const paraBicim = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
/**
 * Karsilastirma sayfalari build aninda uretilsin.
 *
 * Onceden bu rota tek DINAMIK sayfa turuydu: 417 sayfa HER istekte
 * yeniden render ediliyordu (olculdu: ilk bayta 12,5 ms, statik
 * sayfalarda 1,5-5,2 ms). Sitenin en kalabalik sayfa grubu ve arama
 * motorunun en cok tarayacagi grup burasi.
 *
 * dynamicParams VARSAYILAN (true) birakildi: listede olmayan bir cift --
 * ornegin ters sirali /compare/zapier-vs-1password -- yine calisir ve
 * kanonik adresi gosterir. Kapatmak o adresleri 404 yapardi.
 */
/** Arama sonucu ~158 karakter gosterir; cumle sinirinda kes, ortadan kesme. */
function metaKisalt(metin: string, sinir = 158): string {
  if (metin.length <= sinir) return metin;
  // Cumleleri sigdigi kadar al; tek cumle cok kisa kalirsa kelime sinirinda kes.
  const cumleler = metin.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [metin];
  let birikim = "";
  for (const c of cumleler) {
    if ((birikim + c).trim().length > sinir) break;
    birikim += c;
  }
  birikim = birikim.trim();
  if (birikim.length >= 90) return birikim;
  return metin.slice(0, sinir).replace(/\s+\S*$/, "") + "…";
}

export function generateStaticParams() {
  return karsilastirmaCiftleri().map((slug) => ({ slug }));
}

type SayfaParametresi = { params: Promise<{ slug: string }> }

/*
  Bilesen render icinde tanimliydi (react-hooks/static-components): her
  render'da yeni bilesen tipi uretiliyordu. Props disinda kapanis
  degiskeni kullanmadigi icin modul kapsamina alindi.
*/
const ComparisonRow = ({ label, val1, val2 }: { label: string; val1: React.ReactNode; val2: React.ReactNode }) => (
  <tr className="border-t border-line">
    <th scope="row" className="py-3 pr-3 text-left align-top text-xs font-medium tracking-wide text-ink-muted uppercase">
      {label}
    </th>
    <td className="py-3 pr-3 align-top text-sm">{val1}</td>
    <td className="py-3 align-top text-sm">{val2}</td>
  </tr>
);

function VisitButtons({ tools }: { tools: Arac[] }) {
  const available = tools.filter((tool) => tool.websiteUrl);
  if (!available.length) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4" role="group" aria-label="Visit tools">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Ready to try?</span>
      {available.map((tool) => (
        <a
          key={tool.slug}
          href={gitLinki(tool.slug)}
          target="_blank"
          rel={relDegeri(tool.slug)}
          className="inline-flex items-center gap-1.5 rounded-[--radius-pill] bg-accent px-3.5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-accent/90"
        >
          Visit {tool.name} <ArrowRight size={14} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: SayfaParametresi): Promise<Metadata> {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) return { title: "Comparison" };
  
  const tool1 = (toolsData as Arac[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as Arac[]).find((t) => t.slug === parts[1]);
  
  if (!tool1 || !tool2) return { title: "Comparison" };

  // Baslik 65 karakteri asarsa arama sonucunda kesilir; marka adi
  // uzun ciftlerde dusuruluyor ki asil ifade ("X vs Y") gorunur kalsin.
  // Uc kademeli kisaltma: cok uzun isimlerde CEKIRDEK basligin kendisi de
  // 65'i asiyordu (ornek: "ActiveCampaign vs Ahrefs Webmaster Tools").
  /*
    ENTEGRASYON CIFTI (GSC, 2026-09-12): bu adreslere gelen talebin bir kismi
    "hangisi daha iyi" degil "bunlar birlikte calisiyor mu" sorusu --
    "typeform kajabi integration", "woocommerce teachable integration".
    Kaydi olan ciftte baslik ve aciklama SORUYA doner; yoksa karsilastirma
    basligi kalir. Adres degismiyor: bu sayfalar Google'da zaten sirada
    (getresponse-vs-typeform 13., teachable-vs-woocommerce 20.) ve yeni bir
    adrese tasimak o birikimi cope atardi.
  */
  const ent = entegrasyonKaydi(tool1.slug, tool2.slug);
  const cekirdek = ent
    ? entegrasyonBasligi(tool1.name, tool2.name)
    : `${tool1.name} vs ${tool2.name}: Which Is Better in 2026?`;
  const kisa = ent
    ? `${tool1.name} + ${tool2.name} integration`
    : `${tool1.name} vs ${tool2.name} (2026)`;
  const title =
    cekirdek.length <= 46 ? `${cekirdek} | ToolCompare`
    : cekirdek.length <= 65 ? cekirdek
    : kisa.length <= 65 ? kisa
    : `${tool1.name} vs ${tool2.name}`;
  /*
    ACIKLAMA SABLON DEGIL, O CIFTE OZGU (GSC, 2026-09-13).
    Once burada 1.320 sayfanin hepsi ayni cumleyi yayinliyordu. Olculdu:
    /compare 1.593 gosterim aliyor ve 4-25. sirada duran 350 gosterimde
    TEK tik yok -- siralama yeterince iyi oldugu halde sonuc tiklanmiyor.
    Kural src/lib/meta.ts'te: rakam yalnizca dogrulanmissa yazilir.
  */
  /* Elle yazilmis kisa cevap varsa aciklama odur: sablon fiyat notu
     ("Keycloak starts at Free; Firebase: Free tier") tiklanmiyordu. */
  const kisaCevapMeta = elleYazilmisKisaCevap(kanonikSlug(tool1.slug, tool2.slug));
  const description = ent
    ? `${ent.ozet} Checked against ${ent.kaynakSahibi}'s own documentation on ${ent.checkedAt}.`
    : kisaCevapMeta
      ? metaKisalt(kisaCevapMeta.ozet)
      : ciftMetaAciklamasi(tool1, tool2);

  // "a-vs-b" ve "b-vs-a" ayni sayfa. Kanonik olan alfabetik sirali olan;
  // aksi halde ayni icerik iki adreste indekslenir ve ikisi de zayiflar.
  const canonical = `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`;

  // Iki tarafi da incelenmemis cift indekslenmez; sayfa yine calisir.
  const indekslensin = ciftIndekslenebilirMi(tool1, tool2);

  return {
    title,
    description,
    robots: indekslensin ? undefined : { index: false, follow: true },
    alternates: { canonical },
    ...paylasimMeta({ url: canonical, title, description, type: "article" }),
  };
}

export default async function ComparisonPage({ params }: SayfaParametresi) {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const tool1 = (toolsData as Arac[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as Arac[]).find((t) => t.slug === parts[1]);
  const ent = entegrasyonKaydi(parts[0], parts[1]);

  if (!tool1 || !tool2) notFound();

  // Kisa cevap icin: hangi arac hangi olcutte onde? Sadece elimizdeki
  // sayilardan turetiliyor.
  const f1 = fiyatDurumu(tool1);
  const f2 = fiyatDurumu(tool2);
  const ucretli1 = ilkUcretliBasamak(tool1 as never);
  const ucretli2 = ilkUcretliBasamak(tool2 as never);
  const koltukSatirlari = [1, 5, 25]
    .map((seats) => ({
      seats,
      a: koltukMaliyeti(ucretli1, seats),
      b: koltukMaliyeti(ucretli2, seats),
    }))
    .filter((row) => row.a !== null || row.b !== null);
  const yillikFaturali = [ucretli1, ucretli2].some((plan) => plan?.faturalama === "yillik");
  const e1 = toolEvidence(tool1);
  const e2 = toolEvidence(tool2);
  // Fiyat kiyasi ancak IKI TARAF DA dogrulanmissa yapilir.
  const fiyatKiyaslanabilir = f1.karsilastirilabilir && f2.karsilastirilabilir;
  const ucuz = fiyatKiyaslanabilir ? ((f1.aylik as number) <= (f2.aylik as number) ? tool1 : tool2) : null;
  const pahali = ucuz ? (ucuz === tool1 ? tool2 : tool1) : null;
  const ucuzF = ucuz ? fiyatDurumu(ucuz) : null;
  const pahaliF = pahali ? fiyatDurumu(pahali) : null;

  /*
    Cifte ozgu ayrim cumlesi. Tabloda zaten duran Yes/No verisinden
    turetiliyor; sayfa metninin cift degistikce degismesini saglayan tek
    parca bu. Ayrim yoksa bos doner ve satir hic basilmaz.
  */
  const ayrim = ayrimCumlesi(tool1, tool2);
  // Elle yazilmis kisa cevap sablon satirlarin yerine gecer (bkz. lib/karsilastirma-notlari.ts).
  const kisaCevap = elleYazilmisKisaCevap(kanonikSlug(tool1.slug, tool2.slug));

  // Yalnizca akranlar: sitemap disi bir sayfaya link verilmemeli.
  // Yalnizca sitemap'te olan cifte link verilir (bkz. lib/tarama.ts):
  // sitemap disi sayfaya verilen link Googlebot'u oraya goturur ve
  // budamayi anlamsiz kilar.
  const ilgili = linklenebilirAkranlar(tool1, akranlar(tool1.slug)).filter((t: Arac) => t.slug !== tool2.slug);
  // Ikinci tarafin akranlari da linklenir (2026-09-15): firebase-vs-keycloak
  // sayfasi yalnizca Firebase akranlarina bakiyordu, o kume sitemap'te
  // yoksa sayfa sifir ic linkle kaliyordu. Ayni kapi, iki taraf.
  const ilgili2 = linklenebilirAkranlar(tool2, akranlar(tool2.slug)).filter((t: Arac) => t.slug !== tool1.slug);

  /*
    Karsilastirma satiri. Onceki surumde `type="score"` dali `{val1}%`
    yaziyordu -- yuzde isareti sabit metindi ve yalnizca uydurma kalite
    puanlari icin vardi. O puanlar sokuldugu icin dal da kaldirildi:
    kullanilmayan bir bicimlendirme, bir gun yanlis veriye yeniden
    baglanmayi bekleyen bir tuzaktir.
  */


  const sema = listeSemasi(
    `${tool1.name} vs ${tool2.name}`,
    `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`,
    [tool1, tool2]
  );

  /*
    SSS: bu sayfa turunde FAQPage semasi hic yoktu, oysa "X vs Y" tam
    olarak kullanicinin arama motoruna ve sohbet asistanina yazdigi
    cumle. Sorular dogrulanmis veriden turetiliyor (bkz. lib/sss.ts) ve
    asagida GORUNUR olarak da basiliyor -- semaya yalnizca sayfada
    gercekten duran soru konur.
  */
  /*
    Elle yazilmis sorular ONCE gelir: bunlar sayfanin GSC'de fiilen
    gosterim aldigi sorgunun ("woocommerce teachable integration" gibi)
    cevabi, turetilmis fiyat kiyasi degil.
  */
  const sorular = [
    ...elleYazilmisSorular(kanonikSlug(tool1.slug, tool2.slug)),
    ...karsilastirmaSss(tool1, tool2),
  ];

  // Kirinti semasi bu sayfa turunde de yoktu.
  const semalar = [
    sema,
    ...(sorular.length ? [sssSemasi(sorular)] : []),
    kirintiSemasi([
      { ad: tool1.name, yol: `/tools/${tool1.slug}` },
      { ad: `${tool1.name} vs ${tool2.name}`, yol: `/compare/${kanonikSlug(tool1.slug, tool2.slug)}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All tools
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          {/*
            Entegrasyon kaydi olan ciftte H1 SORUNUN KENDISI olur. Bu
            sayfalara gelen sorgu "hangisi daha iyi" degil ("typeform kajabi
            integration"); baslikta baska bir soru yazmak, dogru cevabi
            tasiyan sayfayi yanlis sayfa gibi gosteriyordu.
          */}
          {ent ? (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {entegrasyonBasligi(tool1.name, tool2.name)}
              </h1>
              <p className="mt-3 max-w-2xl text-ink-soft">{ent.ozet}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {tool1.name} <span className="text-ink-muted">vs</span> {tool2.name}
              </h1>
              <p className="mt-3 max-w-2xl text-ink-soft">
                A source-aware comparison of pricing, documented capabilities and workflow fit.
              </p>
            </>
          )}
        </header>

        {/*
          ENTEGRASYON CEVABI. Rakamin yaninda kaynagini gosterme kurali burada
          da gecerli: durum rozeti iddiayi, altindaki alinti o iddianin
          geldigi satici cumlesini tasir. Ziyaretci "kim demis" diye
          sorabilmeli -- bu sitenin tek varligi dogrulanabilirlik.
        */}
        {ent ? (
          <section
            id="integration"
            className="mt-8 scroll-mt-24 rounded-[--radius-card] border border-line bg-surface p-5"
            aria-labelledby="integration-baslik"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="integration-baslik" className="text-lg font-semibold">
                {entegrasyonBasligi(tool1.name, tool2.name)}
              </h2>
              <span
                className={`rounded-[--radius-pill] px-2 py-0.5 text-[11px] font-medium ${
                  ent.durum === "yerlesik"
                    ? "bg-verified-soft text-verified"
                    : "bg-unverified-soft text-unverified"
                }`}
              >
                {durumEtiketi(ent.durum)}
              </span>
            </div>
            <p className="mt-3 text-ink-soft">{ent.ozet}</p>
            <figure className="mt-4 border-l-2 border-line pl-4">
              <blockquote className="text-sm text-ink-soft">
                &ldquo;{ent.kaynakSatiri}&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-xs text-ink-muted">
                — {ent.kaynakSahibi}&rsquo;s own documentation, read on {ent.checkedAt}.{" "}
                <a href={ent.kaynakUrl} target="_blank" rel="nofollow noopener" className="underline">
                  Source
                </a>
              </figcaption>
            </figure>
          </section>
        ) : null}

        {/*
          Kisa cevap. Ziyaretci "hangisi?" diye geliyor; cevabi sayfanin
          basinda veriyoruz, tablonun altinda degil.
        */}
        {kisaCevap ? (
          <section className="mt-8 rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Short answer</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{kisaCevap.ozet}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[tool1, tool2].map((t: Arac) =>
                kisaCevap.sec[t.slug]?.length ? (
                  <div key={t.slug}>
                    <h3 className="text-sm font-semibold text-ink">{t.name} is the pick when</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                      {kisaCevap.sec[t.slug].map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
            <VisitButtons tools={[tool1, tool2]} />
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
              Written by hand from both vendors&rsquo; own documentation
              {kisaCevap.kontrolTarihi ? `, checked ${kisaCevap.kontrolTarihi}` : ""}.
              {kisaCevap.kaynaklar.length > 0 ? (
                <>
                  {" "}Sources:{" "}
                  {kisaCevap.kaynaklar.map((k, i) => (
                    <span key={k.url}>
                      {i > 0 ? ", " : ""}
                      <a href={k.url} target="_blank" rel="nofollow noopener" className="underline">
                        {k.etiket}
                      </a>
                    </span>
                  ))}
                  .
                </>
              ) : null}{" "}
              Prices below come from the pricing we track.{" "}
              <Link href="/methodology" className="text-accent underline underline-offset-4">
                How we score tools
              </Link>
              .
            </p>
          </section>
        ) : (
        <section className="mt-8 rounded-[--radius-card] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Short answer</h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
            <li>
              <strong className="font-medium text-ink">Price:</strong>{" "}
              {!fiyatKiyaslanabilir
                ? `not directly comparable — ${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`
                : f1.aylik === f2.aylik
                  ? `both start at ${f1.kisa}.`
                  : `${ucuz!.name} is cheaper — ${ucuzF!.kisa} vs ${pahaliF!.kisa}.`}
            </li>
            <li>
              <strong className="font-medium text-ink">How to start:</strong>{" "}
              {f1.metin.toLowerCase() === f2.metin.toLowerCase()
                ? `both are ${f1.metin.toLowerCase()}.`
                : `${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`}
            </li>
            {ayrim ? (
              <li>
                <strong className="font-medium text-ink">Where they differ:</strong> {ayrim}
              </li>
            ) : null}
          </ul>
          <VisitButtons tools={[tool1, tool2]} />
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
            These lines are generated from the pricing we track, not from a paid placement.{" "}
            <Link href="/methodology" className="text-accent underline underline-offset-4">
              How we score tools
            </Link>
            .
          </p>
        </section>
        )}

        {/*
          Elde duran longDescription hicbir karsilastirma sayfasinda
          gosterilmiyordu (460/512 aracta dolu, ortalama 45 kelime).
          Sayfa basina ~90 kelimelik, araca OZGU metin buydu; sablon
          tekrarini seyreltmenin en ucuz yolu onu basmak.
        */}
        {[tool1, tool2].some((t: Arac) => t.longDescription) && (
          <section className="mt-10 grid items-start gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: Arac) => t.longDescription)
              .map((t: Arac) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="flex items-center gap-2.5 text-base font-semibold">
                    <ToolLogo slug={t.slug} name={t.name} size={28} />
                    What {t.name} is
                  </h2>
                  {/* Anlatim tek blok yaziliyor; "Who it is for:" / "Where it falls short:" isaretlerinden paragrafa bolunuyor. */}
                  {String(t.longDescription)
                    .split(/\s(?=Who it is for:|Where it falls short:)/)
                    .map((parca, i) => (
                      <p key={i} className="mt-2 text-sm leading-relaxed text-ink-soft">{parca}</p>
                    ))}
                </div>
              ))}
          </section>
        )}

        {/* ---------- Karsilastirma tablosu ---------- */}
        <section className="mt-10">
          <h2 className="sr-only">Side by side</h2>
          {/* Dar ekranda tablo kendi icinde kayiyor; sayfa yatay kaymiyor. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <thead>
                <tr>
                  <td />
                  <th scope="col" className="pb-3 font-serif text-lg font-semibold">
                    {/*
                      Sitemap disi arac sayfasina link verilmez (olcum,
                      2026-09-12): indekslenebilir sayfalardan noindex
                      sayfalara 261 link gidiyordu. Ad duz metin kalir.
                    */}
                    {aracIndekslenir(tool1) && aracTaranmayaDeger(tool1) ? (
                      <Link href={`/tools/${tool1.slug}`} className="no-underline hover:text-accent">
                        {tool1.name}
                      </Link>
                    ) : (
                      tool1.name
                    )}
                  </th>
                  <th scope="col" className="pb-3 font-serif text-lg font-semibold">
                    {aracIndekslenir(tool2) && aracTaranmayaDeger(tool2) ? (
                      <Link href={`/tools/${tool2.slug}`} className="no-underline hover:text-accent">
                        {tool2.name}
                      </Link>
                    ) : (
                      tool2.name
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow label="Category" val1={tool1.category} val2={tool2.category} />
                <ComparisonRow
                  label="How to start"
                  val1={
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-medium">{f1.kisa}</span>
                      <span className={`rounded-[--radius-pill] px-1.5 py-0.5 text-[11px] ${f1.karsilastirilabilir ? "bg-verified-soft text-verified" : "bg-unverified-soft text-unverified"}`}>
                        {f1.karsilastirilabilir ? "verified" : "not a monthly price"}
                      </span>
                    </span>
                  }
                  val2={
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-medium">{f2.kisa}</span>
                      <span className={`rounded-[--radius-pill] px-1.5 py-0.5 text-[11px] ${f2.karsilastirilabilir ? "bg-verified-soft text-verified" : "bg-unverified-soft text-unverified"}`}>
                        {f2.karsilastirilabilir ? "verified" : "not a monthly price"}
                      </span>
                    </span>
                  }
                />
                {KRITER_SIRA.map((k) => {
                  const isaret = (t: Arac) => {
                    const v = t.kriterler?.[k];
                    if (v === true) return <span className="text-verified">Yes</span>;
                    if (v === false) return <span className="text-ink-muted">No</span>;
                    return <span className="text-unverified">not checked</span>;
                  };
                  return (
                    <ComparisonRow
                      key={k}
                      label={KRITER_ETIKET[k]}
                      val1={isaret(tool1)}
                      val2={isaret(tool2)}
                    />
                  );
                })}
                <ComparisonRow
                  label="Visit"
                  val1={
                    tool1.websiteUrl ? (
                      <a href={gitLinki(tool1.slug)} target="_blank" rel={relDegeri(tool1.slug)} className="text-accent underline underline-offset-4">
                        {tool1.name} ↗
                      </a>
                    ) : null
                  }
                  val2={
                    tool2.websiteUrl ? (
                      <a href={gitLinki(tool2.slug)} target="_blank" rel={relDegeri(tool2.slug)} className="text-accent underline underline-offset-4">
                        {tool2.name} ↗
                      </a>
                    ) : null
                  }
                />
              </tbody>
            </table>
          </div>
          <AffiliateNotu />
        </section>

        {/*
          keyFeatures 245 aracta dolu (baslik + bir cumle aciklama) ve
          yine hicbir yerde gosterilmiyordu. Tablo yalnizca dort olcute
          Yes/No diyor; aracin kendi one cikardigi is bunlarda.
        */}
        {[tool1, tool2].some((t: Arac) => t.keyFeatures?.length) && (
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: Arac) => t.keyFeatures?.length)
              .map((t: Arac) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="text-base font-semibold">What {t.name} is built to do</h2>
                  <dl className="mt-3 space-y-3 text-sm">
                    {(t.keyFeatures ?? []).map((f: OneCikanOzellik) => (
                      <div key={f.title}>
                        <dt className="font-medium text-ink">{f.title}</dt>
                        <dd className="mt-0.5 ml-0 text-ink-soft">{f.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
          </section>
        )}

        {/* ---------- Is akisina uygunluk ---------- */}
        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          {[tool1, tool2].map((t: Arac) => {
            const uygun: string[] = (t.bestFor?.length ? t.bestFor : [t.targetAudience])
              .filter((x): x is string => Boolean(x));
            if (!uygun.length) return null;
            return (
              <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                <h2 className="flex items-center gap-1.5 text-base font-semibold">
                  <CheckCircle2 size={16} className="text-verified" aria-hidden="true" />
                  Choose {t.name} if
                </h2>
                <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
                  {uygun.map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {t.skipIf?.length ? (
                  <>
                    <h3 className="mt-5 font-sans text-sm font-semibold text-ink-soft">
                      Skip {t.name} if
                    </h3>
                    <ul className="mt-2 list-none space-y-2 p-0 text-sm text-ink-muted">
                      {t.skipIf.map((item: string) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* ---------- Kanit ---------- */}
        <section className="mt-12 rounded-[--radius-card] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Evidence and freshness</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Where a claim on this page comes from a vendor page, it is linked here.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {([
              [tool1, e1],
              [tool2, e2],
            ] as const).map(([t, ev]) => (
              <div key={t.slug}>
                <h3 className="font-sans text-sm font-semibold">{t.name}</h3>
                {ev ? (
                  <>
                    <p className="mt-1 text-xs text-ink-muted">
                      {evidenceLabel(ev.status)} · reviewed {ev.reviewedAt}
                    </p>
                    <ul className="mt-2 list-none space-y-1.5 p-0 text-sm">
                      {ev.sources.map((source: Kaynak) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-accent underline underline-offset-4"
                          >
                            {source.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">
                    Sources have not been attached to this record yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Arti / eksi ---------- */}
        {[tool1, tool2].some((t: Arac) => (t.pros || []).length || (t.cons || []).length) && (
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: Arac) => (t.pros || []).length || (t.cons || []).length)
              .map((t: Arac) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="text-base font-semibold">{t.name}: pros &amp; cons</h2>
                  <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
                    {(t.pros || []).map((pro: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-verified" aria-hidden="true" />
                        <span>{pro}</span>
                      </li>
                    ))}
                    {(t.cons || []).map((con: string, i: number) => (
                      <li key={`c${i}`} className="flex gap-2">
                        <X size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}

        {/* ---------- Tam degerlendirme ---------- */}
        {[tool1, tool2].some((t: Arac) => t.verdict) ? (
          <section className="mt-12 space-y-6">
            {[tool1, tool2]
              .filter((t: Arac) => t.verdict)
              .map((t: Arac) => (
                <div key={t.slug} className="rounded-[--radius-card] border-l-2 border-accent bg-surface p-5">
                  <h2 className="text-base font-semibold">Our verdict on {t.name}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{t.verdict}</p>
                </div>
              ))}
          </section>
        ) : (
          <p className="mt-12 rounded-[--radius-card] border border-line bg-unverified-soft p-5 text-sm">
            <strong className="font-medium">Neither tool has a full review yet.</strong>{" "}
            <span className="text-ink-soft">
              This page compares what we can verify — pricing and documented capabilities.
            </span>
          </p>
        )}

        {/* ----------------------------------------------------------
            PLAN MERDIVENI

            NEDEN BURADA: bu sayfa turunun ilk-20'ye girme orani
            /tools'un 7 kati, ama 519 karsilastirmanin 413'u hic
            gosterim almiyor -- sayfalar birbirinin ayni oldugu icin.
            Merdiven her cifte FARKLI rakam koyar ve tek bir uydurma
            icermez: sayilar saticinin fiyat sayfasindan okunup kanit
            kaydina yazilmis cumlelerden geliyor, cumlenin kendisi de
            satirin altinda duruyor.

            Tek taraf merdivenliyse yine basilir: "obur taraf fiyat
            yayimlamiyor" bilgisi de okura lazim olan seydir.
        ---------------------------------------------------------- */}
        {[tool1, tool2].some((t) => merdiven(t as never).length > 0) && (
          <section className="mt-12 border-t border-line pt-10">
            <h2 className="text-lg font-semibold">Published plans, side by side</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Every figure below was read from the vendor&apos;s own pricing page and is shown with the
              sentence it came from. Where a vendor publishes no plan prices, we say so rather than guess.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {[tool1, tool2].map((t: Arac) => {
                const basamaklar = merdiven(t as never);
                return (
                  <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                    <h3 className="text-base font-semibold">{t.name}</h3>
                    {basamaklar.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-soft">
                        No published plan prices verified. {t.name} either quotes on request or renders its
                        prices in a way we could not read from the pricing page.
                      </p>
                    ) : (
                      <ol className="mt-3 list-none space-y-3 p-0">
                        {basamaklar.map((p) => (
                          <li key={`${p.ad}-${p.aylik}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                              <span className="text-sm font-medium text-ink">{p.ad}</span>
                              <span className="text-sm tabular-nums text-ink">{planEtiketi(p)}</span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{p.kaynakSatiri}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                    {basamaklar[0]?.kaynakUrl ? (
                      <a
                        href={basamaklar[0].kaynakUrl}
                        rel="nofollow noopener"
                        target="_blank"
                        className="mt-3 inline-flex text-xs text-ink-muted underline underline-offset-2 hover:text-accent"
                      >
                        {t.name} pricing page
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/*
          TAKIM BOYUTU MALIYETI (2026-10-24). Plan tablosu birim fiyati
          gosteriyor; "5 kisilik ekipte hangisi ucuz" sorusunun cevabi
          koltukla carpilmadan gorunmuyor. Yalnizca dogrulanmis EN UCUZ
          ucretli basamak kullanilir; sabit plan koltukla carpilmaz.
        */}
        {koltukSatirlari.length > 0 && (
          <section className="mt-12 border-t border-line pt-10">
            <h2 className="text-lg font-semibold">Cost at team size</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Each tool&apos;s cheapest paid plan, multiplied by seats. Flat plans do not scale with
              headcount; per-seat plans do. No plan means no row.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-4 text-xs font-semibold tracking-wide text-ink-muted uppercase">Team size</th>
                    <th scope="col" className="py-2 pr-4 text-xs font-semibold tracking-wide text-ink-muted uppercase">{tool1.name}</th>
                    <th scope="col" className="py-2 pr-4 text-xs font-semibold tracking-wide text-ink-muted uppercase">{tool2.name}</th>
                    <th scope="col" className="py-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {koltukSatirlari.map((row) => {
                    const diff = row.a !== null && row.b !== null ? Math.round((row.b - row.a) * 100) / 100 : null;
                    return (
                      <tr key={row.seats} className="border-b border-line/60">
                        <th scope="row" className="py-2.5 pr-4 font-medium">{row.seats} seats</th>
                        <td className="py-2.5 pr-4 tabular-nums">{row.a === null ? "—" : paraBicim.format(row.a)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{row.b === null ? "—" : paraBicim.format(row.b)}</td>
                        <td className="py-2.5 text-ink-soft tabular-nums">
                          {diff === null
                            ? "—"
                            : diff === 0
                              ? "Same"
                              : `${paraBicim.format(Math.abs(diff))} cheaper: ${diff < 0 ? tool2.name : tool1.name}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {yillikFaturali && (
              <p className="mt-2 text-xs text-ink-muted">
                Monthly equivalent for plans billed annually; the vendor charges the yearly amount up front.
              </p>
            )}
          </section>
        )}

        {/* ---------- SSS ---------- */}
        {sorular.length > 0 && (
          <section className="mt-12 border-t border-line pt-10">
            <h2 className="text-lg font-semibold">
              {tool1.name} vs {tool2.name}: common questions
            </h2>
            <dl className="mt-6 space-y-5">
              {sorular.map((q) => (
                <div key={q.soru}>
                  <dt className="text-sm font-medium text-ink">{q.soru}</dt>
                  <dd className="mt-1.5 text-sm text-ink-soft">
                    {q.cevap}
                    {q.kaynak ? (
                      <>
                        {" "}
                        <a
                          href={q.kaynak.url}
                          rel="nofollow noopener"
                          target="_blank"
                          className="whitespace-nowrap text-xs text-ink-muted underline underline-offset-2 hover:text-accent"
                        >
                          Source: {q.kaynak.etiket}
                        </a>
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* ---------- Ilgili karsilastirmalar ---------- */}
        {(ilgili.length > 0 || ilgili2.length > 0) && (
          <section className="mt-12 border-t border-line pt-10">
            {[
              { asil: tool1, digerleri: ilgili },
              { asil: tool2, digerleri: ilgili2 },
            ]
              .filter((g) => g.digerleri.length > 0)
              .map((g, i) => (
                <div key={g.asil.slug} className={i > 0 ? "mt-8" : ""}>
                  <h2 className="text-lg font-semibold">Other {g.asil.name} comparisons</h2>
                  <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                    {g.digerleri.map((t: Arac) => (
                      <li key={t.slug}>
                        <Link
                          href={`/compare/${kanonikSlug(g.asil.slug, t.slug)}`}
                          className="inline-flex rounded-[--radius-pill] border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:border-line-strong hover:text-ink"
                        >
                          {g.asil.name} vs {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}
          {/*
            Reklam sayfanin SONUNDA: okur once cevabi aliyor. Kapi
            `ciftReklamAlir` -- ince ya da noindex sayfa reklam almaz
            (AdSense politikasi), slot tanimli degilse hic cizilmez.
          */}
          {(() => {
            const yayinci = reklamYayinci();
            const slot = icerikSlotu();
            return ciftReklamAlir(tool1, tool2) && yayinci && slot ? (
              <ReklamBirimi yayinci={yayinci} slot={slot} />
            ) : null;
          })()}
      </main>

      <Footer />
    </>
  );
}
