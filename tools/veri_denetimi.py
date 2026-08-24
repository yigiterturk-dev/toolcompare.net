"""tools.json veri butunlugu denetimi.

NEDEN VAR (2026-08-24): sitede GERCEKTE VAR OLMAYAN alti arac
listeleniyordu (PayMaster Pro, VidSmart Pro, EditFlow Elite, ClipForge X,
SceneCraft, MetaMotion Studio). Hepsi /api/tools/generate ucunun urettigi
kayitlardi; ortak isaretleri satici linkinin OLMAMASIYDI.
Ayrica 121 aracin 108'inde link yoktu, yani /go/ para katmani satiya
degil Google aramasina gidiyordu.

Bu betik ayni seyin sessizce tekrar olmasini engeller.
"""
import json, re, sys
from collections import Counter

araclar = json.load(open("src/data/tools.json", encoding="utf-8"))
bulgular = []

# 1) Satici linki -- var olmayan arac uretiminin en guclu isareti
linksiz = [t["slug"] for t in araclar if not t.get("websiteUrl")]
if linksiz:
    bulgular.append(("KRITIK", f"{len(linksiz)} aracta websiteUrl yok: {linksiz[:8]}"))

# 2) Gecerli adres mi
bozuk = [t["slug"] for t in araclar
         if t.get("websiteUrl") and not re.match(r"^https://[^\s]+\.[^\s]+", t["websiteUrl"])]
if bozuk:
    bulgular.append(("KRITIK", f"{len(bozuk)} aracta gecersiz websiteUrl: {bozuk[:8]}"))

# 3) Tekrar eden slug
tekrar = [s for s, n in Counter(t["slug"] for t in araclar).items() if n > 1]
if tekrar:
    bulgular.append(("KRITIK", f"tekrar eden slug: {tekrar}"))

# 4) Zorunlu alanlar
for alan in ("name", "slug", "category", "shortDescription"):
    eksik = [t.get("slug", "?") for t in araclar if not t.get(alan)]
    if eksik:
        bulgular.append(("KRITIK", f"{len(eksik)} aracta '{alan}' yok: {eksik[:6]}"))

# 5) Kategori adi tutarliligi -- kucuk harfli kategoriler uretilmis
#    kayitlarin isaretiydi ("video editing", "payment gateway")
kucuk = sorted({t["category"] for t in araclar
                if t.get("category") and t["category"] != t["category"].strip()
                or (t.get("category") and t["category"][0].islower())})
if kucuk:
    bulgular.append(("UYARI", f"bicimi digerlerinden farkli kategori: {kucuk}"))

# 6) Fiyat modeli
from collections import defaultdict
modelsiz = [t["slug"] for t in araclar
            if not t.get("fiyatModeli") and (t.get("basePrice") or 0) == 0]
if modelsiz:
    bulgular.append(("UYARI", f"{len(modelsiz)} aracin fiyat modeli girilmemis: {modelsiz}"))

print(f"denetlenen arac: {len(araclar)}")
if not bulgular:
    print("BULGU YOK -- veri temiz")
else:
    for seviye, mesaj in bulgular:
        print(f"  [{seviye}] {mesaj}")

sys.exit(1 if any(s == "KRITIK" for s, _ in bulgular) else 0)
