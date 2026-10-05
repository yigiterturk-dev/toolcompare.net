"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Search, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";
import AIWizard from "@/components/AIWizard";
import ToolCard from "@/components/ToolCard";
import ToolRow from "@/components/ToolRow";
import { fiyatDurumu, type FiyatModeli } from "@/lib/fiyat";
import { oneCikanCiftler } from "@/lib/compare";
import type { Plan } from "@/lib/plan";

/*
  Anasayfa izgarasi.

  Gorsel yon ui-ux-pro-max ciktisindan: acik/editoryal, tek vurgu rengi,
  "Data-Dense Dashboard" yogunlugu. Skill'in acikca kacinilmasini soyledigi
  iki sey vardi -- asiri animasyon ve varsayilan koyu tema -- ve sayfa
  ikisini de yapiyordu (kartlar hover'da 10px zipliyor ve buyuyordu,
  arka planda iki animasyonlu isik lekesi donuyordu).

  Kaldirilan sey sadece dekorasyon degildi:

  - IKI AYRI KATEGORI SECICI arka arkaya duruyordu. Ustte 7 cipli bir
    satir, hemen altinda "STEP 1 OF 3" baslikli 13 butonluk bir kutu --
    listeler bile ayniydi degildi. Mobilde bu kutu tek basina ~1500px yer
    kapliyor ve ziyaretci tek bir arac gormeden once 13 dev butonu
    kaydirmak zorunda kaliyordu. Sihirbaz artik izgaranin ALTINDA:
    once urun, sonra "ne aradigini bilmiyorsan" yardimi.

  - Hero'daki mor gradient baslik. Rakiplerin cogu ayni koyu-neon AI
    gorunumunde; ayrisma orada degil, iddiada. Baslik artik iddiayi
    soyluyor.
*/

/*
  Izgaranin gordugu kayit. src/app/page.tsx kayitlari IZGARA_ALANLARI'na
  gore kirpiyor; bu tip o sozlesmenin karsiligi. `any` yerine bunu
  kullanmak, alan kirpilinca derleyicinin uyarmasini sagliyor.
*/
export type IzgaraArac = {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: FiyatModeli;
  features?: unknown[];
  keyFeatures?: unknown[];
  /** Yalnizca en ucuz ucretli basamak; fiyatDurumu() bunu okuyor. */
  planlar?: Plan[];
};

const KATEGORILER = [
  "CRM",
  "Marketing",
  "Project Management",
  "Design",
  "Communication",
  "Developer Tools",
  "E-commerce",
];

