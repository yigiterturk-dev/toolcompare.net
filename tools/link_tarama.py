"""Siteyi anasayfadan gezerek TUM ic linkleri dener.

Uc soruya cevap verir:
  1. Kirik ic link var mi? (404/500 donen)
  2. Oksuz sayfa var mi? (sitemap'te olup hicbir sayfadan link almayan --
     Google bunu "onemsiz" sayar)
  3. Sitemap'te olmayan ama linklenen sayfa var mi? (gizli kalmis sayfa)
"""
import re, sys, urllib.request
from collections import deque, defaultdict

T = "http://localhost:3999"
ATLA = ("/go/", "/_next/")  # dis yonlendirme + derleme ciktilari
# Sayfa olmayan dosyalar: sitemap'te aranmamali.
VARLIK = re.compile(r"\.(js|css|woff2?|png|jpe?g|svg|ico|webp|txt|xml|json)$", re.I)

def cek(yol):
    r = urllib.request.urlopen(T + yol, timeout=30)
    return r.getcode(), r.read().decode("utf-8", "ignore")

# sitemap
sm = urllib.request.urlopen(T + "/sitemap.xml", timeout=30).read().decode()
sitemapte = {u.replace("https://toolcompare.net", "") or "/" for u in re.findall(r"<loc>([^<]+)", sm)}

gorulen = {"/"}
kuyruk = deque(["/"])
durum = {}
gelen_link = defaultdict(set)   # hedef -> kaynak sayfalar
kirik = []
noindexli = set()

while kuyruk:
    yol = kuyruk.popleft()
    try:
        kod, html = cek(yol)
    except Exception as e:
        kod, html = 0, ""
        kirik.append((yol, str(e)[:50], sorted(gelen_link[yol])[:2]))
    durum[yol] = kod
    if kod != 200:
        if not any(k[0] == yol for k in kirik):
            kirik.append((yol, kod, sorted(gelen_link[yol])[:2]))
        continue

    # noindex sayfalar sitemap'te olmayabilir; bu bilincli bir karar.
    if re.search(r'name="robots"[^>]*content="[^"]*noindex', html):
        noindexli.add(yol)

    for ham in re.findall(r'href="([^"]+)"', html):
        if not ham.startswith("/") or ham.startswith("//"):
            continue
        hedef = ham.split("#")[0].split("?")[0]
        if not hedef or hedef.startswith(ATLA):
            continue
        gelen_link[hedef].add(yol)
        if hedef not in gorulen:
            gorulen.add(hedef)
            kuyruk.append(hedef)

print(f"gezilen sayfa: {len(durum)}")
print(f"sitemap'teki adres: {len(sitemapte)}")

print(f"\n1) KIRIK IC LINK: {len(kirik)}")
for yol, kod, kaynak in kirik[:15]:
    print(f"   {kod}  {yol}   <- {kaynak}")

oksuz = sorted(a for a in sitemapte if not gelen_link.get(a) and a != "/")
print(f"\n2) OKSUZ SAYFA (sitemap'te ama link almiyor): {len(oksuz)}")
for a in oksuz[:15]: print("   ", a)

gizli = sorted(a for a, k in durum.items()
               if k == 200 and a not in sitemapte and not VARLIK.search(a)
               and a not in noindexli)
print(f"\n3) LINKLENEN AMA SITEMAP'TE OLMAYAN: {len(gizli)}   (noindex olan {len(noindexli)} sayfa haric)")
for a in gizli[:15]: print("   ", a)

sys.exit(0)
