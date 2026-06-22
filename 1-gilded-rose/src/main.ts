import { Item } from "./Item";
import { GildedRose } from "./GildedRose";

/**
 * Prueba de concepto: simula varios días de operación de la posada e imprime el
 * estado del inventario al final de cada jornada. Incluye un artículo "Conjured"
 * para demostrar el nuevo requisito.
 */
function buildInventory(): Item[] {
  return [
    new Item("Pocion de mana +5", 10, 20), // Normal
    new Item("Aged Brie", 2, 0), // Aged Brie
    new Item("Espada oxidada", 5, 7), // Normal
    new Item("Sulfuras, Hand of Ragnaros", 0, 80), // Legendario
    new Item("Backstage passes to a TAFKAL80ETC concert", 15, 20),
    new Item("Backstage passes to a TAFKAL80ETC concert", 10, 49),
    new Item("Backstage passes to a TAFKAL80ETC concert", 5, 49),
    new Item("Conjured Mana Cake", 3, 6), // Nuevo requisito
  ];
}

function printDay(day: number, items: Item[]): void {
  console.log(`\n===== Dia ${day} =====`);
  console.log("name".padEnd(45), "sellIn".padStart(7), "quality".padStart(8));
  for (const item of items) {
    console.log(
      item.name.padEnd(45),
      String(item.sellIn).padStart(7),
      String(item.quality).padStart(8),
    );
  }
}

function run(days: number): void {
  const gildedRose = new GildedRose(buildInventory());
  printDay(0, gildedRose.items);
  for (let day = 1; day <= days; day++) {
    gildedRose.updateQuality();
    printDay(day, gildedRose.items);
  }
}

run(12);
