import type { Trip } from "../models/Trip";
import type { Driver } from "../models/Driver";
import type { PricingStrategy } from "../pricing/PricingStrategy";
import { TripError } from "../errors";

/**
 * Patrón STATE — contrato de comportamiento del viaje.
 *
 * Cada estado concreto codifica qué operaciones son legales y a qué estado
 * transiciona. Las operaciones no permitidas lanzan TripError, impidiendo
 * incoherencias como cancelar un viaje ya completado y liquidado.
 */
export interface TripState {
  readonly name: string;
  assignDriver(trip: Trip, driver: Driver): void;
  start(trip: Trip): void;
  complete(trip: Trip, pricing: PricingStrategy): void;
  cancel(trip: Trip): void;
}

/** Base que rechaza toda operación; los estados concretos habilitan las suyas. */
export abstract class BaseTripState implements TripState {
  abstract readonly name: string;

  assignDriver(_trip: Trip, _driver: Driver): void {
    throw this.illegal("asignar un conductor");
  }
  start(_trip: Trip): void {
    throw this.illegal("iniciar el viaje");
  }
  complete(_trip: Trip, _pricing: PricingStrategy): void {
    throw this.illegal("completar el viaje");
  }
  cancel(_trip: Trip): void {
    throw this.illegal("cancelar el viaje");
  }

  protected illegal(action: string): TripError {
    return new TripError(`No se puede ${action} en estado ${this.name}.`);
  }
}
