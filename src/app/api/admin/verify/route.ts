/**
 * Panel girisi. Parola karsilastirmasi istemciye hic inmez.
 *
 * Oturum kurmuyoruz: panel zaten her istekte parolayi gonderiyor ve
 * asil kapi API route'larinin kendisinde. Bu uc sadece "parola dogru mu"
 * sorusunu cevaplayip panelin acilmasini saglar.
 */

import { NextResponse } from "next/server";
import {
  yoneticiMi,
  yoneticiParolasiTanimliMi,
  hizFreni,
  istekKaynagi,
  girisDenemesiKaldiMi,
  basarisizGirisiSay,
  girisSayaciniSifirla,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hizFreni(`giris:${istekKaynagi(request)}`, 10)) {
    return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });
  }

  // IP freni sahte X-Forwarded-For ile asilabilir; bu tavan asilamaz.
  if (!girisDenemesiKaldiMi()) {
    return NextResponse.json(
      { ok: false, error: "Too many failed attempts today" },
      { status: 429 }
    );
  }

  if (!yoneticiParolasiTanimliMi()) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not set on the server" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (!yoneticiMi(body?.password)) {
    basarisizGirisiSay();
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  // Gercek yonetici girdi: sayac sifirlanir, kendi tavanini yemez.
  girisSayaciniSifirla();
  return NextResponse.json({ ok: true });
}
