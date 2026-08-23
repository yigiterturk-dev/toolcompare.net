"""Sitemap'teki HER adresi tum olcutlerle denetler.

Iki olcum tuzagi bilerek kapatildi (ikisi de bu denetimde yanlis alarm uretti):
  - baslik uzunlugu HTML varliklari cozulerek olculur ('&amp;' 1 karakterdir)
  - 'undefined' yalnizca GORUNUR metinde aranir; Next.js RSC yuku script
    icinde '$undefined' gecirir ve her sayfayi yanlis isaretler
"""
import re, html, urllib.request
from collections import Counter

T = "http://localhost:3999"
sm = urllib.request.urlopen(T + "/sitemap.xml", timeout=30).read().decode()
adresler = [u.replace("https://toolcompare.net", "") or "/" for u in re.findall(r"<loc>([^<]+)", sm)]

sayac = Counter()
ornekler = {}

for yol in adresler:
    try:
        r = urllib.request.urlopen(T + yol, timeout=30)
        sayfa = r.read().decode("utf-8", "ignore")
    except Exception as e:
        sayac["acilmadi"] += 1; ornekler.setdefault("acilmadi", yol); continue

    bulgu = []
    n1 = len(re.findall(r"<h1[\s>]", sayfa))
    if n1 != 1: bulgu.append(f"H1 sayisi {n1}")
    if not re.search(r'name="description"', sayfa): bulgu.append("description yok")
    if not re.search(r'rel="canonical"', sayfa): bulgu.append("canonical yok")
    if not re.search(r'property="og:title"', sayfa): bulgu.append("og:title yok")
    if not re.search(r"<html[^>]+lang=", sayfa): bulgu.append("html lang yok")

    t = re.search(r"<title>(.*?)</title>", sayfa, re.S)
    if not t: bulgu.append("title yok")
    elif len(html.unescape(t.group(1))) > 65: bulgu.append("title >65")

    imgler = re.findall(r"<img\b[^>]*>", sayfa)
    if [i for i in imgler if "alt=" not in i]: bulgu.append("alt'siz gorsel")

    linkler = re.findall(r"(<a\b[^>]*>)(.*?)</a>", sayfa, re.S)
    if [a for a, ic in linkler if not re.sub(r"<[^>]+>", "", ic).strip()
        and "aria-label" not in a]: bulgu.append("adsiz link")

    sev = [int(m) for m in re.findall(r"<h([1-6])[\s>]", sayfa)]
    if any(b - a > 1 for a, b in zip(sev, sev[1:])): bulgu.append("baslik atlamasi")

    govde = re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>", "", sayfa, flags=re.S))
    if "undefined" in govde or "NaN" in govde: bulgu.append("gorunur undefined/NaN")

    for b in bulgu:
        sayac[b] += 1
        ornekler.setdefault(b, yol)

print(f"denetlenen adres: {len(adresler)}")
if not sayac:
    print("BULGU YOK -- tum sayfalar temiz")
else:
    for b, n in sayac.most_common():
        print(f"  {n:4}x  {b}   (ornek: {ornekler[b]})")
