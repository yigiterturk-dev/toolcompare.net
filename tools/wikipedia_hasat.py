"""Wikipedia KATEGORILERINDEN arac adayi toplar.

NEDEN BU, WIKIDATA DEGIL: ham Wikidata sorgusu denendi ve kirli cikti --
astronomi gozlemevleri, Java, Mach cekirdegi, kapanmis IM istemcileri
(bkz. tools/wikidata_hasat.py). Sebebi Wikidata'nin genel bir yazilim
ansiklopedisi olmasi.

Wikipedia KATEGORILERI ise tam istedigimiz turu veriyor:
"Category:Customer relationship management software" icinde Capsule,
CiviCRM, Comm100 var; "Category:Email marketing software" icinde
GetResponse, Constant Contact, Benchmark Email.

BORU HATTI: kategori uyeleri -> gurultu elemesi -> Wikidata'dan resmi
site adresi -> tools/dogrula.py. Kaynagin isi aday uretmek, kapinin isi
elemek; olu urunun sitesi zaten acilmaz.

Kullanim: python3 tools/wikipedia_hasat.py > adaylar.json
"""
import json, re, sys, time
import urllib.parse, urllib.request

AJAN = {"User-Agent": "ToolCompareBot/1.0 (https://toolcompare.net; catalog research)"}

# Wikipedia kategorisi -> BIZIM kategorimiz.
# Kategori secimi elle yapiliyor cunku eslemenin dogrulugu, akran
# secimini ve tum karsilastirma sayfalarini belirliyor.
KATEGORILER = {
    "Category:Customer relationship management software": "CRM",
    "Category:Email marketing software": "Marketing",
    "Category:Marketing automation": "Marketing",
    "Category:Search engine optimization": "Marketing",
    "Category:Web analytics": "Marketing",
    "Category:Project management software": "Project Management",
    "Category:Issue tracking systems": "Project Management",
    "Category:Help desk software": "Customer Service",
    "Category:Web hosting": "Hosting",
    "Category:Cloud computing providers": "Hosting",
    "Category:Content delivery networks": "Hosting",
    "Category:Shopping cart software": "E-commerce",
    "Category:Online payment systems": "E-commerce",
    "Category:Payroll software": "HR Software",
    "Category:Human resource management software": "HR Software",
    "Category:Accounting software": "Finance Tools",
    "Category:Videotelephony": "Communication",
    "Category:Instant messaging clients": "Communication",
    "Category:Note-taking software": "Productivity",
    "Category:Password managers": "Productivity",
    "Category:File hosting services": "Productivity",
    "Category:Graphic software": "Design",
    "Category:Vector graphics editors": "Design",
    "Category:Video editing software": "Design",
    "Category:Web development software": "Developer Tools",
    "Category:Continuous integration": "Developer Tools",
    "Category:Database management systems": "Developer Tools",
    "Category:Version control systems": "Developer Tools",
    "Category:Application programming interfaces": "Developer Tools",
    "Category:Content management systems": "Developer Tools",
}

# Urun olmayan sayfalar. Kategoriler kavram ve liste makaleleri de
# iceriyor ("Comparison of CRM systems", "Project management software").
GURULTU = re.compile(
    r"^(comparison of|list of|history of|timeline of|outline of|index of)\b|"
    r"\((disambiguation|company|programming language|standard|protocol|term)\)$",
    re.I)

def api(sunucu, parametreler):
    url = f"https://{sunucu}/w/api.php?" + urllib.parse.urlencode(parametreler | {"format": "json"})
    istek = urllib.request.Request(url, headers=AJAN)
    return json.load(urllib.request.urlopen(istek, timeout=60))

def kategori_uyeleri(kategori):
    uyeler, devam = [], None
    while True:
        p = {"action": "query", "list": "categorymembers", "cmtitle": kategori,
             "cmlimit": "500", "cmtype": "page"}
        if devam:
            p["cmcontinue"] = devam
        d = api("en.wikipedia.org", p)
        uyeler += [m["title"] for m in d.get("query", {}).get("categorymembers", [])]
        devam = d.get("continue", {}).get("cmcontinue")
        if not devam:
            return uyeler

def resmi_siteler(basliklar):
    """Wikipedia basligindan Wikidata'daki resmi siteye (P856)."""
    sonuc = {}
    for i in range(0, len(basliklar), 45):
        parca = basliklar[i:i + 45]
        try:
            d = api("www.wikidata.org", {"action": "wbgetentities", "sites": "enwiki",
                                         "titles": "|".join(parca), "props": "claims|sitelinks"})
        except Exception:
            continue
        for varlik in (d.get("entities") or {}).values():
            if "missing" in varlik:
                continue
            baslik = (varlik.get("sitelinks", {}).get("enwiki", {}) or {}).get("title")
            iddialar = varlik.get("claims", {}).get("P856") or []
            for c in iddialar:
                deger = (c.get("mainsnak", {}).get("datavalue", {}) or {}).get("value")
                if baslik and isinstance(deger, str) and deger.startswith("https://"):
                    sonuc.setdefault(baslik, deger)
                    break
        time.sleep(0.2)
    return sonuc

def slugla(ad):
    ad = re.sub(r"\s*\((software|company|platform|service|app|website)\)$", "", ad, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "-", ad.lower()).strip("-")[:48]

def main():
    gorulen_alan, gorulen_slug = set(), set()
    adaylar = []
    toplam_uye = 0

    for kategori, bizim in KATEGORILER.items():
        try:
            uyeler = kategori_uyeleri(kategori)
        except Exception as e:
            print(f"  {kategori}: {type(e).__name__}", file=sys.stderr)
            continue
        temiz = [u for u in uyeler if not GURULTU.search(u)]
        toplam_uye += len(uyeler)
        siteler = resmi_siteler(temiz)
        print(f"  {kategori:58} {len(uyeler):4} uye -> {len(siteler):3} sitesi olan",
              file=sys.stderr)

        for baslik, site in siteler.items():
            alan = urllib.parse.urlparse(site).netloc.lower()
            if alan.startswith("www."):
                alan = alan[4:]
            if alan in gorulen_alan:
                continue
            ad = re.sub(r"\s*\((software|company|platform|service|app|website)\)$", "",
                        baslik, flags=re.I).strip()
            sl = slugla(ad)
            if not sl or sl in gorulen_slug:
                continue
            gorulen_alan.add(alan); gorulen_slug.add(sl)
            adaylar.append({"slug": sl, "name": ad, "category": bizim,
                            "shortDescription": "", "websiteUrl": site})

    print(f"toplam kategori uyesi {toplam_uye} -> aday {len(adaylar)}", file=sys.stderr)
    json.dump(adaylar, sys.stdout, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