function ToolGrid({ initialTools, dizin, sss }: { initialTools: IzgaraArac[]; dizin?: React.ReactNode; sss?: React.ReactNode }) {
  const router = useRouter();

  // useSearchParams() statik uretimde BAILOUT_TO_CLIENT_SIDE_RENDERING'e yol
  // aciyordu: sunucudan gelen HTML yalnizca "Loading..." oluyor, ne H1 ne de
  // tek bir link iceriyordu. Ayni bilgiyi hidrasyondan sonra okumak sayfayi
  // sunucuda render edilebilir birakiyor; ilk render filtresiz liste gosterir.
  const [catFilter, setCatFilter] = useState<string | null>(null);
  /*
    Kural burada bilerek susturuldu. Alternatifi useSearchParams() ve o,
    yukaridaki notta yazdigi gibi statik uretimi bozup sunucudan gelen
    HTML'i "Loading..."e dusuruyordu -- yani butun urun linklerini
    kaybediyorduk. Bir kerelik, mount sonrasi okuma bilincli tercih.
  */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatFilter(new URLSearchParams(window.location.search).get("category"));
  }, []);

  // Veri artik sunucudan prop ile geliyor; tarayicidan fetch edilince urun
  // linkleri HTML'e hic girmiyordu (urun sayfalari orphan kaliyordu).
  const [tools] = useState<IzgaraArac[]>(initialTools);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const pageSize = 12;

  /*
    Once bu bir efektti ve `setCurrentPage(1)` cagiriyordu: filtre her
    degistiginde fazladan bir render turu. React'in onerdigi yol, turetilen
    durumu RENDER SIRASINDA duzeltmek -- efekt hic kosmadan sayfa sifirlanir.
  */
  const [oncekiFiltre, setOncekiFiltre] = useState(`${searchTerm}|${catFilter}`);
  const suankiFiltre = `${searchTerm}|${catFilter}`;
  if (oncekiFiltre !== suankiFiltre) {
    setOncekiFiltre(suankiFiltre);
    setCurrentPage(1);
  }

  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => !catFilter || t.category === catFilter)
      .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tools, catFilter, searchTerm]);

  const handleCompareChange = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName],
    );
  };

  /*
    Kuratorlu bolumler. Hepsi VERIDEN uretiliyor -- elle secilmis liste yok,
    "one cikan" diye para karsiligi bir sey yok. Basliklar da tam olarak
    filtrenin ne yaptigini soyluyor.
  */
  const bolumler = useMemo(() => {
    const durum = (t: IzgaraArac) => fiyatDurumu(t);
    const enUcuz = tools
      .filter((t) => { const d = durum(t); return d.karsilastirilabilir && (d.aylik ?? 0) > 0; })
      .sort((a, b) => (durum(a).aylik ?? 0) - (durum(b).aylik ?? 0))
      .slice(0, 12);
    const bedava = tools
      .filter((t) => { const k = durum(t).kisa; return k === "Free" || k === "Free tier"; })
      .slice(0, 12);
    const kullanim = tools
      .filter((t) => { const k = durum(t).kisa; return k === "Usage-based" || k === "Quote only" || k === "Variable"; })
      .slice(0, 12);
    return [
      { anahtar: "ucuz", baslik: "Cheapest verified starts", alt: "Lowest monthly price we could verify on a vendor page.", liste: enUcuz },
      { anahtar: "bedava", baslik: "Free to start", alt: "A free plan or a free tier — not a trial we guessed at.", liste: bedava },
      { anahtar: "kullanim", baslik: "Not a monthly price", alt: "Usage-based, quote-only or variable. We do not pretend these are $0.", liste: kullanim },
    ].filter((b) => b.liste.length > 0);
  }, [tools]);

  const sayfaSayisi = Math.max(1, Math.ceil(filteredTools.length / pageSize));
  const gorunen = filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <a href="#tools" className="skip-link">
        Skip to tools
      </a>
      <Header />

      <main id="main" className="pb-20">
        {/* ---------- Decision engine hero ---------- */}
        <section className="relative overflow-hidden bg-[#101b2d] text-white">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Verified pricing, clearer decisions
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
                Choose software with confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Compare {tools.length} tools by what they actually cost to start. Find the right fit,
                understand the trade-offs, and make your shortlist in minutes.
              </p>

              <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
                  />
                  <label htmlFor="tool-search" className="sr-only">Search tools by name</label>
                  <input
                    id="tool-search"
                    type="search"
                    placeholder="What software are you looking for?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-14 w-full rounded-[--radius-control] border border-white/20 bg-white px-4 pl-12 text-base text-ink shadow-xl placeholder:text-ink-muted focus:border-white focus:outline-none"
                  />
                </div>
                <Link
                  href="/compare"
                  data-tap
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-[--radius-control] bg-accent px-6 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#0852c2]"
                >
                  Compare tools <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <nav aria-label="Popular categories" className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs text-blue-200">Popular:</span>
                {KATEGORILER.map((ad) => (
                  <Link
                    key={ad}
                    href={`/categories/${ad.toLowerCase().replace(/\s+/g, "-")}`}
                    data-tap
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-blue-50 no-underline transition-colors hover:border-white/40 hover:bg-white/10"
                  >
                    {ad}
                  </Link>
                ))}
              </nav>
              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-blue-100">
                <span className="text-xs text-blue-200">Popular comparisons</span>
                {oneCikanCiftler().map((vs) => (
                  <Link
                    key={vs.slug}
                    href={`/compare/${vs.slug}`}
                    className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
                  >
                    {vs.label}
                  </Link>
                ))}
              </p>
            </div>

            <div className="mt-12 grid max-w-3xl grid-cols-1 gap-3 border-t border-white/15 pt-5 text-sm text-blue-100 sm:grid-cols-3">
              <div className="flex items-center gap-2"><Check className="size-4 text-[#8dbbff]" aria-hidden="true" /> No invented scores</div>
              <div className="flex items-center gap-2"><Check className="size-4 text-[#8dbbff]" aria-hidden="true" /> Prices checked by humans</div>
              <div className="flex items-center gap-2"><Check className="size-4 text-[#8dbbff]" aria-hidden="true" /> {tools.length} tools to explore</div>
            </div>
          </div>
        </section>

        {/* ---------- Karar yardımcısı ---------- */}
        <section aria-label="Help me choose" className="mx-auto max-w-7xl border-b border-line px-4 py-12 sm:px-6">
          <AIWizard tools={tools} />
        </section>

        {/* ---------- Kuratorlu bolumler ---------- */}
        {!searchTerm && !catFilter && (
          <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6">
            {bolumler.map((b) => (
              <section key={b.anahtar} aria-labelledby={`bolum-${b.anahtar}`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id={`bolum-${b.anahtar}`} className="text-xl font-semibold">{b.baslik}</h2>
                    <p className="mt-1 text-sm text-ink-muted">{b.alt}</p>
                  </div>
                  <Link href={b.anahtar === "ucuz" ? "/top-picks" : "/tools"} className="text-sm font-medium text-accent no-underline hover:underline">See all <span aria-hidden="true">→</span></Link>
                </div>
                <ul className="mt-3 flex list-none gap-2 overflow-x-auto p-0 pb-2 [scrollbar-width:thin]">
                  {b.liste.map((t) => (
                    <li key={t.slug}>
                      <ToolRow tool={t} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* ---------- Araclar ---------- */}
        <section id="tools" aria-label="Tools" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {loading ? (
            <div className="flex items-center gap-3 py-16 text-ink-muted">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <p>Loading tools…</p>
            </div>
          ) : gorunen.length === 0 ? (
            /*
              Bos durum eskiden yoktu: arama hicbir sey bulmayinca ekran
              sessizce bosaliyordu. Ne oldugunu ve ne yapilacagini soyluyor.
            */
            <div className="rounded-[--radius-card] border border-line bg-surface p-10 text-center">
              <p className="font-serif text-lg font-semibold">No tool matches “{searchTerm}”.</p>
              <p className="mt-2 text-sm text-ink-soft">
                Try a shorter name, or clear the filters to see all {tools.length} tools.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCatFilter(null);
                }}
                data-tap
                className="mt-5 inline-flex rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity duration-150 hover:opacity-90"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {gorunen.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard
                    tool={tool}
                    selected={selectedTools.includes(tool.name)}
                    onToggleCompare={handleCompareChange}
                  />
                </li>
              ))}
            </ul>
          )}

          {sayfaSayisi > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                data-tap
                className="rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm transition-colors duration-150 hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <p className="px-2 text-sm text-ink-muted" aria-live="polite">
                Page {currentPage} of {sayfaSayisi}
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(sayfaSayisi, p + 1))}
                disabled={currentPage === sayfaSayisi}
                data-tap
                className="rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm transition-colors duration-150 hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </section>

        {/* Tam dizin ve SSS: footer'dan ONCE. */}
        {dizin}
        {sss}
      </main>

      {/* ---------- Karsilastirma seridi ---------- */}
      {selectedTools.length > 0 && (
        <div
          role="region"
          aria-label="Comparison tray"
          className="sticky bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm">
              <strong>{selectedTools.length}</strong> selected
              <span className="text-ink-muted"> · {selectedTools.join(", ")}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTools([])}
                data-tap
                className="rounded-[--radius-control] border border-line px-3 py-2 text-sm transition-colors duration-150 hover:border-line-strong"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={selectedTools.length < 2}
                onClick={() => {
                  const slugs = tools
                    .filter((t) => selectedTools.includes(t.name))
                    .map((t) => t.slug);
                  if (slugs.length >= 2) router.push(`/compare/${slugs[0]}-vs-${slugs[1]}`);
                }}
                data-tap
                className="rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedTools.length < 2 ? "Pick one more" : "Compare"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIAssistant tools={tools} />
      <Footer />
    </>
  );
}

export default function ToolGridClient({
  initialTools,
  dizin,
  sss,
}: {
  initialTools: IzgaraArac[];
  dizin?: React.ReactNode;
  sss?: React.ReactNode;
}) {
  return <ToolGrid initialTools={initialTools} dizin={dizin} sss={sss} />;
}
