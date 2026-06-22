import { PricingStrategy } from "./PricingStrategy";

/** Tarifa estándar: base + costo por km + costo por minuto. */
export class StandardPricing implements PricingStrategy {
  readonly name = "estandar";

  constructor(
    private readonly baseCents: number,
    private readonly perKmCents: number,
    private readonly perMinCents: number,
  ) {}

  computeFare(distanceKm: number, durationMin: number): number {
    return Math.round(
      this.baseCents + this.perKmCents * distanceKm + this.perMinCents * durationMin,
    );
  }
}
