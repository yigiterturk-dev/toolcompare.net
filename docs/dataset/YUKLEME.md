# Veri seti yükleme — 3 platform (her biri ~10 dk)

Paket: bu klasör. Yenilemek için `npm run veri:paket`. Amaç: her platformda
toolcompare.net/data'ya kalıcı kaynak linki.

## 1. Hugging Face (en kolay)
1. huggingface.co → hesap aç → New → Dataset → ad: `saas-pricing-verified`, lisans CC-BY-4.0, Public.
2. "Files" → Upload: `README.md` + `toolcompare-saas-pricing.csv` (+ json). README zaten dataset card.

## 2. Kaggle
1. kaggle.com → hesap → Datasets → New Dataset → `toolcompare-saas-pricing.csv` yükle.
2. Başlık / alt başlık / açıklama: `dataset-metadata.json` içinden kopyala. Lisans: CC BY 4.0.
   (CLI kullanırsan `id` alanındaki REPLACE_WITH_KAGGLE_USERNAME'i değiştir, `kaggle datasets create -p docs/dataset`.)

## 3. data.world
1. data.world → hesap → Create dataset → CSV + README yükle, lisans CC-BY.

Hesabı sen aç ve giriş yap; formları Chrome'dan ben doldururum, "gönder"i sana sorarak.
