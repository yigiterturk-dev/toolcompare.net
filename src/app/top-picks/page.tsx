import Header from "@/components/Header";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { Award, Star, ArrowRight } from "lucide-react";
import { listeSemasi } from "@/lib/yapilandirilmis";

export const metadata = {
  title: "The Cheapest Tools We Track (2026) | ToolCompare",
  description: "The lowest starting prices across our whole directory. Price is not quality — this is a price list, not a recommendation.",
};

export default function TopPicksPage() {
  // Sort tools by combined score and take top 5
  const topPicks = [...toolsData]
    .sort((a: any, b: any) => (a.basePrice ?? 0) - (b.basePrice ?? 0))
    .slice(0, 5);

  const sema = listeSemasi("The Cheapest Tools We Track (2026)", "/top-picks", topPicks);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-2"></div>
      </div>
      
      <main className="doc">
        <div>
          <span>Ranked by price</span>
          <h1>Cheapest Tools <span>2026</span></h1>
          {/* ONCEKI METIN: "We've analyzed over 500+ data points" -- boyle bir
              olcum YOK. Sayfa araclari kolaylik + ozellik puanina gore
              siraliyor, o kadar. Uydurma rakam kaldirildi ve yontem
              oldugu gibi yazildi. */}
          <p>
            These are the {topPicks.length} lowest starting prices across our whole directory of {toolsData.length}.
            No one paid to be here. Cheapest is not best: this is a price list, not a recommendation, and it
            says nothing about whether any of these fit your team.{' '}
            <Link href="/methodology">How we score tools</Link>.
          </p>
        </div>

        <div>
          {topPicks.map((tool: any, index) => (
            <div key={tool.slug}>
              <div>#{index + 1}</div>
              
              <div>
                <div>
                  {tool.name.charAt(0)}
                </div>
                <div>
                  <h2>{tool.name}</h2>
                  {tool.shortDescription && (
                    <p>
                      {tool.shortDescription}
                    </p>
                  )}
                  <div>
                    <span>{tool.category}</span>
                    <div><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                  </div>
                </div>
              </div>

              <Link href={`/tools/${tool.slug}`}>
                Read Why <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
