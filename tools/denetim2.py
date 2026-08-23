"""Ikinci tur denetim: icerik tekrari, yapilandirilmis veri, mobil.

denetim.py sayfa BASINA bakiyor; bu betik sayfalar ARASI iliskilere
bakiyor -- ayni basligin 40 sayfada tekrar etmesi tek sayfaya bakarak
gorulemez.
"""
import re, html, json, urllib.request
from collections import Counter, defaultdict

T = "http://localhost:3999"
sm = urllib.request.urlopen(T + "/sitemap.xml", timeout=30).read().decode()
adresler = [u.replace("https://toolcompare.net", "") or "/" for u in re.findall(r"<loc>([^<]+)", sm)]

basliklar, aciklamalar = defaultdict(list), defaultdict(list)
jsonld = Counter()
viewportsuz, ldbozuk, incel = [], [], []

def tip(y):
    if y == "/": return "anasayfa"
    return "/" + y.split("/")[1]

for yol in adresler:
    s = urllib.request.urlopen(T + yol, timeout=30).read().decode("utf-8", "ignore")

    t = re.search(r"<title>(.*?)</title>", s, re.S)
    if t: basliklar[html.unescape(t.group(1))].append(yol)
    d = re.search(r'name="description" content="(.*?)"', s, re.S)
    if d: aciklamalar[html.unescape(d.group(1))].append(yol)

    if not re.search(r'name="viewport"', s): viewportsuz.append(yol)

    bloklar = re.findall(r'type="application/ld\+json"[^>]*>(.*?)</script>', s, re.S)
    if bloklar:
        jsonld[tip(yol)] += 1
        for b in bloklar:
            try: json.loads(b)
            except Exception: ldbozuk.append(yol)

    govde = re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style).*?</\1>", "", s, flags=re.S))
    kelime = len(re.sub(r"\s+", " ", govde).split())
    if kelime < 200: incel.append((yol, kelime))

print(f"denetlenen: {len(adresler)}\n")

yb = {k: v for k, v in basliklar.items() if len(v) > 1}
print(f"1) YINELENEN BASLIK: {len(yb)} farkli baslik")
for k, v in sorted(yb.items(), key=lambda x: -len(x[1]))[:5]:
    print(f"   {len(v):3}x  {k[:60]}   ornek: {v[0]}")

ya = {k: v for k, v in aciklamalar.items() if len(v) > 1}
print(f"\n2) YINELENEN ACIKLAMA: {len(ya)} farkli aciklama")
for k, v in sorted(ya.items(), key=lambda x: -len(x[1]))[:5]:
    print(f"   {len(v):3}x  {k[:60]}   ornek: {v[0]}")

print(f"\n3) YAPILANDIRILMIS VERI (JSON-LD) olan sayfa tipleri:")
sayim = Counter(tip(y) for y in adresler)
for t2, n in sayim.most_common():
    print(f"   {t2:16} {jsonld.get(t2,0):4}/{n:<4} sayfada var")
print(f"   bozuk JSON-LD: {len(ldbozuk)}")

print(f"\n4) VIEWPORT ETIKETI OLMAYAN: {len(viewportsuz)}")
print(f"\n5) 200 KELIMEDEN AZ ICERIK: {len(incel)}")
for y, k in sorted(incel, key=lambda x: x[1])[:8]: print(f"   {k:4} kelime  {y}")
