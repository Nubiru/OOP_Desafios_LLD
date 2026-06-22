import { Item } from "../Item";
import { BaseStrategy } from "./UpdateStrategy";

/**
 * Artículo Normal.
 * - La calidad se degrada 1 unidad por día.
 * - Una vez expirada la fecha de venta (sellIn < 0), se degrada el doble (2).
 * - La calidad nunca puede ser negativa.
 */
export class NormalItem extends BaseStrategy {
  update(item: Item): void {
    this.decreaseSellIn(item);
    this.decreaseQuality(item, this.hasExpired(item) ? 2 : 1);
  }
}
