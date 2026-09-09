import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json"
import type { Arac } from "@/lib/arac";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { kategoriler } from "@/lib/categories";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu } from "@/lib/fiyat";
import {
  Scale,
  Users,
  Briefcase,
  MessageSquare,
  Megaphone,
  Code,
  PenTool,
  ShoppingCart,
  Cloud,
  CheckCircle,
  Sparkles,
  Banknote,
  UserRound,
  Headphones,
  Boxes,
} from "lucide-react";

/*
  IKI GORSEL HATA DUZELTILDI (2026-08-31):

  1. KATEGORILERIN YARISI AYNI IKONU KULLANIYORDU. Harita "Ai Tools",
     "Crm", "Hr Software" gibi anahtarlarla eslesmiyordu (kaynak veride
     kategori adlari kucuk harfli ve baslik-yapma kisaltmalari bozuyordu),
     eslesmeyen her kategori varsayilan Globe'a dusuyordu: Design, AI
     Tools, CRM, Finance, HR ve Customer Service ekranda AYNI dunya
     ikonuyla duruyordu. Kisaltma duzeltmesi src/lib/categories.ts'te;
     burada da her kategorinin kendi ikonu var ve varsayilan yok.

  2. KARTLARDA BILGI YOKTU. "42 tools" disinda hicbir sey soylemiyorlardi,
     bu yuzden 15 kutu birbirinin ayni gorunuyordu. Artik her kart o
     kategorideki EN DUSUK DOGRULANMIS fiyati da gosteriyor -- sitenin
     tek gercek verisi ve secim yaparken bakilan sey.
*/
const KATEGORI_IKONU: Record<string, LucideIcon> = {
  "Developer Tools": Code,
  "Marketing": Megaphone,
  "Productivity": CheckCircle,
  "Hosting": Cloud,
  "Design": PenTool,
  "AI Tools": Sparkles,
  "Communication": MessageSquare,
  "Project Management": Briefcase,
  "E-commerce": ShoppingCart,
  "CRM": Users,
  "Finance Tools": Banknote,
  "HR Software": UserRound,
  "Customer Service": Headphones,
  "Legal Tools": Scale,
};

export const metadata = {
  alternates: { canonical: "/categories" },
  title: "Software Categories | ToolCompare",
  description: "Browse SaaS tools by category: CRM, AI, project management and more — each list ordered by verified starting price.",
};

export default function CategoriesPage() {
  const kategoriListesi = kategoriler();
  const sema = kirintiSemasi([{ ad: "Categories", yol: "/categories" }]);
  const toplam = (toolsData as Arac[]).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Software categories</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          {toplam} tools across {kategoriListesi.length} categories. Inside a category the list is
          ordered by what it costs to start — cheapest verified price first.
        </p>

        <ul className="mt-10 grid list-none grid-cols-1 gap-px overflow-hidden rounded-[--radius-card] border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3">
          {kategoriListesi.map((kat) => {
            const Ikon = KATEGORI_IKONU[kat.ad] ?? Boxes;
            const adet = kat.araclar.length;

            /*
              "En ucuz dogrulanmis fiyat" once tek basina gosteriliyordu ve
              14 kartin 12'sinde ayni sey yaziyordu: "Free". Kategoriler
              yine birbirinden ayrisamiyordu. Ayrim ucretsizde degil,
              PARA ISTEYEN tarafin tabaninda: kac arac bedava baslar ve
              ucretli taraf kacdan acilir.
            */
            const olculebilir = kat.araclar
              .map((t) => fiyatDurumu(t))
              .filter((d) => d.karsilastirilabilir && d.aylik !== null);
            const bedavaSayisi = olculebilir.filter((d) => d.aylik === 0).length;
            const enDusukUcretli = olculebilir
              .filter((d) => (d.aylik as number) > 0)
              .sort((a, b) => (a.aylik as number) - (b.aylik as number))[0];

            return (
              <li key={kat.slug}>
                <Link
                  href={`/categories/${kat.slug}`}
                  className="group flex h-full flex-col justify-between gap-6 bg-surface p-5 no-underline transition-colors duration-150 hover:bg-surface-soft"
                >
                  <span className="flex items-start gap-3">
                    <Ikon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" />
                    <span className="min-w-0">
                      <span className="block font-serif text-base font-semibold text-ink">{kat.ad}</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        {adet} {adet === 1 ? "tool" : "tools"}
                      </span>
                    </span>
                  </span>

                  <span className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                    <span className="text-xs text-ink-muted">
                      {bedavaSayisi > 0 ? `${bedavaSayisi} free to start` : "None free to start"}
                    </span>
                    <span className="shrink-0 text-right">
                      {enDusukUcretli ? (
                        <>
                          <span className="text-xs text-ink-muted">paid from </span>
                          <span className="font-serif text-sm font-semibold text-ink tabular-nums">
                            {enDusukUcretli.kisa}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-ink-muted">no verified paid price</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      <Footer />
    </>
  );
}
