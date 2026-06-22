import { PricingStrategy } from "./PricingStrategy";

/**
 * Precio dinámico (surge): aplica un multiplicador de demanda sobre una
 * estrategia base. Componer estrategias mantiene el cálculo base reutilizable y
 * demuestra extensibilidad sin duplicar la fórmula.
 */
export class SurgePricing implements PricingStrategy {
  readonly name: string;

  constructor(
    private readonly base: PricingStrategy,
    private readonly multiplier: number,
  ) {
    this.name = `surge x${multiplier}`;
  }

  computeFare(distanceKm: number, durationMin: number): number {
    return Math.round(this.base.computeFare(distanceKm, durationMin) * this.multiplier);
  }
}
