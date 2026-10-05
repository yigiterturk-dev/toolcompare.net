# ToolCompare — Outreach Şablonları

Kural: link isteme. Doğrulama iste. Link, satıcının kendi "press / as seen on"
sayfasından karşılığında gelir. Kişiselleştirmeden gönderme — 10 iyi mail,
100 kopya-yapıştırmadan iyidir.

---

## 1) Satıcıya doğrulama maili (ANA KANAL)

Kime: press@ / marketing@ / hello@ · Konu satırı aşağıda.
Gönderim: günde en fazla 15. Aynı adrese 1 takip, sonra bırak.

**Subject:** Quick fact-check on your {TOOL} listing

Hi {FIRST_NAME or team},

I run ToolCompare (toolcompare.net), an independent catalogue of 512 software
tools. We list {TOOL} here:
{TOOL_PAGE_URL}

Two things I'd like you to confirm so we don't publish anything stale:

1. Starting price — we currently show {PRICE}. Still correct?
2. The three features we highlight: {FEATURES}. Anything you'd swap?

We don't run invented quality scores and we don't charge for placement, so a
correction is the only thing I'm after. If your team keeps a press or
"as featured on" page, we're happy to be listed there.

Thanks,
Yigit
ToolCompare · toolcompare.net

---

## 2) Takip (7 gün sonra, tek sefer)

**Subject:** Re: Quick fact-check on your {TOOL} listing

Hi — bumping this once in case it got buried. If the pricing on
{TOOL_PAGE_URL} is correct as-is, just reply "looks right" and I'll leave it.

Yigit

---

## 3) Karşılaştırma sayfası bildirimi (rakip sayfası varsa daha güçlü)

**Subject:** {TOOL} vs {COMPETITOR} — you're the pick, wanted you to know

Hi {NAME},

We published a head-to-head of {TOOL} and {COMPETITOR}:
{COMPARE_URL}

{TOOL} comes out ahead on {REASON}. No affiliate deal behind it — the
methodology is public at toolcompare.net/methodology.

If it's useful for your team, feel free to cite or link it. And if you think
we got any detail wrong, tell me and I'll fix it same day.

Yigit · toolcompare.net

---

## 4) Reddit / Hacker News / Indie Hackers

Link atma. Soruya cevap ver, link sadece kanıt olsun. En az 3 paragraf gerçek
cevap, sonra tek satır kaynak. Hesabın yaşı ve karması yoksa önce 2 hafta
sadece cevap yaz.

> I looked at this exact question when building a catalogue of these tools.
> Short version: {2-3 cümle gerçek cevap, sayı ver}.
>
> The catch nobody mentions is {gerçek bir uyarı}.
>
> I keep the pricing breakdown here if you want the numbers:
> {URL} — no signup, no affiliate links on that page.

Hedef altyazılar: r/SaaS, r/nocode, r/marketing, r/webdev, r/selfhosted,
r/ExperiencedDevs, Indie Hackers, Hacker News "Ask HN" konuları.

---

## 5) Blog / newsletter yazarına (listicle'a eklenme)

**Subject:** Your "{POST_TITLE}" — one pricing correction

Hi {NAME},

Read your piece on {TOPIC}. One thing: {TOOL}'s pricing changed to {PRICE} —
your post still shows the old figure.

I track this across 512 tools at toolcompare.net; the {TOOL} page is
{URL} if you want the current numbers for the update.

No ask beyond that — just thought you'd want it accurate.

Yigit

---

## 6) Rozet maili (2026-10-05 — 1. şablonun yerine geçer, rozete uygun araçlarda)

Liste: `docs/outreach/rozet-hedefleri.csv` (362 uygun araç, gösterime göre sıralı;
yeniden üretmek için `npm run rozet:hedef`). `kanal` = mail/form ise direkt kullan,
`teyit-gerek` ise önce satıcının sitesinden adres bul. **Öncelik orta boy ve bağımsız
araçlar** (Photopea, Obsidian, DBeaver, Screaming Frog, Strapi, Matomo, Sketch,
Shopware…). IBM / Microsoft / Red Hat gibi devler rozet gömmez, zaman harcama.

Neden 1. şablondan güçlü: 1. şablon "bizi press sayfanıza koyun" diye dolaylı rica
ediyor; bu, satıcıya hazır, işine yarayan bir şey veriyor ("fiyatımız gerçek" diyen
rozet), link onun içinde geliyor.

**Subject:** {TOOL}'s pricing — verified badge, if useful

Hi {FIRST_NAME or team},

I run ToolCompare (toolcompare.net), an independent catalogue that lists software
by what it actually costs to start. We read {TOOL}'s pricing from your own pricing
page on {FIYAT_OKUMA} and list it with the source link:
{ROZET_LINKI}

Because that check passed, there's a small badge you can embed if it's useful —
it says "Pricing verified" and the month we read it. No rating, no payment, nothing
to sign up for. The HTML snippet is at that link.

And if anything on the page is out of date, a one-line reply is enough and I'll
fix it the same day.

Thanks,
Yigit
ToolCompare · toolcompare.net

**Takip (7 gün sonra, tek sefer):**
> Just bumping this once in case it got buried — the badge snippet is here:
> {ROZET_LINKI}. No worries if it's not a fit.
