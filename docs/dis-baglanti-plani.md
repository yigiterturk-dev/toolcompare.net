# Dış bağlantı planı — uygulanabilir hâli

Ölçüm (2026-09-10, GSC): 11.800 gösterim / 1 tık, ortalama sıra 57. Niyet sorguları geldi
(pricing 1.902, alternatives 738, "X vs Y" 645) ama hepsi 7-9. sayfada. On-page işi bitti;
eksik olan **otorite**. Hedef 3-5 kaliteli link, 300 değil.

Dayanak varlık: `/data` (CC BY 4.0, atıf zorunlu) + `GET /api/tools` (anahtarsız JSON).

---

## ✅ 0. Endpoint hazırlandı (2026-09-10)

`/api/tools` ~1,8 MB idi; sayfalama ve alan seçimi yoktu. Eklendi:
`?fields=...`, `?format=compact`, `?limit=&offset=`, `Cache-Control: s-maxage=86400`,
`Access-Control-Allow-Origin: *`, `X-Total-Count`, `X-License`.
Parametresiz çağrı **eskisiyle aynı** — mevcut kullanıcı kırılmıyor.
⏳ Kalan: Postman koleksiyonu (public-apis istiyor) ve canlıya deploy (Hostinger, elle).

---

## 1. Show HN (en yüksek tek seferlik getiri)

**Zamanlama:** Salı–Perşembe, 08:00–10:00 ET (TR ile 15:00–17:00). Hafta sonu gönderme.

**Başlık — önerilen:**

```
Show HN: A SaaS pricing dataset that records what it couldn't verify
```

Alternatif (daha düz, daha az iddialı):

```
Show HN: Free dataset of software pricing, with the date each price was read
```

İlkini öneriyorum: HN'de ayırt edici olan şey "doğruladım" değil, "doğrulayamadığımı da yazdım".

**URL:** `https://toolcompare.net/data`

**Gövde (metin alanına değil, ilk yoruma yaz — HN geleneği):**

```
I kept hitting the same problem while comparing tools: every pricing figure on the
web is undated. Someone writes "$29/user" in a blog post in 2023, it gets copied,
and three years later it's still the top result. You can't tell whether a number
was checked yesterday or never.

So the dataset behind this site records, for each of 512 products: the source URL,
the date an editor actually read that page, the specific plan facts that source
backs, and — the part I care about most — what could not be established.

That last field is not decoration. Examples from the data:

- Canva pins its currency to the visitor's region, so there is no single published
  USD price to record. The record says that instead of guessing one.
- LastPass serves its prices as unresolved template placeholders ({LPPremium}).
  Same treatment.
- Rippling and hiBob publish no plan table at all — just a demo form. That absence
  is itself the useful finding for someone searching "rippling pricing".
- Tipalti starts at $99 but charges undisclosed per-invoice fees. Recorded as a
  limitation, not invented as a number.

102 of the 472 sourced records still have no concrete price. That gap is visible in
the data on purpose.

It's CC BY 4.0, the endpoint needs no key, and I'd rather get corrections than
compliments — if you know a price here is wrong, that's the most useful reply.

Built with Next.js, data is a single JSON file in the repo, no database.
```

**Yorumlara hazır ol, bu üçü kesin gelir:**
1. *"G2/Capterra zaten var"* → Onlar tarih ve kaynak yayımlamıyor; fark bu, özellik sayısı değil.
2. *"1,8 MB endpoint mi?"* → Madde 0 yapılmışsa sorun değil, yapılmamışsa haklılar.
3. *"Affiliate linki var mı?"* → Şu an yok ve `/affiliate-disclosure` bunu yazıyor. Dürüst cevap güçlü.

---

## 2. public-apis/public-apis — PR (dofollow, ~340k yıldız)

Gereklilikleri kontrol ettim, uyuyoruz: ücretsiz, tam erişim, anahtar yok, dokümantasyon var
(`/data` sayfası tam bunun için).

- **Dosya:** `README.md`, `master` dalı
- **Bölüm:** `Business` (alfabetik sıraya yerleştir)
- **PR başlığı:** `Add ToolCompare API`
- **Commit:** `Add ToolCompare to Business`
- **Satır (açıklama 100 karakter sınırı içinde):**

```
| [ToolCompare](https://toolcompare.net/data) | Software pricing with source URL and the date each price was read | `No` | Yes | Yes |
```

