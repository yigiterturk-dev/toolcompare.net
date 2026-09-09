import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, MapPin } from "lucide-react";

import type { Metadata } from "next";

import { OG_GORSEL } from "@/lib/paylasim";
// Kendi metadata'si yoktu: kok layout'unkini miras alip
// anasayfayla AYNI baslik/aciklamayi kullaniyordu.
export const metadata: Metadata = {
  title: "Contact ToolCompare | ToolCompare",
  description: "Questions about a review, a correction, or a listing? Here is how to reach the ToolCompare team.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact ToolCompare | ToolCompare", description: "Questions about a review, a correction, or a listing? Here is how to reach the ToolCompare team.", url: "/contact", siteName: "ToolCompare", type: "website" , images: [{ url: OG_GORSEL, width: 1200, height: 630, alt: "ToolCompare" }]},
};


export default function ContactPage() {
  return (
    /*
      Header ve Footer <main> DISINDA. Icerde kalmislardi: hem semantik
      olarak yanlisti (main sayfanin ana icerigi, site basligi degil) hem
      de `.doc > *` kurali onlari 44rem'e sikistiriyordu -- olculdu,
      /contact'ta header kapsayicisi 1280px yerine 704px genisligindeydi
      ve butun sayfa diger sayfalara gore 24px kayik duruyordu.
    */
    <>
      <Header />
      <main className="doc">
      <div>
        <div>
          <h1>
            Get in <span>Touch</span>
          </h1>
          <p>
            Have a tool you want us to review? Or just want to say hi? We&rsquo;d love to hear from you.
          </p>
        </div>

        <div>
          <div>
            <Mail size={32} />
            <h2>Email Us</h2>
            <p>One address for everything: reviews, listings, partnerships, corrections.</p>
            <a href="mailto:hello@toolcompare.net">hello@toolcompare.net</a>
          </div>

          <div>
            <MessageSquare size={32} />
            <h2>Corrections</h2>
            <p>Wrong price, renamed plan, missing feature? Say which page and what changed; corrections are handled first.</p>
            <span>Vendors: use the <a href="/submit">submit a tool</a> form for new listings.</span>
          </div>
        </div>

        <div>
          <p>
            Every message gets a reply from the person who maintains the site. There is no ticket
            system and no live chat; email is the only channel, and it is read.
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
