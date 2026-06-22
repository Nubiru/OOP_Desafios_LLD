import { Item } from "./Item";
import { StrategyFactory } from "./StrategyFactory";

/**
 * Clase gestora REFACTORIZADA.
 *
 * Reemplaza el método masivo, anidado y altamente condicional del código legado
 * (ver `legacy/GildedRoseLegacy.ts`) por una delegación limpia al patrón
 * Strategy vía Factory.
 *
 * El motor quedó CERRADO a la modificación pero ABIERTO a la extensión: agregar
 * una nueva categoría de artículo no requiere tocar este archivo.
 */
export class GildedRose {
  constructor(public items: Item[]) {}

  updateQuality(): Item[] {
    for (const item of this.items) {
      StrategyFactory.for(item).update(item);
    }
    return this.items;
  }
}
