import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toolcompare.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ToolCompare | The World's Best Software Tools, Compared",
    template: "%s | ToolCompare",
  },
  description: "Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.",
  applicationName: "ToolCompare",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "ToolCompare",
    title: "ToolCompare | The World's Best Software Tools, Compared",
    description: "Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.",
    url: siteUrl,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "ToolCompare" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolCompare | The World's Best Software Tools, Compared",
    description: "Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.",
    images: ["/logo.png"],
  },
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
