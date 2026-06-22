import { PricingStrategy } from "./PricingStrategy";

/** Tarifa plana universal: un único importe sin importar la duración. */
export class FlatRatePricing implements PricingStrategy {
  readonly name = "tarifa plana";

  constructor(private readonly flatCents: number) {}

  computeFee(_entryMs: number, _exitMs: number): number {
    return this.flatCents;
  }
}
