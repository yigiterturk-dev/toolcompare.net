import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import { gitLinki } from "@/lib/outbound";
import { kanonikSlug, akranlar, karsilastirmaCiftleri, ciftIndekslenebilirMi } from "@/lib/compare";
import { listeSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu } from "@/lib/fiyat";
import { evidenceLabel, toolEvidence } from "@/lib/evidence";
import { KRITER_SIRA, KRITER_ETIKET } from "@/lib/kriterler";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X, Zap, Star, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";

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
export function generateStaticParams() {
  return karsilastirmaCiftleri().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) return { title: "Comparison" };
  
  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);
  
  if (!tool1 || !tool2) return { title: "Comparison" };

  // Baslik 65 karakteri asarsa arama sonucunda kesilir; marka adi
  // uzun ciftlerde dusuruluyor ki asil ifade ("X vs Y") gorunur kalsin.
  // Uc kademeli kisaltma: cok uzun isimlerde CEKIRDEK basligin kendisi de
  // 65'i asiyordu (ornek: "ActiveCampaign vs Ahrefs Webmaster Tools").
  const cekirdek = `${tool1.name} vs ${tool2.name}: Which Is Better in 2026?`;
  const kisa = `${tool1.name} vs ${tool2.name} (2026)`;
  const title =
    cekirdek.length <= 46 ? `${cekirdek} | ToolCompare`
    : cekirdek.length <= 65 ? cekirdek
    : kisa.length <= 65 ? kisa
    : `${tool1.name} vs ${tool2.name}`;
  const description = `Compare ${tool1.name} and ${tool2.name} side-by-side: verified pricing, documented features, trade-offs, source dates and who each one fits.`;

  // "a-vs-b" ve "b-vs-a" ayni sayfa. Kanonik olan alfabetik sirali olan;
  // aksi halde ayni icerik iki adreste indekslenir ve ikisi de zayiflar.
  const canonical = `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`;

  // Iki tarafi da incelenmemis cift indekslenmez; sayfa yine calisir.
  const indekslensin = ciftIndekslenebilirMi(tool1 as any, tool2 as any);

  return {
    title,
    description,
    robots: indekslensin ? undefined : { index: false, follow: true },
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparisonPage({ params }: any) {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);

  if (!tool1 || !tool2) notFound();

  // Kisa cevap icin: hangi arac hangi olcutte onde? Sadece elimizdeki
  // sayilardan turetiliyor.
  const f1 = fiyatDurumu(tool1);
  const f2 = fiyatDurumu(tool2);
  const e1 = toolEvidence(tool1);
  const e2 = toolEvidence(tool2);
  // Fiyat kiyasi ancak IKI TARAF DA dogrulanmissa yapilir.
  const fiyatKiyaslanabilir = f1.karsilastirilabilir && f2.karsilastirilabilir;
  const ucuz = fiyatKiyaslanabilir ? ((f1.aylik as number) <= (f2.aylik as number) ? tool1 : tool2) : null;
  const pahali = ucuz ? (ucuz === tool1 ? tool2 : tool1) : null;
  const ucuzF = ucuz ? fiyatDurumu(ucuz) : null;
  const pahaliF = pahali ? fiyatDurumu(pahali) : null;

  // Yalnizca akranlar: sitemap disi bir sayfaya link verilmemeli.
  const ilgili = akranlar(tool1.slug).filter((t: any) => t.slug !== tool2.slug);

  const ComparisonRow = ({ label, val1, val2, type = "text" }: any) => (
    <div className="compare-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0', alignItems: 'center' }}>
      <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>
        {type === "score" ? <span style={{ color: 'white' }}>{val1}%</span> : val1}
      </div>
      <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>
        {type === "score" ? <span style={{ color: 'white' }}>{val2}%</span> : val2}
      </div>
    </div>
  );

  const sema = listeSemasi(
    `${tool1.name} vs ${tool2.name}`,
    `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`,
    [tool1, tool2]
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />
      
      <main style={{ paddingTop: '12rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%', paddingBottom: '10rem' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#666', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
            {tool1.name} <span style={{ color: 'var(--brand-primary)' }}>vs</span> {tool2.name}
          </h1>
          <p style={{ color: '#888', fontSize: '1.25rem' }}>A source-aware comparison of pricing, documented capabilities and workflow fit.</p>
        </div>

        {/* Kisa cevap. Ziyaretci "hangisi?" diye geliyor; cevabi sayfanin
            dibinde degil basinda gormeli. Butun ifadeler ELDEKI VERIDEN
            turetiliyor -- uydurma bir ustunluk iddiasi yok, ve verinin
            karar veremedigi yerde bunu acikca soyluyoruz. */}
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '28px', padding: '2.5rem', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Short answer</h2>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.9, paddingLeft: '1.2rem', margin: 0 }}>
            <li>
              <strong style={{ color: 'white' }}>Price:</strong>{' '}
              {!fiyatKiyaslanabilir
                ? `not directly comparable — ${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`
                : (f1.aylik === f2.aylik
                    ? `both start at ${f1.kisa}.`
                    : `${ucuz!.name} is cheaper — ${ucuzF!.kisa} vs ${pahaliF!.kisa}.`)}
            </li>
            <li>
              <strong style={{ color: 'white' }}>How to start:</strong>{' '}
              {f1.metin.toLowerCase() === f2.metin.toLowerCase()
                ? `both are ${f1.metin.toLowerCase()}.`
                : `${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`}
            </li>
          </ul>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: 0 }}>
            These lines are generated from the pricing we track, not from a paid placement. We do not publish a quality score, because we do not have one we can stand behind. They cannot tell you which tool fits <em>your</em> workflow — the sections below are there for that.{' '}
            <Link href="/methodology" style={{ color: 'var(--brand-primary)' }}>How we score tools</Link>.
          </p>
        </div>

        {/* Head-to-Head Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
          <div></div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `linear-gradient(135deg, ${tool1.color1}, ${tool1.color2})`, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 20px 40px ${tool1.color1}44` }}>
              <Zap size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{tool1.name}</h2>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `linear-gradient(135deg, ${tool2.color1}, ${tool2.color2})`, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 20px 40px ${tool2.color1}44` }}>
              <Zap size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{tool2.name}</h2>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px', padding: '4rem' }}>
          <ComparisonRow label="Category" val1={tool1.category} val2={tool2.category} />
          <ComparisonRow label="Base Price" val1={f1.kisa} val2={f2.kisa} />

          {/* Objektif ozellikler. Uydurma kalite puanlarinin yerine konan
              sey: her satir nesnel olarak dogru ya da yanlis olabilir.
              UCUNCU DURUM VAR -- bakilmadiysa "not checked" yazar; onu
              "yok" diye gostermek uydurma puanlarin hatasinin tekrari
              olurdu. */}
          {KRITER_SIRA.map((k) => {
            const isaret = (t: any) => {
              const v = t.kriterler?.[k];
              if (v === true) return <span style={{ color: 'var(--success)', fontWeight: 800 }}>Yes</span>;
              if (v === false) return <span style={{ color: '#ef4444' }}>No</span>;
              return <span style={{ color: '#666', fontSize: '0.85rem' }}>not checked</span>;
            };
            return <ComparisonRow key={k} label={KRITER_ETIKET[k]} val1={isaret(tool1)} val2={isaret(tool2)} />;
          })}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3rem 0 0' }}>
            <div></div>
            <div style={{ textAlign: 'center' }}>
              <a 
                href={gitLinki(tool1.slug)} 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                style={{ background: 'var(--brand-primary)', color: 'white', padding: '1rem 2rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'inline-block' }}
              >
                Visit {tool1.name}
              </a>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a 
                href={gitLinki(tool2.slug)} 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                style={{ background: 'white', color: 'black', padding: '1rem 2rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'inline-block' }}
              >
                Visit {tool2.name}
              </a>
            </div>
          </div>
        </div>

        {/* Workflow fit. These are bounded use cases, not an overall winner. */}
        <div className="compare-two-column" style={{ marginTop: '6rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
           <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle2 color="var(--success)" /> Choose {tool1.name} if:</h3>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
                {(tool1.bestFor?.length ? tool1.bestFor : [tool1.targetAudience]).filter(Boolean).map((item: string) => <li key={item}>{item}</li>)}
              </ul>
           </div>
           <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle2 color="var(--success)" /> Choose {tool2.name} if:</h3>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
                {(tool2.bestFor?.length ? tool2.bestFor : [tool2.targetAudience]).filter(Boolean).map((item: string) => <li key={item}>{item}</li>)}
              </ul>
           </div>
        </div>

        {(tool1.skipIf?.length || tool2.skipIf?.length) && (
          <div className="compare-two-column" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {[tool1, tool2].map((tool: any) => (
              <div key={tool.slug} style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Skip {tool.name} if:</h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
                  {(tool.skipIf || []).map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(e1 || e2) && (
          <section className="compare-evidence" style={{ marginTop: '3rem', padding: '2.5rem', borderRadius: '28px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.7rem' }}>Evidence and freshness</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 0 }}>
              Vendor documentation supports plan and feature claims. It does not establish an overall quality winner.
            </p>
            <div className="compare-two-column" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginTop: '1.5rem' }}>
              {[[tool1, e1], [tool2, e2]].map(([tool, evidence]: any) => (
                <div key={tool.slug}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{tool.name}</h3>
                  {evidence ? <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{evidenceLabel(evidence.status)} · reviewed {evidence.reviewedAt}</p>
                    <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                      {evidence.sources.map((source: any) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'var(--brand-primary)' }}>{source.label}</a> <span style={{ color: '#666' }}>({source.checkedAt})</span></li>)}
                    </ul>
                  </> : <p style={{ color: '#888' }}>Sources have not been attached to this record yet.</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {!tool1.verdict && !tool2.verdict && (
          <div style={{ marginTop: '3rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '20px', padding: '1.8rem' }}>
            <strong style={{ color: 'white' }}>Neither tool has a full review yet.</strong>
            <p style={{ color: 'var(--text-secondary)', margin: '0.6rem 0 0', lineHeight: 1.7 }}>
              Both are in our directory, so this page compares what we can state factually — what each one is
              and what it costs to start. We have not written pros, cons or a verdict for either, and we are
              not going to invent them to fill the page.
            </p>
          </div>
        )}

        {/* Arti / eksi. Onceki halde bu veri tools.json'da duruyordu ama
            karsilastirma sayfasinda hic gosterilmiyordu -- sayfayi ince
            birakan asil eksik buydu. */}
        <div className="compare-two-column" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {[tool1, tool2].filter((t: any) => (t.pros || []).length || (t.cons || []).length).map((t: any) => (
            <div key={t.slug} style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{t.name}: pros &amp; cons</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                {(t.pros || []).map((p: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} /> {p}
                  </li>
                ))}
              </ul>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(t.cons || []).map((c: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <X size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.2rem' }} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tam degerlendirme. Tabloda ortasindan kesilip "..." ile
            biten metin hem kullaniciya hem arama motoruna degersizdi. */}
        <div className="compare-two-column" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {[tool1, tool2].filter((t: any) => t.verdict).map((t: any) => (
            <div key={t.slug} style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>Our verdict on {t.name}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.verdict}</p>
            </div>
          ))}
        </div>

        {/* Ilgili karsilastirmalar: bu sayfalar aksi halde oksuz kalir --
            sitemap'te olup siteden hic link almamak Google'a "onemsiz"
            sinyali verir. */}
        {ilgili.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Other {tool1.name} comparisons</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              {ilgili.map((t: any) => (
                <Link
                  key={t.slug}
                  href={`/compare/${kanonikSlug(tool1.slug, t.slug)}`}
                  style={{ padding: '0.8rem 1.4rem', borderRadius: '14px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  {tool1.name} vs {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
