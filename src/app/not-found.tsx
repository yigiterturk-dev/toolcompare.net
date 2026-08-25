import Link from "next/link";

/*
  404.

  Onceki surum koyu temaya sabitlenmisti (#050505 zemin, beyaz metin) ve
  acik temada okunmuyordu. Metni de dogru degildi: "moved to a new galaxy"
  diyordu ama ziyaretcinin ihtiyaci bu degil -- nereye gidecegini bilmek.
  Uc gercek cikis yolu veriliyor.

  Not: bu sayfa statik uretiliyor, yani nonce alamiyor. Bu yuzden burada
  hicbir script yok; eskiden CSP altinda hidrasyon calismiyordu ve sayfa
  sessizce olu kaliyordu.
*/

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-16 text-center">
      <p className="font-serif text-5xl font-semibold text-ink-muted">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-3 text-ink-soft">
        The tool or comparison you are looking for is not here. It may have been renamed, or the
        link may be wrong.
      </p>

      <ul className="mt-8 flex list-none flex-wrap justify-center gap-2 p-0">
        <li>
          <Link
            href="/"
            className="inline-flex rounded-[--radius-control] bg-brand px-4 py-2.5 text-sm font-medium text-brand-ink no-underline transition-opacity duration-150 hover:opacity-90"
          >
            All tools
          </Link>
        </li>
        <li>
          <Link
            href="/categories"
            className="inline-flex rounded-[--radius-control] border border-line bg-surface px-4 py-2.5 text-sm no-underline transition-colors duration-150 hover:border-line-strong"
          >
            Browse by category
          </Link>
        </li>
        <li>
          <Link
            href="/top-picks"
            className="inline-flex rounded-[--radius-control] border border-line bg-surface px-4 py-2.5 text-sm no-underline transition-colors duration-150 hover:border-line-strong"
          >
            Cheapest tools
          </Link>
        </li>
      </ul>
    </main>
  );
}
