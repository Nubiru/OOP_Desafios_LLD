import { BaseTripState } from "./TripState";
import type { Trip } from "../models/Trip";
import { Driver, DriverStatus } from "../models/Driver";
import { distance, etaMinutes } from "../models/Location";
import type { PricingStrategy } from "../pricing/PricingStrategy";

/**
 * Estado REQUESTED: solicitud creada, aún sin conductor. Puede emparejarse o
 * cancelarse sin costo.
 */
export class RequestedState extends BaseTripState {
  readonly name = "REQUESTED";

  override assignDriver(trip: Trip, driver: Driver): void {
    trip.setDriver(driver);
    driver.status = DriverStatus.ASSIGNED;
    trip.setState(new DriverAssignedState());
  }

  override cancel(trip: Trip): void {
    trip.setState(new CancelledState());
  }
}

/**
 * Estado DRIVER_ASSIGNED: conductor en camino a la recogida. Puede iniciarse el
 * viaje o cancelarse (liberando al conductor).
 */
export class DriverAssignedState extends BaseTripState {
  readonly name = "DRIVER_ASSIGNED";

  override start(trip: Trip): void {
    trip.setState(new InProgressState());
  }

  override cancel(trip: Trip): void {
    if (trip.driver) trip.driver.status = DriverStatus.AVAILABLE;
    trip.setState(new CancelledState());
  }
}

/**
 * Estado IN_PROGRESS: viaje en curso. Solo puede completarse; ya no se cancela
 * (el servicio está consumiéndose).
 */
export class InProgressState extends BaseTripState {
  readonly name = "IN_PROGRESS";

  override complete(trip: Trip, pricing: PricingStrategy): void {
    const distanceKm = distance(trip.pickup, trip.dropoff);
    const durationMin = etaMinutes(trip.pickup, trip.dropoff);
    trip.setFare(pricing.computeFare(distanceKm, durationMin));
    if (trip.driver) trip.driver.status = DriverStatus.AVAILABLE;
    trip.setState(new CompletedState());
  }
}

/** Estado final COMPLETED: viaje liquidado. No admite más transiciones. */
export class CompletedState extends BaseTripState {
  readonly name = "COMPLETED";
}

/** Estado final CANCELLED: viaje cancelado. No admite más transiciones. */
export class CancelledState extends BaseTripState {
  readonly name = "CANCELLED";
}
