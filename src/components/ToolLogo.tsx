import logolar from "@/data/logos.json";

/*
  Arac logosu.

  512 kaydin 501'inin logosu var (scripts/fetch-logos.mjs ile derleme
  zamaninda indirildi, public/logos altinda duruyor). Logolar YERELDE
  cunku site "ucuncu taraf istegi yok" diyor; calisma aninda bir favicon
  servisinden cekmek her ziyaretcinin tarayicisini o servise baglardi.

  Logosu olmayan 11 arac harf rozetine dusuyor -- eskiden 512 aracin
  404'u bos bir gradyan kutu ciziyordu.

  Logo dekoratif: yanindaki metin zaten aracin adini soyluyor, o yuzden
  alt="" ve aria-hidden. Ekran okuyucu ismi iki kez okumasin.
*/

const HARITA = logolar as Record<string, string>;

export default function ToolLogo({
  slug,
  name,
  size = 40,
  className = "",
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const uzanti = HARITA[slug];

  if (!uzanti) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`grid shrink-0 place-items-center rounded-[--radius-control] bg-surface-sunken font-serif font-semibold text-ink-soft ${className}`}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${slug}${uzanti}`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-[--radius-control] bg-surface object-contain ${className}`}
    />
  );
}
