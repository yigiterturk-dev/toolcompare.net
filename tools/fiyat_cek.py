"""Saticinin kendi fiyat sayfasindan baslangic fiyati ONERIR.

DIKKAT -- BU BETIK VERIYI YAZMAZ. Onerir, insan onaylar.
Sebebi bugunun dersi: dogrulanmamis bir sayiyi otomatik yazmak, tam da
temizledigimiz seyin makineyle yapilan hali olurdu. Fiyat sayfalari
bolgeye, para birimine, yillik/aylik secimine ve JavaScript'e gore
degisiyor; buradan cikan rakam KANIT DEGIL, IPUCU.

Cikti her satirda ipucunun nereden geldigini gosterir ki insan
saniyeler icinde dogru mu diye bakabilsin.
"""
import json, re, sys, html
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

AJAN = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# Denenecek fiyat sayfasi yollari, sirayla.
YOLLAR = ["/pricing", "/plans", "/pricing/", "/price", "/pricing-plans", ""]

FIYAT = re.compile(r"\$\s?(\d{1,4}(?:\.\d{2})?)\s*(?:/|\s|per\b)", re.I)

class Yonlendirmeci(urllib.request.HTTPRedirectHandler):
    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_301(req, fp, 301, msg, headers)
ACICI = urllib.request.build_opener(Yonlendirmeci)

def cek(url, sn=15):
    istek = urllib.request.Request(url, headers={"User-Agent": AJAN,
                                                 "Accept": "text/html"})
    with ACICI.open(istek, timeout=sn) as r:
        return r.geturl(), r.read(600_000).decode("utf-8", "ignore")

def taban(url):
    m = re.match(r"(https://[^/]+)", url)
    return m.group(1) if m else url

def oner(arac):
    ad, site = arac["name"], arac["websiteUrl"]
    for yol in YOLLAR:
        try:
            son, sayfa = cek(taban(site) + yol)
        except Exception:
            continue
        metin = html.unescape(re.sub(r"<(script|style).*?</\1>", " ", sayfa, flags=re.S))
        metin = re.sub(r"<[^>]+>", " ", metin)
        bulunanlar = [float(x) for x in FIYAT.findall(metin)]
        # 0 ve absurd degerleri at; en dusugu "baslangic fiyati" adayidir
        makul = sorted({x for x in bulunanlar if 1 <= x <= 2000})
        if makul:
            return {"slug": arac["slug"], "name": ad, "kaynak": son,
                    "ipucu": makul[0], "sayfada_gorulen": makul[:6]}
    return {"slug": arac["slug"], "name": ad, "kaynak": None,
            "ipucu": None, "sayfada_gorulen": []}

def main():
    araclar = json.load(open("src/data/tools.json", encoding="utf-8"))
    hedef = [t for t in araclar
             if not t.get("fiyatModeli") and (t.get("basePrice") or 0) == 0]
    if len(sys.argv) > 1:
        hedef = hedef[:int(sys.argv[1])]

    print(f"fiyati dogrulanmamis {len(hedef)} arac icin fiyat sayfasi taraniyor...",
          file=sys.stderr)

    sonuc = []
    with ThreadPoolExecutor(max_workers=8) as h:
        for r in h.map(oner, hedef):
            sonuc.append(r)

    bulunan = [r for r in sonuc if r["ipucu"] is not None]
    print(f"ipucu bulunan: {len(bulunan)}/{len(hedef)}", file=sys.stderr)
    json.dump(sonuc, sys.stdout, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
