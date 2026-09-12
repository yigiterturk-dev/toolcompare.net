import { fiyatDurumu, kontrolTarihi, type Arac as FiyatArac } from "./fiyat.ts";
import { merdiven, ilkUcretliBasamak, type MerdivenliArac } from "./plan.ts";

/**
 * Arama sonucunda aciklamanin kesilmedigi pratik ust sinir. Google piksel
 * olcer, karakter degil; 158 guvenli tarafta kalir.
 */
export const ACIKLAMA_UST_SINIR = 158;

type Arac = FiyatArac & {
  name: string;
  shortDescription?: string | null;
  verdict?: string | null;
  incelendi?: boolean;
};

/** Fiyat cumlesi yalnizca DOGRULANMIS bir fiyat varsa kurulur. */
function fiyatIfadesi(t: Arac): string | null {
  const d = fiyatDurumu(t);
  if (!d.kisa) return null;
  const belirsiz = /not verified|tbc/i.test(d.kisa);
  return belirsiz ? null : d.kisa;
}

function kirp(metin: string, sinir = ACIKLAMA_UST_SINIR): string {
  const tek = metin.replace(/\s+/g, " ").trim();
  if (tek.length <= sinir) return tek;
  const kesik = tek.slice(0, sinir - 1);
  const bosluk = kesik.lastIndexOf(" ");
  return `${(bosluk > 40 ? kesik.slice(0, bosluk) : kesik).replace(/[.,;:\s]+$/, "")}…`;
}

/**
 * Sayfa aciklamasi. Once bunun yerine tool.shortDescription tek basina
 * kullaniliyordu; katalogdaki 460 incelemenin 328'inde bu alan 60
 * karakterden kisa ("Universal database client.") oldugu icin arama
 * sonucunda satirin yarisi bos kaliyordu. Elimizde zaten dogrulanmis
 * fiyat ve yazilmis hukum var; aciklama bunlardan kuruluyor.
 */
export function metaAciklamasi(t: Arac): string {
  const kisa = (t.shortDescription ?? "").trim();
  const incelendi = Boolean(t.incelendi ?? t.verdict);

  if (!incelendi) {
    const bas = kisa || `${t.name}.`;
    return kirp(
      `${bas} What it costs to start and the closest alternatives we track — we have not published a full review of ${t.name} yet.`,
    );
  }

  const fiyat = fiyatIfadesi(t);
  const parcalar = [
    kisa || `${t.name} reviewed for 2026.`,
    fiyat ? `${fiyat}.` : null,
    (t.verdict ?? "").trim() || null,
  ].filter(Boolean) as string[];

  return kirp(parcalar.join(" "));
}

/**
 * Kategori sayfasi basligi. Once sablon kosulsuz " Tools" ekliyordu;
 * katalogdaki 14 kategorinin 4'u zaten "Tools" ile bittigi icin arama
 * sonucunda "Developer Tools Tools in 2026" yaziyordu. Ad zaten bir
 * urun kelimesiyle bitiyorsa ikincisi eklenmez.
 */
export function kategoriBasligi(ad: string, adet: number): string {
  const bitiyor = /\b(tools?|software|platforms?|apps?)$/i.test(ad.trim());
  const govde = bitiyor ? ad.trim() : `${ad.trim()} Tools`;
  return `${govde} in 2026: ${adet} Compared by Price`;
}

/**
 * KARSILASTIRMA SAYFASININ ACIKLAMASI.
 *
 * NEDEN (GSC, 2026-09-13): 1.320 cift sayfasinin hepsi ayni cumleyi
 * yayinliyordu -- "Compare X and Y side-by-side: verified pricing,
 * documented features, trade-offs...". Olculdu: /compare 1.593 gosterim
 * aliyor ve 4-25. sirada duran 350 gosterimde TEK tik yok. Siralama
 * yeterince iyi oldugu halde tiklanmiyorsa sorun siralama degil,
 * sonucun kendisi: sablon aciklama okura bu iki arac hakkinda hicbir sey
 * soylemiyor. Aciklama artik O CIFTE ozgu, dogrulanmis rakamdan kurulur.
 *
 * KURAL: uydurma yok. Bir taraf icin dogrulanmis rakam yoksa o taraf
 * hakkinda fiyat cumlesi KURULMAZ; cumle kisalir, tahmin edilmez.
 */
