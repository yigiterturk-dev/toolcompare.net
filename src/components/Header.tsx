import Link from "next/link";

/*
  Header.

  Eskiden 12 satir inline style idi ve mobil davranisi globals.css'teki
  `!important` media query'lerine bagliydi — yani stil iki yere dagilmisti
  ve biri digerini eziyordu. Artik tek yerde, Tailwind siniflariyla.

  Ayrica "use client" gerekmiyordu: bilesende state yok, tek sebebi
  onMouseOver ile yapilan hover efektiydi. O efekt CSS'e tasindi, bilesen
  sunucu bileseni oldu — tarayiciya inen JS azaldi.
*/

const NAV = [
  { href: "/tools", label: "All tools" },
  { href: "/categories", label: "Categories" },
  { href: "/top-picks", label: "Cheapest tools" },
  { href: "/methodology", label: "How we rank" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 no-underline"
          aria-label="ToolCompare — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.svg" alt="" aria-hidden="true" width="44" height="28" className="h-7 w-auto" />
          <span className="font-sans text-lg font-bold tracking-tight text-[#1B2633]">
            Tool<span className="text-[#0A6CFA]">Compare</span>
          </span>
        </Link>

        {/*
          Gezinme mobilde gizleniyordu ve yerine hicbir sey konmuyordu:
          telefondan gelen biri kategorilere ulasamiyordu. Artik kucuk
          ekranda da duruyor, yatay kayan bir serit olarak.
        */}
        {/*
          Mobilde sola yasli: serit yatay kaydigi icin saga yaslamak ILK
          ogeyi gorunmez yapiyordu ("Categories" hic gorunmuyordu). Genis
          ekranda kayma olmadigi icin saga yaslama geri geliyor.
        */}
        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center justify-start gap-1 overflow-x-auto text-sm [scrollbar-width:none] sm:justify-end sm:gap-2 [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <li
                key={item.href}
                className={`shrink-0 ${item.href === "/top-picks" || item.href === "/methodology" ? "hidden sm:block" : ""}`}
              >
                <Link
                  href={item.href}
                  data-tap
                  className="inline-flex items-center rounded-[--radius-control] px-2 py-2 whitespace-nowrap text-ink-soft no-underline transition-colors duration-150 hover:text-ink sm:px-3"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/submit"
          data-tap
          className="hidden shrink-0 items-center rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-brand-ink no-underline transition-opacity duration-150 hover:opacity-90 sm:inline-flex"
        >
          Submit a tool
        </Link>
      </div>
    </header>
  );
}
