import { Item } from "../Item";
import { BaseStrategy } from "./UpdateStrategy";

/**
 * Conjured (NUEVO REQUISITO).
 * - Degrada su calidad el doble de rápido que un artículo normal:
 *     -2 por día antes de expirar,
 *     -4 por día una vez expirada la fecha de venta.
 * - La calidad nunca puede ser negativa.
 *
 * Demostración del Principio Abierto/Cerrado: agregar este comportamiento solo
 * requirió crear esta clase y una regla en la fábrica. El motor de actualización
 * (GildedRose) y la clase de datos base (Item) permanecen intactos.
 */
export class Conjured extends BaseStrategy {
  update(item: Item): void {
    this.decreaseSellIn(item);
    this.decreaseQuality(item, this.hasExpired(item) ? 4 : 2);
  }
}
