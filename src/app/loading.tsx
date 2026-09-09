/**
 * Kok yukleniyor iskeleti.
 *
 * DENETIMDE BULUNAN (2026-09-09): 19 sayfalik app router'da hic loading.tsx
 * yoktu. Sitenin cogu statik uretildigi icin ilk yukleme etkilenmiyor, ama
 * istemci tarafi gecislerde ve dinamik segmentlerde ekran bos kaliyordu.
 *
 * ⚠️ Iskelet gercek duzenin OLCULERINI taklit etmeli; etmezse icerik gelince
 * sayfa ziplar (CLS) ve iskelet faydadan cok zarar verir.
 */
export default function Loading() {
  return (
    <div className="doc" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton" style={{ height: 36, width: "55%", marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 32 }} />
      <div style={{ display: "grid", gap: "1rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <div className="skeleton" style={{ height: 20, width: "40%" }} />
            <div className="skeleton" style={{ height: 14, width: "95%" }} />
            <div className="skeleton" style={{ height: 14, width: "70%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
