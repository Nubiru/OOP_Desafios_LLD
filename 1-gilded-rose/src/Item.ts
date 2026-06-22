/**
 * Clase de datos base ORIGINAL del kata Gilded Rose.
 *
 * RESTRICCIÓN ARQUITECTÓNICA: esta clase NO puede ser modificada.
 * Solo contiene propiedades de datos primitivas (sin lógica de negocio).
 * Todo el rediseño debe ocurrir en la clase gestora (GildedRose) y en las
 * estrategias, sin corromper la integridad de esta entidad fundamental.
 */
export class Item {
  name: string;
  sellIn: number;
  quality: number;

  constructor(name: string, sellIn: number, quality: number) {
    this.name = name;
    this.sellIn = sellIn;
    this.quality = quality;
  }
}
