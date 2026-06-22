import { PricingStrategy, billableHours } from "./PricingStrategy";

/** Tarifa por hora, redondeando fracciones hacia arriba (mínimo 1 hora). */
export class HourlyPricing implements PricingStrategy {
  readonly name = "por hora";

  constructor(private readonly perHourCents: number) {}

  computeFee(entryMs: number, exitMs: number): number {
    return billableHours(entryMs, exitMs) * this.perHourCents;
  }
}