**Kurallar — ihlal edersen kapatırlar:**
- Tek PR'da tek API. Commit'leri squash et.
- İsim `API` ile bitmesin, TLD yazma (`ToolCompare`, `ToolCompare.net` değil).
- `Auth` yalnız şu değerlerden: `OAuth` / `apiKey` / `X-Mashape-Key` / `No` / `User-Agent`
- `CORS` yalnız `Yes` / `No` / `Unknown` — endpoint artık `Access-Control-Allow-Origin: *`
  dönüyor, yani `Yes` doğru. Yine de göndermeden önce tarayıcı konsolundan bir `fetch` ile teyit et.
- ⚠️ **Red sebebi:** "ücretli bir çözümün pazarlama denemesi gibi görünmek". Bu yüzden PR'da
  `/data`'ya link ver, ana sayfaya değil. Ticari amaç görünürse kapatılır.
- Postman koleksiyonu kolonu isteniyor — tek GET için hazırlaması 5 dakika, atlamaya çalışma.

---

## 3. Diğer liste PR'ları (aynı iş, daha az rekabet)

- **`jimaek/Awesome-JSON-Datasets`** — kimlik doğrulaması gerektirmeyen JSON veri kümeleri.
  Tam bize göre. Format basit: `[ToolCompare SaaS Pricing](https://toolcompare.net/api/tools)`.
  🔎 Not: Bu deponun sahibi cdnjs'i de yürüten kişi — sitenin `cdnjs` sorgusunda p15 olması
  tesadüf değil, bu ekosistem bizde işliyor.
  ⚠️ Orijinali (`jdorfman/awesome-json-datasets`) **arşivlendi**, ona PR açma.
- **`awesomedata/awesome-public-datasets`** — README otomatik üretiliyor, PR'ı
  **`awesomedata/apd-core`** deposuna açacaksın. Yanlış depoya açılan PR kapanır.
- **`public-api-lists/public-api-lists`** — public-apis'in aktif çatalı, 730+ API.

---

## 4. Satıcıya haber (düşük vuruş oranı, ama doğruluk kazancı kesin)

512 kaydın hepsine değil; **fiyatı doğrulayamadığımız** kayıtlara yaz. Onlar için haklı bir
sebebin var ve satıcı düzeltmek ister.

```
Subject: Your pricing page renders no figure for automated readers

Hi — I maintain toolcompare.net, an independent comparison catalogue.

We publish a record for [PRODUCT] but we could not record a price: your pricing
page serves [regional currency / a client-side placeholder / a slider] rather than
a published figure, so we list the plan limits and state plainly that the price
could not be established:

https://toolcompare.net/tools/[slug]

If that's wrong, or if there's a canonical USD figure you'd like cited, reply and
I'll re-read the page and update the checked-on date. We don't charge for listings
and there's no affiliate link on that page.

— Yiğit
```

Getirisi iki yönlü: bazısı link verir, çoğu düzeltme yollar — ki sitenin tek gerçek iddiası
doğruluk.

---

## 5. Reddit / HN yorumları (link için değil, keşif için)

Ölçülen sorgular orada her gün soruluyor: `smartsheet alternatives`, `zapier alternatives`,
`intercom free plan`, `rippling pricing`. Kural: **soruyu gerçekten cevapla, linki cevabın
kanıtı olarak ver.** Çoğu nofollow olacak; yine de trafik ve keşif getirir.

Link atmak için yazılan yorum hesabı da siteyi de yakar. r/SaaS ve r/selfhosted'da
self-promotion kuralları sert, önce oku.

---

## 🚫 Yapılmayacaklar

Link satın alma, PBN, toplu guest post, dizin spam'i, "link exchange" e-postaları.
3-5 link gerekiyor; satın alınan link bu ölçekte fayda değil risk.

---

## Sıra

1. ~~Madde 0 (endpoint alan süzgeci + cache)~~ ✅ yapıldı — canlıya deploy edilmesi gerekiyor
2. ✅ **PR AÇILDI: https://github.com/marcelscruz/public-apis/pull/1215** (Add ToolCompare API,
   Business bölümü, 1 satır, mergeable). Bot incelemesi ve maintainer merge'i bekleniyor.
   ⚠️ `jimaek/Awesome-JSON-Datasets` **ÖLÜ** — 2015'ten beri push yok, 5 yıldız, fork. PR açma.
3. public-apis PR'ı (Postman koleksiyonu ile)
4. Show HN — 1 ve 3 bittikten sonra, hafta içi sabah ET
5. Satıcı e-postaları — haftada 10-15, toplu değil
