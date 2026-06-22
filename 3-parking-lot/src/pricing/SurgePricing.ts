import { PricingStrategy, billableHours } from "./PricingStrategy";

/**
 * Precio dinámico (surge): tarifa por hora multiplicada por un factor de demanda
 * en tiempo real. Demuestra la extensibilidad del motor de precios: una nueva
 * política se agrega como una clase más, sin tocar la fachada ni el gestor.
 */
export class SurgePricing implements PricingStrategy {
  readonly name = "dinamica (surge)";

  constructor(
    private readonly perHourCents: number,
    private readonly multiplier: number,
  ) {}

  computeFee(entryMs: number, exitMs: number): number {
    return Math.round(billableHours(entryMs, exitMs) * this.perHourCents * this.multiplier);
  }
}
