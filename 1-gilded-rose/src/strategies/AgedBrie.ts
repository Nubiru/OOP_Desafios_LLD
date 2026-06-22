import { Item } from "../Item";
import { BaseStrategy } from "./UpdateStrategy";

/**
 * Aged Brie (Queso Añejo).
 * - Incrementa su calidad a medida que envejece (+1 por día).
 * - Tras expirar (sellIn < 0) mejora el doble de rápido (+2).
 * - La calidad nunca supera el máximo de 50.
 */
export class AgedBrie extends BaseStrategy {
  update(item: Item): void {
    this.decreaseSellIn(item);
    this.increaseQuality(item, this.hasExpired(item) ? 2 : 1);
  }
}
