import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "ToolCompare | The World's Best Software Tools, Compared",
  description: "Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.",
  icons: {
    icon: "/favicon.svg",
  },
  // metadataBase olmadan canonical ve OG url'leri goreli kaliyordu; Google'in
  // hangi adresi kanonik sayacagi belirsizdi.
  metadataBase: new URL("https://toolcompare.net"),
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
