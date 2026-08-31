import { affiliateAktifMi, ACIKLAMA_METNI } from "@/lib/affiliate";

/**
 * Aciklama serdi. `src/data/affiliate.json` bosken HICBIR SEY basmaz --
 * "komisyon aliyoruz" demek, alinmiyorken de yanlistir. Ilk kayit
 * girildigi anda kendiliginden gorunur; kimsenin hatirlamasi gerekmez.
 */
export default function AffiliateNotu() {
  if (!affiliateAktifMi()) return null;
  return (
    <p className="mt-6 rounded-[--radius-control] border border-line bg-surface-soft px-3 py-2 text-xs text-ink-muted">
      {ACIKLAMA_METNI}
    </p>
  );
}