export function ciftMetaAciklamasi(a: CiftArac, b: CiftArac): string {
  const parcalar: string[] = [];

  const fa = baslangic(a);
  const fb = baslangic(b);
  const fiyatCumlesi = ikiliFiyatCumlesi(a, fa, b, fb);
  if (fiyatCumlesi) parcalar.push(fiyatCumlesi);

  /* Ucretsiz katman yalnizca AYRIM ise yazilir. Ikisinde de varsa (ya da
     ikisinde de yoksa) bu cumle yer kaplar, ayirt etmez. */
  const ua = ucretsizKatmani(a);
  const ub = ucretsizKatmani(b);
  /* Fiyat cumlesi zaten "Dashlane: Free tier" dediyse ayni bilgiyi
     "Only Dashlane has a free tier" diye tekrar etmek satiri doldurur,
     okura yeni bir sey soylemez. */
  const ucretsizZatenYazildi = /free tier/i.test(fiyatCumlesi ?? "");
  if (ua !== ub && !ucretsizZatenYazildi) parcalar.push(`Only ${(ua ? a : b).name} has a free tier.`);

  /* Fiyat hic yoksa sayfanin soyleyecegi sey hala var: iki aracin ne
     oldugu. Sablon cumle yerine ikisinin kendi tanimi yazilir. */
  if (parcalar.length === 0) {
    const ta = (a.shortDescription ?? "").trim();
    const tb = (b.shortDescription ?? "").trim();
    if (ta && tb) parcalar.push(`${a.name}: ${ta} ${b.name}: ${tb}`);
    else parcalar.push(`${a.name} vs ${b.name}: what each one costs, where they differ and who each one fits.`);
  }

  /* Tarih iddiasi en ESKI dogrulamadan kurulur: iki taraftan biri eski
     ise sayfanin tamami o kadar tazedir. */
  const tarih = enEskiKontrol(a, b);
  if (tarih) parcalar.push(`Prices checked ${tarih}.`);

  /*
    KISA KALAN SATIR YER ISRAFIDIR. Arama sonucu ~158 karakter gosteriyor;
    yalnizca fiyat cumlesinden ibaret aciklamalarin 563'u 70 karakterin
    altinda kaliyordu, yani satirin yarisindan fazlasi bostu. Kalan yere
    SABLON degil, iki aracin kendi tanimi konur -- her cift icin farkli ve
    okurun aradigi ayrimin ta kendisi.
  */
  const govde = parcalar.join(" ");
  if (govde.length < 100) {
    const ek = tanimCumlesi(a, b, ACIKLAMA_UST_SINIR - govde.length - 1);
    if (ek) return kirp(`${govde} ${ek}`);
  }
  return kirp(govde);
}

type CiftArac = Arac & MerdivenliArac;

/**
 * Bir aracin fiyat durumu, aciklamada kullanilabilecek iki ayri bicimde.
 *
 * `rakam` yalnizca SAYISAL bir baslangic fiyati varsa dolar. Once
 * merdivenin ilk ucretli basamagi denenir: o rakam saticinin fiyat
 * sayfasindan okunmus bir cumleyle (`kaynakSatiri`) birlikte geliyor.
 * Deponun kurali bu -- KAYNAGINI GOSTEREBILEN RAKAM KAZANIR (bkz.
 * compare.ts/farkCumlesi). `fiyatDurumu` merdivene yalnizca `basePrice`
 * de doluysa bakiyor; ucretsiz katmanli araclarda (DBeaver gibi
 * basePrice 0) merdiven orada gorunmez oluyordu.
 *
 * `etiket` ise rakam OLMAYAN ama bilinen durumdur ("Quote only",
 * "Variable", "Usage-based"). Ayrim onemli: bunlari rakam yerine koyup
 * "starts at Quote only" yazmak hem yanlis hem okunmaz -- ilk yazimda
 * tam bu olmustu. Fiyati bilinmeyen arac ise ikisini de bos birakir.
 */
