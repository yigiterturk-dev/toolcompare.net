import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
