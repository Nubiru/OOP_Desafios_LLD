import { test } from "node:test";
import assert from "node:assert/strict";

import { Item } from "../src/Item";
import { GildedRose } from "../src/GildedRose";

/** Avanza un único artículo `days` jornadas y lo devuelve. */
function age(name: string, sellIn: number, quality: number, days = 1): Item {
  const gr = new GildedRose([new Item(name, sellIn, quality)]);
  for (let d = 0; d < days; d++) gr.updateQuality();
  return gr.items[0];
}

test("Normal: degrada 1 por día antes de expirar", () => {
  const it = age("Foo", 10, 20);
  assert.equal(it.sellIn, 9);
  assert.equal(it.quality, 19);
});

test("Normal: degrada el doble (2) una vez expirado", () => {
  const it = age("Foo", 0, 20); // tras actualizar, sellIn = -1 (expirado)
  assert.equal(it.sellIn, -1);
  assert.equal(it.quality, 18);
});

test("Normal: la calidad nunca es negativa", () => {
  const it = age("Foo", 5, 0);
  assert.equal(it.quality, 0);
});

test("Aged Brie: incrementa su calidad al envejecer", () => {
  const it = age("Aged Brie", 2, 0);
  assert.equal(it.quality, 1);
});

test("Aged Brie: nunca supera 50", () => {
  const it = age("Aged Brie", 2, 50);
  assert.equal(it.quality, 50);
});

test("Aged Brie: tras expirar incrementa el doble (2)", () => {
  const it = age("Aged Brie", 0, 10);
  assert.equal(it.quality, 12);
});

test("Sulfuras: nunca cambia su sellIn ni su calidad (80)", () => {
  const it = age("Sulfuras, Hand of Ragnaros", 0, 80, 5);
  assert.equal(it.sellIn, 0);
  assert.equal(it.quality, 80);
});

test("Backstage: +2 cuando faltan 10 días o menos", () => {
  const it = age("Backstage passes to a TAFKAL80ETC concert", 10, 20);
  assert.equal(it.quality, 22);
});

test("Backstage: +3 cuando faltan 5 días o menos", () => {
  const it = age("Backstage passes to a TAFKAL80ETC concert", 5, 20);
  assert.equal(it.quality, 23);
});

test("Backstage: la calidad cae a 0 tras el concierto", () => {
  const it = age("Backstage passes to a TAFKAL80ETC concert", 0, 40);
  assert.equal(it.quality, 0);
});

test("Conjured: degrada el doble (2) antes de expirar", () => {
  const it = age("Conjured Mana Cake", 3, 6);
  assert.equal(it.sellIn, 2);
  assert.equal(it.quality, 4);
});

test("Conjured: degrada 4 una vez expirado", () => {
  const it = age("Conjured Mana Cake", 0, 10);
  assert.equal(it.sellIn, -1);
  assert.equal(it.quality, 6);
});

test("Conjured: la calidad nunca es negativa", () => {
  const it = age("Conjured Mana Cake", 0, 1);
  assert.equal(it.quality, 0);
});
