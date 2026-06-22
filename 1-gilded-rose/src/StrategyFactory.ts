import { Item } from "./Item";
import { UpdateStrategy } from "./strategies/UpdateStrategy";
import { NormalItem } from "./strategies/NormalItem";
import { AgedBrie } from "./strategies/AgedBrie";
import { Sulfuras } from "./strategies/Sulfuras";
import { BackstagePass } from "./strategies/BackstagePass";
import { Conjured } from "./strategies/Conjured";

/** Nombres canónicos / prefijos de categoría usados por el kata. */
export const ItemNames = {
  AGED_BRIE: "Aged Brie",
  SULFURAS: "Sulfuras",
  BACKSTAGE: "Backstage passes",
  CONJURED: "Conjured",
} as const;

/**
 * Patrón FACTORY.
 *
 * Como la clase base `Item` no puede ser alterada y solo contiene datos
 * primitivos, necesitamos un mecanismo que instancie y asigne la estrategia
 * correcta basándose en el nombre del artículo (en tiempo de ejecución).
 *
 * Esta fábrica centraliza esa lógica de creación en un único punto, purgando
 * los condicionales del motor de actualización y reduciendo el acoplamiento.
 * Incorporar una nueva categoría = agregar una sola línea aquí.
 */
export class StrategyFactory {
  private static readonly normal = new NormalItem();
  private static readonly agedBrie = new AgedBrie();
  private static readonly sulfuras = new Sulfuras();
  private static readonly backstage = new BackstagePass();
  private static readonly conjured = new Conjured();

  static for(item: Item): UpdateStrategy {
    const name = item.name;

    if (name.startsWith(ItemNames.AGED_BRIE)) return this.agedBrie;
    if (name.startsWith(ItemNames.SULFURAS)) return this.sulfuras;
    if (name.startsWith(ItemNames.BACKSTAGE)) return this.backstage;
    if (name.startsWith(ItemNames.CONJURED)) return this.conjured;

    return this.normal;
  }
}
