import test from "node:test";
import assert from "node:assert/strict";
import {
  girisDenemesiKaldiMi,
  basarisizGirisiSay,
  girisSayaciniSifirla,
  basarisizGirisSayisi,
} from "../src/lib/adminAuth.ts";

/*
  IP basina fren, sahte X-Forwarded-For ile asilabiliyor. Bu testler
  kaynaktan BAGIMSIZ tavanin gercekten kestigini guvenceye aliyor.
*/
test("basarisiz denemeler sayiliyor", () => {
  girisSayaciniSifirla();
  assert.equal(basarisizGirisSayisi(), 0);
  basarisizGirisiSay();
  basarisizGirisiSay();
  assert.equal(basarisizGirisSayisi(), 2);
});

test("gunluk tavan dolunca deneme hakki bitiyor", () => {
  girisSayaciniSifirla();
  const tavan = Number(process.env.ADMIN_LOGIN_DAILY_LIMIT ?? 100);
  for (let i = 0; i < tavan; i++) {
    assert.equal(girisDenemesiKaldiMi(), true, `deneme ${i} kalmaliydi`);
    basarisizGirisiSay();
  }
  assert.equal(girisDenemesiKaldiMi(), false);
});

test("dogru parola sayaci sifirliyor -- gercek yonetici kendi tavanini yemiyor", () => {
  girisSayaciniSifirla();
  for (let i = 0; i < 50; i++) basarisizGirisiSay();
  assert.equal(basarisizGirisSayisi(), 50);
  girisSayaciniSifirla();
  assert.equal(basarisizGirisSayisi(), 0);
  assert.equal(girisDenemesiKaldiMi(), true);
});
