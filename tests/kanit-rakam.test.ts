import test from "node:test";
import assert from "node:assert/strict";
import { kanitRakamli } from "../src/lib/evidence.ts";

const kanit = (sources: unknown[]) => ({ evidence: { status: "pricing-page-verified", sources } }) as never;

test("supports icinde rakam varsa kanit rakamli sayilir", () => {
  assert.equal(kanitRakamli(kanit([{ supports: ["Pro $8.75/user/month"] }])), true);
});

test("sablon cumle rakamsiz sayilir", () => {
  assert.equal(kanitRakamli(kanit([{ supports: ["the vendor's published pricing"] }])), false);
});

test("kaynak yoksa rakamsiz", () => {
  assert.equal(kanitRakamli(kanit([])), false);
  assert.equal(kanitRakamli({} as never), false);
});

test("kaynaklardan BIRI rakamliysa yeter", () => {
  assert.equal(
    kanitRakamli(kanit([{ supports: ["the vendor's published pricing"] }, { supports: ["Free tier: 500 MB"] }])),
    true,
  );
});
