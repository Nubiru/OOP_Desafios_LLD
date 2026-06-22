import { test } from "node:test";
import assert from "node:assert/strict";

import { Item } from "../src/Item";
import { GildedRose } from "../src/GildedRose";
import { GildedRoseLegacy } from "../src/legacy/GildedRoseLegacy";

/**
 * GOLDEN MASTER TESTING
 *
 * El código legado no tenía suite de pruebas. La estrategia recomendada antes de
 * refactorizar es registrar el comportamiento exacto del programa actual para un
 * volumen masivo de entradas, y usar ese registro como "copia maestra dorada".
 *
 * Aquí generamos una batería exhaustiva de artículos y los avanzamos día a día
 * con AMBAS implementaciones (legada y refactorizada), verificando que producen
 * EXACTAMENTE el mismo estado. Si coinciden, la refactorización Strategy+Factory
 * preservó el comportamiento base.
 */

const GOLDEN_NAMES = [
  "Pocion de mana +5", // Normal
  "Aged Brie",
  "Sulfuras, Hand of Ragnaros",
  "Backstage passes to a TAFKAL80ETC concert",
];

function buildBattery(): Item[] {
  const items: Item[] = [];
  for (const name of GOLDEN_NAMES) {
    // Barremos un amplio rango de sellIn y quality, incluyendo bordes.
    for (let sellIn = -3; sellIn <= 15; sellIn++) {
      for (const quality of [0, 1, 2, 10, 48, 49, 50, 80]) {
        items.push(new Item(name, sellIn, quality));
      }
    }
  }
  return items;
}

test("golden master: la versión refactorizada iguala al código legado (50 días)", () => {
  const refactored = new GildedRose(buildBattery());
  const legacy = new GildedRoseLegacy(buildBattery());

  for (let day = 0; day < 50; day++) {
    refactored.updateQuality();
    legacy.updateQuality();

    for (let i = 0; i < legacy.items.length; i++) {
      const a = refactored.items[i];
      const b = legacy.items[i];
      assert.deepEqual(
        { name: a.name, sellIn: a.sellIn, quality: a.quality },
        { name: b.name, sellIn: b.sellIn, quality: b.quality },
        `Divergencia el día ${day + 1} para "${b.name}" (índice ${i})`,
      );
    }
  }
});
