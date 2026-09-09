/**
 * GSC baglantisini dener: kimlik var mi, servis hesabi hangi mulklere
 * erisebiliyor, hedef mulk listede mi. Hicbir sey yazmaz, sadece rapor eder.
 *
 * Kurulumda hatanin %90'i kodda degil yetkide olur; bu script ikisini ayirir.
 */
import "./env.ts";
import { fetchSearchRows, isGscConfigured, listSites, summarizeByPage } from "../src/lib/gsc.ts";

async function main() {
  if (!isGscConfigured()) {
    console.log("⛔ GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY / GSC_SITE_URL tanimli degil (.env.local)");
    return;
  }
  console.log(`hedef mulk: ${process.env.GSC_SITE_URL}`);

  const sites = await listSites();
  if (!sites.length) {
    console.log("⛔ Servis hesabi hicbir mulke erisemiyor.");
    console.log("   Search Console > Ayarlar > Kullanicilar ve izinler > kullanici ekle:");
    // Servis hesabi adresi maskelenir: bu cikti oturum dokumune dusuyor.
    const sa = process.env.GSC_CLIENT_EMAIL ?? "";
    const [saAd, saAlan] = sa.split("@");
    console.log(`   ${saAd ? `${saAd.slice(0, 4)}${"*".repeat(Math.max(1, saAd.length - 4))}@${saAlan ?? ""}` : "(GSC_CLIENT_EMAIL yok)"}  (tam adres .env'de)`);
    return;
  }

  console.log(`\nerisilebilen mulkler (${sites.length}):`);
  for (const site of sites) console.log(`  ${site.permissionLevel.padEnd(12)} ${site.siteUrl}`);

  const hedef = sites.some((site) => site.siteUrl === process.env.GSC_SITE_URL);
  if (!hedef) {
    console.log("\n⛔ Hedef mulk listede yok. GSC_SITE_URL yanlis olabilir.");
    console.log("   Alan adi mulkunde bicim: sc-domain:toolcompare.net (https:// hali degil)");
    return;
  }

  const rows = await fetchSearchRows(28);
  const gosterim = rows.reduce((toplam, row) => toplam + row.impressions, 0);
  const tik = rows.reduce((toplam, row) => toplam + row.clicks, 0);
  console.log(`\n✅ baglanti calisiyor · son 28 gun: ${gosterim} gosterim / ${tik} tik / ${rows.length} satir`);

  const sayfalar = summarizeByPage(rows, 10);
  if (sayfalar.length) {
    console.log("\n--- en cok gosterim alan sayfalar ---");
    for (const sayfa of sayfalar) {
      console.log(`  ${String(sayfa.impressions).padStart(6)} gosterim ${String(sayfa.clicks).padStart(4)} tik  ${sayfa.page}`);
    }
  } else {
    console.log("\n(henuz veri yok — mulk yeni dogrulandiysa normal, 2-3 gun sonra dolar)");
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
