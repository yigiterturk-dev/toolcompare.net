import test from "node:test";
import assert from "node:assert/strict";
import { ayrimCumlesi, kriterAyrimi, type AyrimGirdisi } from "../src/lib/kriter-ayrimi.ts";

const arac = (name: string, kriterler: AyrimGirdisi["kriterler"]): AyrimGirdisi => ({ name, kriterler });

test("yalnizca bir tarafta olan ozellik ayrima girer", () => {
  const a = arac("Alpha", { api: true, sso: true, mobil: false });
  const b = arac("Beta", { api: true, sso: false, mobil: false });
  const { sadeceA, sadeceB, ortak } = kriterAyrimi(a, b);
  assert.deepEqual(sadeceA, ["sso"]);
  assert.deepEqual(sadeceB, []);
  assert.deepEqual(ortak, ["api"]);
  assert.equal(ayrimCumlesi(a, b), "only Alpha has sso (saml); both offer public api.");
});

test("bakilmamis kriter (null/eksik) ayrim sayilmaz", () => {
  const a = arac("Alpha", { api: true });
  const b = arac("Beta", {});
  assert.deepEqual(kriterAyrimi(a, b), { sadeceA: [], sadeceB: [], ortak: [] });
  assert.equal(ayrimCumlesi(a, b), "");
});

test("her sey esitse dolgu cumle degil, esleme cumlesi yazilir", () => {
  const a = arac("Alpha", { api: true, mobil: true });
  const b = arac("Beta", { api: true, mobil: true });
  assert.equal(ayrimCumlesi(a, b), "on what we checked they match — both offer public api and mobile app.");
});

test("iki taraf da kendine ozgu ozellik tasiyabilir", () => {
  const a = arac("Alpha", { api: true, acikKaynak: false });
  const b = arac("Beta", { api: false, acikKaynak: true });
  assert.equal(
    ayrimCumlesi(a, b),
    "only Alpha has public api and only Beta has open source / self-hostable.",
  );
});
