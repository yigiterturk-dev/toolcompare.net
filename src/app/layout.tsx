import type { Metadata } from "next";
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
  icons: {
    icon: "/favicon.svg",
  },
  // metadataBase olmadan canonical ve OG url'leri goreli kaliyordu; Google'in
  // hangi adresi kanonik sayacagi belirsizdi.
  metadataBase: new URL("https://toolcompare.net"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "ToolCompare | The World's Best Software Tools, Compared",
    description:
      "Software tools compared on what they cost to start. Every price says whether it is verified, usage-based or a free tier — and we publish no invented quality scores.",
    url: "/",
    siteName: "ToolCompare",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
      Font degiskenleri <html> uzerinde: next/font onlari className ile
      birakiyor ve Tailwind'in @theme bloklari :root'ta cozuluyor. Degiskenler
      <body>'de kalinca @theme icindeki var(--font-roboto) hicbir seye
      cozulmuyordu ve Tailwind kendi varsayilan yiginina dusuyordu -- yani
      fontlar yuklenip hic kullanilmiyordu.
    */
    <html lang="en" className={`${newsreader.variable} ${roboto.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
