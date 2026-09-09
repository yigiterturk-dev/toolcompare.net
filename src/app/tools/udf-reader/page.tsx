import type { Metadata } from "next";
import { paylasimMeta } from "@/lib/paylasim";
import UdfReaderClient from "./UdfReaderClient";

/**
 * Sunucu bileseni sarmalayici.
 *
 * ⚠️ Bu dosya 2026-09-09'da bolundu. Sayfanin tamami "use client" idi ve
 * `metadata` bir istemci bileseninden export EDILEMEZ -- eklendiginde
 * derleme "You are attempting to export metadata from a component marked
 * with use client" ile patladi. Sayfanin kanonigi de bu yuzden yoktu ve kok
 * layout'un `canonical: "/"` degerini miras aliyordu (yani Google'a "ben
 * anasayfayim" diyordu). Metadata burada, etkilesim UdfReaderClient'ta.
 */
const title = "UDF Reader — Open UYAP .udf Files Online | ToolCompare";
const description =
  "Open and read UYAP .udf files in your browser. The file is processed locally; nothing is uploaded.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools/udf-reader" },
  ...paylasimMeta({ url: "/tools/udf-reader", title, description }),
};

export default function UdfReaderPage() {
  return <UdfReaderClient />;
}
