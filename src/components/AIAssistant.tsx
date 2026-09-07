"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Sparkles, Loader2 } from "lucide-react";

/*
  Yardimci sohbet penceresi.

  Gorsel olarak acik temaya tasindi; onceki surum koyu yuzeylere beyaz
  metin yaziyordu ve acik zeminde okunmuyordu.

  Iki davranis duzeltmesi de var:

  - Pencere sabit 380x550 pikseldi. 390px genisliginde bir telefonda saga
    2rem bosluk birakip 380px kutu cizmek ekrandan tasiyor demek. Artik
    kucuk ekranda ekrani kapliyor, buyukte sabit genislige donuyor.

  - Panel acikken Escape ile kapanmiyordu ve odak yonetimi yoktu. Escape
    eklendi; acilinca odak metin kutusuna gidiyor.
*/

type Mesaj = { role: "user" | "assistant"; content: string };

/*
  Bilesen listeyi yalnizca API'ye gonderiyor; tam `Arac` sekli sart degil.
  Once `any[]` idi -- cagiran taraf kirpilmis `IzgaraArac` gonderdigi icin
  tam tip yazmak da yanlis olurdu. Gereken en dar sozlesme: adi olan kayit.
*/
type GonderilebilirArac = { slug: string; name: string };

export default function AIAssistant({ tools }: { tools: GonderilebilirArac[] }) {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    {
      role: "assistant",
      content:
        "Tell me what you need the tool for. I answer from this catalogue only — if a price is not verified, I will say so rather than guess.",
    },
  ]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const kaydirmaRef = useRef<HTMLDivElement>(null);
  const girdiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (kaydirmaRef.current) kaydirmaRef.current.scrollTop = kaydirmaRef.current.scrollHeight;
  }, [mesajlar]);

  useEffect(() => {
    if (!acik) return;
    girdiRef.current?.focus();
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", kapat);
    return () => window.removeEventListener("keydown", kapat);
  }, [acik]);

  const gonder = async () => {
    if (!girdi.trim() || yukleniyor) return;
    const soru = girdi;
    setGirdi("");
    setMesajlar((p) => [...p, { role: "user", content: soru }]);
    setYukleniyor(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: soru, tools: tools.slice(0, 50) }),
      });
      const data = await res.json();
      setMesajlar((p) => [...p, { role: "assistant", content: data.reply }]);
    } catch {
      setMesajlar((p) => [
        ...p,
        { role: "assistant", content: "That request did not go through. Please try again." },
      ]);
    }
    setYukleniyor(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={acik ? "Close assistant" : "Open assistant"}
        aria-expanded={acik}
        onClick={() => setAcik((v) => !v)}
        className="fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-[--radius-pill] border border-line bg-brand text-brand-ink shadow-lg transition-opacity duration-150 hover:opacity-90 sm:right-6 sm:bottom-6"
      >
        {acik ? <X size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
      </button>

      {acik && (
        <div
          role="dialog"
          aria-label="Assistant"
          className="fixed inset-x-3 bottom-20 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-[--radius-card] border border-line bg-surface shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[32rem] sm:w-96"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="font-serif text-sm font-semibold">Ask about the catalogue</p>
            <p className="text-xs text-ink-muted">Answers come from the 512 tools listed here.</p>
          </div>

          <div ref={kaydirmaRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {mesajlar.map((m, i) => (
              <p
                key={i}
                className={`max-w-[85%] rounded-[--radius-card] px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "self-end bg-brand text-brand-ink"
                    : "self-start bg-surface-sunken text-ink-soft"
                }`}
              >
                {m.content}
              </p>
            ))}
            {yukleniyor && (
              <p className="self-start text-ink-muted" aria-live="polite">
                <Loader2 className="inline size-4 animate-spin" aria-hidden="true" />
                <span className="sr-only">Thinking</span>
              </p>
            )}
          </div>

          <div className="flex gap-2 border-t border-line p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Your question
            </label>
            <input
              id="assistant-input"
              ref={girdiRef}
              type="text"
              placeholder="What do you need it for?"
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && gonder()}
              className="min-w-0 flex-1 rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm placeholder:text-ink-muted focus:border-line-strong focus:outline-none"
            />
            <button
              type="button"
              onClick={gonder}
              disabled={yukleniyor || !girdi.trim()}
              aria-label="Send"
              data-tap
              className="grid w-11 shrink-0 place-items-center rounded-[--radius-control] bg-brand text-brand-ink transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
