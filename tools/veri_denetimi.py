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
from collections import Counter, defaultdict

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

# 7) AYNI URUNUN IKI KAYDI.
#    Bulundu (2026-08-24): "Render" ve "Render Hosting", "Railway" ve
#    "Railway Hosting", "Supabase" ve "Supabase Platform" ayni urundu.
#    Ayrica baska urunlerin FIYAT KADEMESI ya da OZELLIGI ayri arac gibi
#    listelenmisti (Todoist Pro, Shopify Plus, Notion AI, Loom AI,
#    Zapier Interfaces...). Ayni urunu iki kez listelemek katalogu sisirir
#    ve birbirinin kopyasi karsilastirma sayfalari uretir
#    ("Render vs Render Hosting"). 22 kayit silindi.
#
#    KURAL: ayri satin alinabilen, ayri markali urun kalir; bir urunun
#    kademesi veya ozelligi olan kayit kalmaz. Ayni alan adina isaret eden
#    kayitlar burada UYARI olarak listelenir -- otomatik silinmez, cunku
#    GitHub/GitHub Copilot gibi mesru ciftler de var.
import urllib.parse
alanlar = defaultdict(list)
for t in araclar:
    if not t.get("websiteUrl"):
        continue
    a = urllib.parse.urlparse(t["websiteUrl"]).netloc.lower()
    if a.startswith("www."):
        a = a[4:]
    alanlar[a].append(t["slug"])
coklu = {a: s for a, s in alanlar.items() if len(s) > 1}
if coklu:
    ozet = "; ".join(f"{a}: {','.join(s)}" for a, s in sorted(coklu.items())[:6])
    bulgular.append(("UYARI", f"{len(coklu)} alan adinda birden fazla kayit (ayni urun olabilir) -> {ozet}"))

print(f"denetlenen arac: {len(araclar)}")
if not bulgular:
    print("BULGU YOK -- veri temiz")
else:
    for seviye, mesaj in bulgular:
        print(f"  [{seviye}] {mesaj}")

sys.exit(1 if any(s == "KRITIK" for s, _ in bulgular) else 0)
