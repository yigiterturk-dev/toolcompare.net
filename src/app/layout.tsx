import type { Metadata } from "next";
import { cspOlustur } from "@/lib/guvenlik";
import { reklamYayinci } from "@/lib/reklam";
import { Newsreader, Roboto } from "next/font/google";
import "./globals.css";

// Tipografi ui-ux-pro-max onerisi: Newsreader (baslik) + Roboto (metin).
// Editoryal/haber tonu, sitenin "dogrulanmis kaynak" iddiasiyla ayni dili
// konusuyor. display:"swap" — gorunmez metin (FOIT) olmasin.
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: "ToolCompare | The World's Best Software Tools, Compared",
  description: "Software tools compared on what they cost to start. Every price says whether it is verified, usage-based or a free tier — and we publish no invented quality scores.",
  /*
    TEK KIMLIK. Onceden UC AYRI simge vardi ve hangisinin gorunecegi
    istemciye kaliyordu: `src/app/favicon.ico` Next'in varsayilan siyah
    ucgeni, `public/favicon.svg` mor bir onay isareti, `public/logo.png` ise
    asil marka. Ucu de birbirinden farkliydi. Hepsi `public/brand/`teki tek
    kaynaktan yeniden uretildi.
  */
  icons: {
    icon: [
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  // metadataBase olmadan canonical ve OG url'leri goreli kaliyordu; Google'in
  // hangi adresi kanonik sayacagi belirsizdi.
  metadataBase: new URL("https://toolcompare.net"),
  /*
    OLCULEN HATA (2026-09-09): burada `alternates: { canonical: "/" }`
    duruyordu. Next metadata'yi alt sayfalara MIRAS birakiyor, yani kendi
    kanonigini yazmayan HER sayfa Google'a "ben anasayfayim" diyordu.
    Canlida dogrulandi: /top-picks, /categories, /blog ve /tools/udf-reader
    (hepsi 200) kanonik olarak anasayfayi gosteriyordu. Ikisi ayni zamanda
    sitemap'te -- yani sitemap "beni indeksle", kanonik "ben baskasiyim"
    diyordu. Celisen sinyalin sonucu: sayfa indekslenmez.
    Kanonik artik SAYFA BASINA yaziliyor; anasayfaninki app/page.tsx'te.
    tests/kanonik.test.ts kendi kanonigini yazmayan sayfa kalirsa kiriliyor.
  */
  openGraph: {
    title: "ToolCompare | The World's Best Software Tools, Compared",
    description:
      "Software tools compared on what they cost to start. Every price says whether it is verified, usage-based or a free tier — and we publish no invented quality scores.",
    url: "/",
    siteName: "ToolCompare",
    type: "website",
    /*
      Kart "summary_large_image" diyordu ama GORSEL TANIMLI DEGILDI --
      paylasilan her link bos bir kart olarak cikiyordu. Dagitim tarafinda
      bedava kaybedilen yer burasiydi.
    */
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "ToolCompare" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsensePub = reklamYayinci();

  return (
    /*
      Font degiskenleri <html> uzerinde: next/font onlari className ile
      birakiyor ve Tailwind'in @theme bloklari :root'ta cozuluyor. Degiskenler
      <body>'de kalinca @theme icindeki var(--font-roboto) hicbir seye
      cozulmuyordu ve Tailwind kendi varsayilan yiginina dusuyordu -- yani
      fontlar yuklenip hic kullanilmiyordu.
    */
    <html lang="en" className={`${newsreader.variable} ${roboto.variable}`}>
      <head>
        {/*
          CSP'yi META ile de basiyoruz: canlida onde duran Hostinger/
          LiteSpeed katmani Content-Security-Policy basligimizin uzerine
          yaziyor ve geriye yalnizca "upgrade-insecure-requests" kaliyor
          (olcum: src/lib/guvenlik.ts). Baslik da duruyor; barindirma
          degisince ikisi ayni politikayi soyleyecek.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspOlustur({ adsense: Boolean(adsensePub), meta: true })}
        />
        {/*
          AdSense betigi yalnizca yayinci kimligi TANIMLIYSA basilir.
          Kimliksiz betik hem ise yaramaz hem her ziyaretcide bosuna
          ~90 KB indirtir; /ads.txt de ayni degiskene bakiyor, yani
          "betik var ama ads.txt yok" celiskisi olusamaz.
        */}
        {adsensePub ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePub}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
