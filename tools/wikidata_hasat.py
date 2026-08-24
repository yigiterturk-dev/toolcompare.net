"""Wikidata'dan arac ADAYI toplar.

⚠️  OLCULDU VE BU KATALOG ICIN UYGUN BULUNMADI (2026-08-24).
    Betik CALISIYOR; sorun kaynagin kendisi. Ayni yolu tekrar denemek
    isteyen olursa kanit burada:

      - wd:Q1254933 "online service" sinifi ASTRONOMI GOZLEMEVLERI
        donduruyor (Yerkes, Ondrejov, Turin Astrophysical...).
      - wd:Q193424 "web application" ayni Flathub kaydini 12 kez
        donduruyor.
      - wd:Q7397 "software" Java (programlama dili), BibTeX, Mach
        cekirdegi, kapanmis IM istemcileri donduruyor.

    3.889 ham satirdan 201 aday cikti; rastgele 18 ornekten ancak 3-4'u
    bir SaaS karsilastirma sitesine ait turdendi. Gerisi akademik
    araclar, KDE eklentileri, OpenGL ES gibi API tanimlari.
    Wikidata genel bir yazilim ansiklopedisi; bizim ihtiyacimiz guncel
    ticari SaaS urunleri. Eklemek katalogu BOZARDI, o yuzden eklenmedi.

    Uygun kaynak arayan biri once su soruyu cevaplamali: kayitlarin
    cogunlugu SATIN ALINABILIR bir urun mu, yoksa herhangi bir yazilim
    mi? Wikidata'da cevap ikincisi.

NASIL CALISIR (kaynak degisirse yeniden kullanilabilir):
Cikti dogrudan kullanilmaz; tools/dogrula.py'den gecer. Olu urunun
sitesi zaten acilmaz. Kaynagin isi aday uretmek, kapinin isi elemek.

Burada yapilan eleme: kapanmis urunler (P2669), Ingilizce adi/aciklamasi
olmayanlar, ayni siteye isaret eden tekrarlar ve aciklamasindan bilinen
bir kategoriye eslenemeyenler disarida birakilir -- yanlis kategori
akran secimini ve tum karsilastirma sayfalarini bozar.

Kullanim: python3 tools/wikidata_hasat.py [hedef] > adaylar.json
"""
import json, re, sys, urllib.parse, urllib.request

UC = "https://query.wikidata.org/sparql"
AJAN = "ToolCompareBot/1.0 (https://toolcompare.net; catalog research)"

# Ilk deneme tum yazilim hiyerarsisini transitif geziyordu (P31/P279*)
# ve sunucu 504 dondu. Dogrudan instance-of + sayfalama calisiyor.
SINIFLAR = [
    ("Q7397",   "software"),
    ("Q193424", "web application"),
    ("Q1254933","online service"),
    ("Q166142", "application"),
]

SORGU = """
SELECT ?itemLabel ?itemDescription ?site WHERE {
  ?item wdt:P31 wd:%s ; wdt:P856 ?site ; schema:description ?itemDescription .
  FILTER(LANG(?itemDescription) = "en")
  FILTER NOT EXISTS { ?item wdt:P2669 ?durdurma }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT %d OFFSET %d
"""

# Aciklamadaki anahtar kelimeden kategoriye esleme. Eslemeyen aday
# ATILIR: yanlis kategori, akran secimini ve tum karsilastirma
# sayfalarini bozar.
ESLEME = [
    ("CRM", ["crm", "customer relationship"]),
    ("E-commerce", ["e-commerce", "ecommerce", "online store", "shopping cart", "payment gateway"]),
    ("Marketing", ["marketing", "seo ", "newsletter", "email campaign", "analytics", "advertis"]),
    ("Customer Service", ["help desk", "helpdesk", "customer support", "ticketing"]),
    ("HR Software", ["human resources", "payroll", "recruit", "applicant tracking"]),
    ("Finance Tools", ["accounting", "invoic", "bookkeep", "expense", "banking"]),
    ("Legal Tools", ["contract management", "e-signature", "electronic signature", "compliance"]),
    ("Project Management", ["project management", "issue track", "task management", "kanban"]),
    ("Communication", ["messaging", "video conferenc", "chat client", "voip", "email client"]),
    ("Hosting", ["web hosting", "cloud hosting", "cdn", "content delivery"]),
    ("Design", ["graphic", "image editor", "vector", "3d model", "prototyp", "video editor", "animation"]),
    ("AI Tools", ["machine learning", "artificial intelligence", "language model", "neural"]),
    ("Developer Tools", ["database", "programming", "developer", "version control", "compiler",
                          "framework", "ide ", "text editor", "api ", "devops", "container",
                          "monitoring", "web server", "software development"]),
    ("Productivity", ["note-taking", "notes app", "password manager", "calendar", "spreadsheet",
                       "word process", "file sync", "cloud storage", "productivity"]),
]

def kategori(aciklama: str):
    a = " " + aciklama.lower() + " "
    for ad, anahtarlar in ESLEME:
        if any(k in a for k in anahtarlar):
            return ad
    return None

def slugla(ad: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", ad.lower()).strip("-")
    return s[:48]

def sorgula(sinif, limit, offset):
    url = UC + "?" + urllib.parse.urlencode({"query": SORGU % (sinif, limit, offset),
                                             "format": "json"})
    istek = urllib.request.Request(url, headers={"User-Agent": AJAN,
                                                 "Accept": "application/sparql-results+json"})
    return json.load(urllib.request.urlopen(istek, timeout=180))["results"]["bindings"]

def main():
    hedef = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    gorulen_site, gorulen_slug = set(), set()
    adaylar = []
    ham = 0
    atlanan_kategori = 0

    for sinif, ad_sinif in SINIFLAR:
        offset = 0
        while len(adaylar) < hedef:
            try:
                satirlar = sorgula(sinif, 500, offset)
            except Exception as e:
                print(f"  {ad_sinif} offset {offset}: {type(e).__name__}", file=sys.stderr)
                break
            if not satirlar:
                break
            ham += len(satirlar)
            for s in satirlar:
                ad = s["itemLabel"]["value"].strip()
                aciklama = s["itemDescription"]["value"].strip()
                site = s["site"]["value"].strip()

                if re.fullmatch(r"Q\d+", ad):            # etiketsiz kayit
                    continue
                if not site.startswith("https://"):
                    continue
                alan = urllib.parse.urlparse(site).netloc.lower()
                if alan.startswith("www."):
                    alan = alan[4:]
                if alan in gorulen_site:
                    continue
                kat = kategori(aciklama)
                if not kat:
                    atlanan_kategori += 1
                    continue
                sl = slugla(ad)
                if not sl or sl in gorulen_slug:
                    continue

                gorulen_site.add(alan); gorulen_slug.add(sl)
                adaylar.append({
                    "slug": sl, "name": ad, "category": kat,
                    "shortDescription": aciklama[0].upper() + aciklama[1:] + ".",
                    "websiteUrl": site,
                })
            offset += 500

    print(f"wikidata ham satir: {ham}  ->  aday: {len(adaylar)}  "
          f"(kategoriye eslenemeyen {atlanan_kategori} atildi)", file=sys.stderr)
    json.dump(adaylar, sys.stdout, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
