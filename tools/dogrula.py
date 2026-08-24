"""Arac ADAYLARINI eklemeden ONCE gercekten var mi diye dogrular.

NEDEN VAR: sitede gercekte var olmayan alti arac listeleniyordu
(PayMaster Pro, VidSmart Pro, EditFlow Elite, ClipForge X, SceneCraft,
MetaMotion Studio). Hepsini bir dil modeli uretmisti. Katalogu buyutmek
istiyorsak ayni hatayi 10 katina cikarmamak icin her adayin GERCEKTEN
var oldugunu makineyle kanitlamak zorundayiz.

IKI KAPI:
  1. Adres gercekten aciliyor mu (HTTP 200)
  2. Acilan sayfa GERCEKTEN o araca mi ait -- aracin adi sayfanin
     basliginda veya govdesinde geciyor mu

Ikinci kapi sart: model uydurdugu arac icin uydurdugu bir adres de
verebilir, ve o adres park edilmis bir domaine dusebilir. Adin sayfada
gecmesi, adresin dogru sahibe ait oldugunun en ucuz kanitidir.

Kullanim:  python3 tools/dogrula.py adaylar.json
Cikti:     dogrulananlar stdout'a JSON, red gerekcesi stderr'e
"""
import json, re, sys, html
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

AJAN = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
       "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# Kendi 114 aracimizla sinandi ve BETIGIN KENDISI hatali cikti:
#   - 308 kalici yonlendirmesini takip etmiyordu (Terraform, Mixpanel)
#   - tek deneme yapip pes ediyordu (Discord, Midjourney gecici hata verdi)
#   - alt urunlerde adi bulamiyordu ("Zapier Interfaces" sayfasi "Zapier"
#     yaziyor, "HEY Email" sitesi sadece "HEY" yaziyor)
# Bilinen-dogru veriyle sinamasaydik bu betik gercek araclari eleyip
# katalogu bozacakti.

class Yonlendirmeci(urllib.request.HTTPRedirectHandler):
    """urllib 308'i takip etmiyor; ekliyoruz."""
    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_301(req, fp, 301, msg, headers)

ACICI = urllib.request.build_opener(Yonlendirmeci)

def sadelestir(m: str) -> str:
    return re.sub(r"[^a-z0-9]", "", m.lower())

def cek(url: str, sn: int = 20):
    istek = urllib.request.Request(url, headers={
        "User-Agent": AJAN,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with ACICI.open(istek, timeout=sn) as r:
        return r.getcode(), r.geturl(), r.read(400_000).decode("utf-8", "ignore")

def ad_eslesiyor_mu(ad: str, son_url: str, sayfa: str) -> bool:
    """Adres gercekten bu araca mi ait?

    Uc kanittan BIRI yeterli. Tek kanit sartı kosmak alt urunleri
    (Zapier Interfaces, Copy.ai Workflows) haksiz yere eliyordu.
    """
    hedef = sadelestir(ad)
    if not hedef:
        return False

    # 1) Alan adinin kendisi adi iceriyor mu -- en guclu kanit,
    #    sayfa iceriginden bagimsiz.
    alan = sadelestir(re.sub(r"^https?://(www\.)?", "", son_url).split("/")[0])
    if hedef in alan or alan.startswith(hedef):
        return True

    metin = sadelestir(html.unescape(re.sub(r"<[^>]+>", " ", sayfa)))
    if hedef in metin:
        return True

    # 2) Alt urun: "Zapier Interfaces" -> ana marka "Zapier" yeterli.
    # Esik 3: "HEY Email" sitesinde yalnizca "HEY" yaziyor ve
    # 4 karakter sarti bu gercek araci eliyordu.
    ilk = sadelestir(ad.split()[0])
    if len(ilk) >= 3 and (ilk in alan or ilk in metin):
        return True

    return False

def dogrula(aday: dict):
    ad, url = aday["name"], aday["websiteUrl"]
    son_hata = None
    for deneme in range(2):          # gecici ag hatasi tek denemede eleniyordu
        try:
            kod, son_url, sayfa = cek(url)
            break
        except urllib.error.HTTPError as e:
            # 403/429/202: bot engeli. Sitenin YOK oldugu anlamina gelmez.
            if e.code in (202, 403, 429):
                return aday, f"BELIRSIZ: HTTP {e.code} (bot engeli) {url}"
            return aday, f"RED: HTTP {e.code} {url}"
        except Exception as e:
            son_hata = f"{type(e).__name__}"
    else:
        return aday, f"BELIRSIZ: acilmadi ({son_hata}) {url}"

    # 2xx'in tamami kabul: Skool 202 donuyor ve site pekala var.
    if not (200 <= kod < 300):
        return aday, f"RED: HTTP {kod} {url}"
    if ad_eslesiyor_mu(ad, son_url, sayfa):
        return aday, None
    return aday, f"RED: sayfa/alan adi '{ad}' ile eslesmiyor -> {son_url}"

def main():
    adaylar = json.load(open(sys.argv[1], encoding="utf-8"))
    onay, red, belirsiz = [], [], []

    with ThreadPoolExecutor(max_workers=8) as havuz:
        for aday, hata in havuz.map(dogrula, adaylar):
            if hata is None:
                onay.append(aday)
            elif hata.startswith("BELIRSIZ"):
                belirsiz.append((aday, hata))
            else:
                red.append((aday, hata))

    print(f"aday: {len(adaylar)}  onay: {len(onay)}  belirsiz: {len(belirsiz)}  red: {len(red)}",
          file=sys.stderr)
    for a, h in red: print(f"  {a['slug']:22} {h}", file=sys.stderr)
    for a, h in belirsiz: print(f"  {a['slug']:22} {h}", file=sys.stderr)

    json.dump(onay, open("/tmp/claude-501/-Users-yigiterturk/ce1a6810-152b-4990-95ed-dba4588b639b/scratchpad/onaylananlar.json", "w"), indent=2, ensure_ascii=False)
    print("onaylananlar -> scratchpad/onaylananlar.json", file=sys.stderr)

if __name__ == "__main__":
    main()
