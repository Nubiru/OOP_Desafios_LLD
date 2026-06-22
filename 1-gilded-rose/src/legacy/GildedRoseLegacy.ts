import { Item } from "../Item";

/**
 * CÓDIGO LEGADO original del kata (Terry Hughes), portado a TypeScript.
 *
 * Es un antipatrón paradigmático: un método masivo, profundamente anidado y
 * altamente condicional que viola flagrantemente SRP y OCP. Cada nuevo tipo de
 * artículo obliga a modificar el núcleo del método.
 *
 * NO se usa en producción. Se conserva exclusivamente como REFERENCIA para la
 * técnica "Golden Master Testing": el comportamiento de esta versión es la
 * "copia maestra dorada" contra la cual verificamos que la refactorización
 * agresiva (Strategy + Factory) no alteró el comportamiento base.
 *
 * (No incluye "Conjured": ese es el nuevo requisito que la versión refactorizada
 *  añade sin tocar el motor; por eso Conjured se valida con tests dedicados.)
 */
export class GildedRoseLegacy {
  constructor(public items: Item[]) {}

  updateQuality(): Item[] {
    for (let i = 0; i < this.items.length; i++) {
      if (
        this.items[i].name != "Aged Brie" &&
        this.items[i].name != "Backstage passes to a TAFKAL80ETC concert"
      ) {
        if (this.items[i].quality > 0) {
          if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
            this.items[i].quality = this.items[i].quality - 1;
          }
        }
      } else {
        if (this.items[i].quality < 50) {
          this.items[i].quality = this.items[i].quality + 1;
          if (this.items[i].name == "Backstage passes to a TAFKAL80ETC concert") {
            if (this.items[i].sellIn < 11) {
              if (this.items[i].quality < 50) {
                this.items[i].quality = this.items[i].quality + 1;
              }
            }
            if (this.items[i].sellIn < 6) {
              if (this.items[i].quality < 50) {
                this.items[i].quality = this.items[i].quality + 1;
              }
            }
          }
        }
      }
      if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
        this.items[i].sellIn = this.items[i].sellIn - 1;
      }
      if (this.items[i].sellIn < 0) {
        if (this.items[i].name != "Aged Brie") {
          if (this.items[i].name != "Backstage passes to a TAFKAL80ETC concert") {
            if (this.items[i].quality > 0) {
              if (this.items[i].name != "Sulfuras, Hand of Ragnaros") {
                this.items[i].quality = this.items[i].quality - 1;
              }
            }
          } else {
            this.items[i].quality = this.items[i].quality - this.items[i].quality;
          }
        } else {
          if (this.items[i].quality < 50) {
            this.items[i].quality = this.items[i].quality + 1;
          }
        }
      }
    }
    return this.items;
  }
}
