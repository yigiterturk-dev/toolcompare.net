import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { kategoriler } from "@/lib/categories";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import { 
  Scale, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Zap, 
  Code, 
  Layout, 
  Shield, 
  Database, 
  Cloud,
  CheckCircle,
  ArrowRight,
  Globe
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  "Legal Tools": Scale,
  "CRM": Users,
  "Project Management": Briefcase,
  "Communication": MessageSquare,
  "Marketing": Zap,
  "Developer Tools": Code,
  "Design": Layout,
  "E-commerce": Shield,
  "Productivity": CheckCircle,
  "Customer Service": Globe,
  "Hosting": Cloud,
};

export const metadata = {
  title: "Software Categories | ToolCompare",
  description: "Browse SaaS tools by category: CRM, AI, Project Management, and more.",
};

export default function CategoriesPage() {
  // Kategori adlari veride tutarsiz yazilmis; normallestirme src/lib/categories.ts'te.
  const kategoriListesi = kategoriler();

  const sema = kirintiSemasi([{ ad: "Categories", yol: "/categories" }]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">Software categories</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Every category we track, with the number of tools reviewed in each. Inside a category the
          list is ordered by what it costs to start.
        </p>

        <ul className="mt-8 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {kategoriListesi.map((kat) => {
            const IconComponent = categoryIcons[kat.ad] || Globe;
            const count = kat.araclar.length;
            return (
              <li key={kat.slug}>
                <Link
                  href={`/categories/${kat.slug}`}
                  className="flex h-full items-start gap-3 rounded-[--radius-card] border border-line bg-surface p-4 no-underline transition-colors duration-150 hover:border-line-strong"
                >
                  <IconComponent
                    size={20}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-ink-muted"
                  />
                  <span className="min-w-0">
                    <span className="block font-serif text-base font-semibold">{kat.ad}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {count} {count === 1 ? "tool" : "tools"}
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
