import { Item } from "../Item";
import { BaseStrategy } from "./UpdateStrategy";

/**
 * Backstage passes (Pases VIP).
 * - Incrementan su calidad a medida que se acerca la fecha del evento:
 *     +1 por defecto,
 *     +2 cuando faltan 10 días o menos,
 *     +3 cuando faltan 5 días o menos.
 * - Inmediatamente después del concierto (sellIn < 0) la calidad cae a 0.
 * - La calidad nunca supera 50.
 *
 * Nota: los umbrales se evalúan con el sellIn ANTES de decrementar, replicando
 * el comportamiento canónico del kata (sellIn < 11 y sellIn < 6).
 */
export class BackstagePass extends BaseStrategy {
  update(item: Item): void {
    let increment = 1;
    if (item.sellIn < 6) {
      increment = 3;
    } else if (item.sellIn < 11) {
      increment = 2;
    }
    this.increaseQuality(item, increment);

    this.decreaseSellIn(item);

    if (this.hasExpired(item)) {
      item.quality = 0;
    }
  }
}
