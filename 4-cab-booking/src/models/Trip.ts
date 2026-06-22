import { Coordinates } from "./Location";
import { Driver } from "./Driver";
import { Rider } from "./Rider";
import { RiderLocationTracker } from "../observers/RiderLocationTracker";
import { PricingStrategy } from "../pricing/PricingStrategy";
import { TripState } from "../states/TripState";

/**
 * Trip — CONTEXTO del patrón State.
 *
 * El viaje atraviesa una máquina de estados finita y auditable
 * (REQUESTED → DRIVER_ASSIGNED → IN_PROGRESS → COMPLETED | CANCELLED). Toda la
 * lógica de qué transición es legal vive en los estados; el Trip solo guarda los
 * datos y delega.
 */
export class Trip {
  driver: Driver | null = null;
  fareCents: number | null = null;
  tracker: RiderLocationTracker | null = null;

  constructor(
    public readonly id: string,
    public readonly rider: Rider,
    public readonly pickup: Coordinates,
    public readonly dropoff: Coordinates,
    private state: TripState,
  ) {}

  // --- API delegada al estado actual -----------------------------------------

  assignDriver(driver: Driver): void {
    this.state.assignDriver(this, driver);
  }

  start(): void {
    this.state.start(this);
  }

  complete(pricing: PricingStrategy): void {
    this.state.complete(this, pricing);
  }

  cancel(): void {
    this.state.cancel(this);
  }

  get status(): string {
    return this.state.name;
  }

  // --- Mutadores internos usados por los estados -----------------------------

  setState(state: TripState): void {
    this.state = state;
  }

  setDriver(driver: Driver | null): void {
    this.driver = driver;
  }

  setFare(cents: number): void {
    this.fareCents = cents;
  }
}
