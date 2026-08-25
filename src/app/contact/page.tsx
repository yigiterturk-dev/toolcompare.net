import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, MapPin } from "lucide-react";

import type { Metadata } from "next";

// Kendi metadata'si yoktu: kok layout'unkini miras alip
// anasayfayla AYNI baslik/aciklamayi kullaniyordu.
export const metadata: Metadata = {
  title: "Contact ToolCompare | ToolCompare",
  description: "Questions about a review, a correction, or a listing? Here is how to reach the ToolCompare team.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact ToolCompare | ToolCompare", description: "Questions about a review, a correction, or a listing? Here is how to reach the ToolCompare team.", url: "/contact", siteName: "ToolCompare", type: "website" },
};


export default function ContactPage() {
  return (
    <main className="doc">
      <Header />
      <div>
        <div>
          <h1>
            Get in <span>Touch</span>
          </h1>
          <p>
            Have a tool you want us to review? Or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div>
          <div>
            <Mail size={32} />
            <h2>Email Us</h2>
            <p>Our team is ready to assist you with any inquiries.</p>
            <a href="mailto:hello@toolcompare.net">hello@toolcompare.net</a>
          </div>

          <div>
            <MessageSquare size={32} />
            <h2>Live Chat</h2>
            <p>Available for our premium partners and tool vendors.</p>
            <span>Available 9 AM - 6 PM EST</span>
          </div>
        </div>

        <div>
          <form>
            <div>
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
            </div>
            <input type="text" placeholder="Subject" />
            <textarea placeholder="Message" rows={6}></textarea>
            <button>
              Send Message
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
