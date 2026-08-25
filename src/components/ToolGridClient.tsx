"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";
import AIWizard from "@/components/AIWizard";
import ToolCard from "@/components/ToolCard";
import { oneCikanCiftler } from "@/lib/compare";

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

const KATEGORILER = [
  "CRM",
  "Marketing",
  "Project Management",
  "Design",
  "Communication",
  "Developer Tools",
  "E-commerce",
];

function ToolGrid({ initialTools }: { initialTools: any[] }) {
  const router = useRouter();

  // useSearchParams() statik uretimde BAILOUT_TO_CLIENT_SIDE_RENDERING'e yol
  // aciyordu: sunucudan gelen HTML yalnizca "Loading..." oluyor, ne H1 ne de
  // tek bir link iceriyordu. Ayni bilgiyi hidrasyondan sonra okumak sayfayi
  // sunucuda render edilebilir birakiyor; ilk render filtresiz liste gosterir.
  const [catFilter, setCatFilter] = useState<string | null>(null);
  useEffect(() => {
    setCatFilter(new URLSearchParams(window.location.search).get("category"));
  }, []);

  // Veri artik sunucudan prop ile geliyor; tarayicidan fetch edilince urun
  // linkleri HTML'e hic girmiyordu (urun sayfalari orphan kaliyordu).
  const [tools] = useState<any[]>(initialTools);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const pageSize = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, catFilter]);

  const filteredTools = useMemo(() => {
    return tools
      .filter((t: any) => !catFilter || t.category === catFilter)
      .filter((t: any) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tools, catFilter, searchTerm]);

  const handleCompareChange = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName],
    );
  };

  const sayfaSayisi = Math.max(1, Math.ceil(filteredTools.length / pageSize));
  const gorunen = filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <a href="#tools" className="skip-link">
        Skip to tools
      </a>
      <Header />

      <main id="main" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {/* ---------- Hero ---------- */}
        <section className="border-b border-line py-12 sm:py-16">
          <p className="text-sm font-medium text-accent">
            {filteredTools.length} tools · sources listed on every review
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold sm:text-5xl">
            {catFilter ? `The best ${catFilter} tools` : "Software pricing you can check yourself"}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-soft sm:text-lg">
            Every price says whether it is verified, usage-based or a free tier — and we publish
            no invented quality scores. Where a number comes from a vendor page, we link it.
          </p>

          <div className="relative mt-8 max-w-xl">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-muted"
            />
            <label htmlFor="tool-search" className="sr-only">
              Search tools by name
            </label>
            <input
              id="tool-search"
              type="search"
              placeholder="Search by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[--radius-control] border border-line bg-surface py-3 pr-4 pl-11 text-base text-ink placeholder:text-ink-muted focus:border-line-strong focus:outline-none"
            />
          </div>

          <nav aria-label="Categories" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {KATEGORILER.map((ad) => {
                const aktif = catFilter === ad;
                return (
                  <li key={ad}>
                    <Link
                      href={`/categories/${ad.toLowerCase().replace(/\s+/g, "-")}`}
                      data-tap
                      aria-current={aktif ? "page" : undefined}
                      className={`inline-flex items-center rounded-[--radius-pill] border px-3 py-1.5 text-sm no-underline transition-colors duration-150 ${
                        aktif
                          ? "border-brand bg-brand text-brand-ink"
                          : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {ad}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-ink-muted">Popular comparisons</span>
            {oneCikanCiftler().map((vs) => (
              <Link
                key={vs.slug}
                href={`/compare/${vs.slug}`}
                className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
              >
                {vs.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- Araclar ---------- */}
        <section id="tools" aria-label="Tools" className="py-10">
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
              {gorunen.map((tool: any) => (
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

        {/*
          Sihirbaz artik burada: ne aradigini bilen once araci gorur, ne
          aradigini bilmeyen asagida yardimi bulur. Eskiden tam tersiydi.
        */}
        <section aria-label="Help me choose" className="border-t border-line py-12">
          <AIWizard tools={tools} />
        </section>
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
                    .filter((t: any) => selectedTools.includes(t.name))
                    .map((t: any) => t.slug);
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

export default function ToolGridClient({ initialTools }: { initialTools: any[] }) {
  return <ToolGrid initialTools={initialTools} />;
}
