# ToolCompare Dış Bağlantı Paketi

On-page bitti. Kalan tek kaldıraç dış bağlantı ve o elle yapılan bir iş.
Bu klasördeki 3 dosya, o işin tamamı.

| Dosya | Ne işe yarar |
|---|---|
| `satici-listesi.csv` | 512 satıcı, GSC gösterimine göre sıralı. En üsttekilerden başla. |
| `sablonlar.md` | 5 hazır mesaj: satıcı maili, takip, karşılaştırma bildirimi, Reddit, blog yazarı. |
| `dizin-basvurusu.md` | Dizin formları için standart metin + 20 dizinlik 4 haftalık sıra. |

## Sıra

**Hafta 1-4, her gün ~30 dk:**
- 5 satıcı maili (CSV'nin en üstünden aşağı, `durum` sütununu doldur)
- 1 dizin başvurusu
- Haftada 3 Reddit/HN cevabı

**Neden CSV bu sırada:** en üsttekiler (Cloudflare, Photopea, SpyFu, DBeaver,
Zoho CRM, Netlify…) zaten Google'da gösterim alan sayfalar. Onların linki iki
kat değerli — hem otorite hem zaten kıpırdayan sayfaya gidiyor.

**`iletisim_dene_*` ve `tahmini_mail` sütunları TAHMİN.** Önce satıcının
sitesinde /press, /partners, /about, /contact'a bak; gerçek adresi bulunca
CSV'ye yaz. Tahmini adrese körlemesine gönderme, bounce oranı hesabını yakar.

## Ölçüm — 6 hafta sonra tek kontrol

```
npm run gsc:senkron && npm run gsc:firsat
```
8-25. sırada sorgu çıktı mı? Çıktıysa devam. Çıkmadıysa problem link değil,
niyet uyumsuzluğu — o zaman sayfa tipine dönülecek.

⚠️ Beklenti: ilk kıpırdama 6-10 hafta. 2 haftada bir şey görmemek normal.
