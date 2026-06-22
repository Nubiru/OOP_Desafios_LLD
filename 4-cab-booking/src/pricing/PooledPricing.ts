import { PricingStrategy } from "./PricingStrategy";

/**
 * Viaje compartido (pool): aplica un descuento sobre una estrategia base para
 * reflejar el costo repartido entre pasajeros.
 */
export class PooledPricing implements PricingStrategy {
  readonly name: string;

  constructor(
    private readonly base: PricingStrategy,
    /** Factor de descuento en [0..1] (0.7 = 30% off). */
    private readonly discount: number,
  ) {
    this.name = `pool -${Math.round((1 - discount) * 100)}%`;
  }

  computeFare(distanceKm: number, durationMin: number): number {
    return Math.round(this.base.computeFare(distanceKm, durationMin) * this.discount);
  }
}
