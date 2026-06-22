import { Item } from "../Item";

/**
 * Patrón STRATEGY — contrato de actualización diaria.
 *
 * El problema fundamental del kata es que el algoritmo de degradación de la
 * calidad varía según la categoría semántica del artículo. El patrón Strategy
 * dicta "encapsular lo que varía": cada categoría implementa esta interfaz con
 * su propio algoritmo, satisfaciendo el Principio de Responsabilidad Única (S)
 * y dejando el motor (GildedRose) cerrado a la modificación pero abierto a la
 * extensión (O).
 */
export interface UpdateStrategy {
  /** Avanza el estado del artículo en una jornada (muta sellIn y quality). */
  update(item: Item): void;
}

/** Calidad mínima permitida para cualquier artículo no legendario. */
export const MIN_QUALITY = 0;
/** Calidad máxima permitida para cualquier artículo no legendario. */
export const MAX_QUALITY = 50;

/**
 * Clase base abstracta con utilidades de fijación de límites (clamping).
 *
 * En lugar de esparcir las comprobaciones "la calidad nunca es negativa / nunca
 * supera 50" por cada estrategia, se centralizan aquí. Tras ejecutar el
 * algoritmo específico, el valor resultante se trunca matemáticamente,
 * manteniendo el estado del objeto dentro de los límites operativos.
 */
export abstract class BaseStrategy implements UpdateStrategy {
  abstract update(item: Item): void;

  protected increaseQuality(item: Item, amount: number = 1): void {
    // Un incremento nunca debe REDUCIR un valor ya por encima del tope
    // (p. ej. un legendario a 80). Solo sube hasta el máximo permitido.
    if (item.quality >= MAX_QUALITY) return;
    item.quality = Math.min(MAX_QUALITY, item.quality + amount);
  }

  protected decreaseQuality(item: Item, amount: number = 1): void {
    if (item.quality <= MIN_QUALITY) return;
    item.quality = Math.max(MIN_QUALITY, item.quality - amount);
  }

  protected decreaseSellIn(item: Item): void {
    item.sellIn -= 1;
  }

  protected hasExpired(item: Item): boolean {
    return item.sellIn < 0;
  }
}