function baslangic(t: CiftArac): { rakam: string | null; etiket: string | null } {
  const basamak = ilkUcretliBasamak(t);
  if (basamak) {
    const birim = basamak.birim === "kisi-basina" ? "/user/mo" : "/mo";
    return { rakam: `$${basamak.aylik.toLocaleString("en-US")}${birim}`, etiket: null };
  }
  const d = fiyatDurumu(t);
  const kisa = fiyatIfadesi(t);
  if (!kisa) return { rakam: null, etiket: null };
  return d.karsilastirilabilir ? { rakam: kisa, etiket: null } : { rakam: null, etiket: kisa };
}

type Baslangic = { rakam: string | null; etiket: string | null };

function ikiliFiyatCumlesi(a: CiftArac, fa: Baslangic, b: CiftArac, fb: Baslangic): string | null {
  if (fa.rakam && fb.rakam) return `${a.name} starts at ${fa.rakam}, ${b.name} at ${fb.rakam}.`;
  if (fa.rakam) return `${a.name} starts at ${fa.rakam}; ${b.name}: ${fb.etiket ?? "no published price"}.`;
  if (fb.rakam) return `${b.name} starts at ${fb.rakam}; ${a.name}: ${fa.etiket ?? "no published price"}.`;
  /* Ikisinde de rakam yok ama durumlari FARKLIYSA bu da bir ayrim. */
  if (fa.etiket && fb.etiket && fa.etiket !== fb.etiket) {
    return `Neither publishes a flat rate — ${a.name}: ${fa.etiket}, ${b.name}: ${fb.etiket}.`;
  }
  if (fa.etiket && fa.etiket === fb.etiket) {
    return `Neither publishes a flat rate — both are ${fa.etiket.toLowerCase()}.`;
  }
  return null;
}

/*
  UCRETSIZ KATMAN IKI YERDEN OKUNUR. Yalnizca merdivene bakmak olculmus
  bir CELISKI uretiyordu: discord-vs-slack aciklamasi ayni cumlede
  "Discord: Free tier" deyip hemen ardindan "Only Slack has a free tier"
  diyordu -- cunku Discord'un merdiveni yok, ucretsiz katmani ise
  `fiyatModeli` alaninda yaziyor. Ayni sayfada iki karsit iddia, bu
  sitenin tek varligi olan seyi -- dogrulugu -- eder.
*/
function ucretsizKatmani(t: CiftArac): boolean {
  if (merdiven(t).some((p) => p.aylik === 0)) return true;
  return t.fiyatModeli === "bedava" || t.fiyatModeli === "ucretsiz-katman";
}

function enEskiKontrol(a: CiftArac, b: CiftArac): string | null {
  const tarihler = [kontrolTarihi(a), kontrolTarihi(b)].filter(Boolean) as string[];
  if (tarihler.length === 0) return null;
  return tarihler.sort()[0];
}

/** Iki aracin kendi tanimi -- yalnizca ayrilan yere sigiyorsa. */
function tanimCumlesi(a: CiftArac, b: CiftArac, yer: number): string | null {
  const ta = (a.shortDescription ?? "").trim();
  const tb = (b.shortDescription ?? "").trim();
  if (!ta || !tb) return null;
  const cumle = `${a.name}: ${nokta(ta)} ${b.name}: ${nokta(tb)}`;
  return cumle.length <= yer ? cumle : null;
}

function nokta(m: string): string {
  return /[.!?]$/.test(m) ? m : `${m}.`;
}
