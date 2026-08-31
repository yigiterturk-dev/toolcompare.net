import test from "node:test";
import assert from "node:assert/strict";
import { cspOlustur } from "../src/lib/guvenlik.ts";

test("varsayilan politika disariya kapali", () => {
  const c = cspOlustur();
  assert.match(c, /default-src 'self'/);
  assert.match(c, /object-src 'none'/);
  assert.match(c, /frame-src 'none'/);
  assert.match(c, /base-uri 'self'/);
  assert.match(c, /form-action 'self'/);
  assert.doesNotMatch(c, /'unsafe-eval'/);
});

test("frame-ancestors baslikta var, meta'da yok", () => {
  assert.match(cspOlustur(), /frame-ancestors 'self'/);
  // meta'da yok sayilir; yazmak sadece konsol uyarisi uretir.
  assert.doesNotMatch(cspOlustur({ meta: true }), /frame-ancestors/);
});

test("adsense kapaliyken reklam alanlari acilmaz", () => {
  const c = cspOlustur();
  assert.doesNotMatch(c, /googlesyndication/);
});

test("adsense acikken yalnizca gereken alanlar acilir", () => {
  const c = cspOlustur({ adsense: true });
  assert.match(c, /script-src[^;]*pagead2\.googlesyndication\.com/);
  assert.match(c, /frame-src[^;]*doubleclick/);
  assert.match(c, /default-src 'self'/); // genel kapi yine kapali
});

test("unsafe-eval yalnizca gelistirmede", () => {
  assert.match(cspOlustur({ gelistirme: true }), /'unsafe-eval'/);
});
