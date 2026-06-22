import { Item } from "../Item";
import { BaseStrategy } from "./UpdateStrategy";

/**
 * Sulfuras (Objeto Legendario).
 * - Su valor de venta nunca disminuye (sellIn inalterable).
 * - Su calidad se mantiene constante en 80 y no se degrada bajo ninguna
 *   circunstancia.
 *
 * Por contrato, esta estrategia es una operación nula (no-op): no toca el
 * estado del artículo.
 */
export class Sulfuras extends BaseStrategy {
  update(_item: Item): void {
    // Intencionalmente vacío: el objeto legendario es inmutable.
  }
}
