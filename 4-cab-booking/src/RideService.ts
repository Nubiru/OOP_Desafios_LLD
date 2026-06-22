import { Coordinates } from "./models/Location";
import { Driver } from "./models/Driver";
import { Rider } from "./models/Rider";
import { Trip } from "./models/Trip";
import { DriverMatcher } from "./matching/DriverMatcher";
import { RiderLocationTracker } from "./observers/RiderLocationTracker";
import { PricingStrategy } from "./pricing/PricingStrategy";
import { RequestedState } from "./states/TripStates";
import { TripError } from "./errors";

/**
 * RideService — orquestador que integra los tres patrones:
 *  - STATE: gestiona el ciclo de vida del Trip.
 *  - STRATEGY: aplica el motor de tarifas vigente al completar.
 *  - OBSERVER: conecta/desconecta el seguimiento en vivo conductor→pasajero.
 */
export class RideService {
  private readonly trips = new Map<string, Trip>();
  private sequence = 0;

  constructor(
    private readonly matcher: DriverMatcher,
    private pricing: PricingStrategy,
  ) {}

  registerDriver(driver: Driver): void {
    this.matcher.register(driver);
  }

  /**
   * Solicita un viaje: empareja el conductor más cercano, crea el Trip, lo lleva
   * a DRIVER_ASSIGNED y suscribe al pasajero a la telemetría del conductor.
   */
  requestRide(rider: Rider, pickup: Coordinates, dropoff: Coordinates): Trip {
    const driver = this.matcher.findNearest(pickup);
    if (!driver) {
      throw new TripError("No hay conductores disponibles cerca de la recogida.");
    }

    const trip = new Trip(`R${++this.sequence}`, rider, pickup, dropoff, new RequestedState());
    trip.assignDriver(driver); // REQUESTED -> DRIVER_ASSIGNED

    const tracker = new RiderLocationTracker(rider, pickup);
    driver.subscribe(tracker); // Observer: el pasajero sigue al conductor
    trip.tracker = tracker;

    this.trips.set(trip.id, trip);
    return trip;
  }

  /** Telemetría: nueva posición del conductor (notifica observadores + reindexa). */
  updateDriverLocation(driver: Driver, location: Coordinates): void {
    driver.updateLocation(location); // Observer notify
    this.matcher.reindex(driver);
  }

  startTrip(tripId: string): void {
    const trip = this.require(tripId);
    trip.start(); // DRIVER_ASSIGNED -> IN_PROGRESS
    // Durante el viaje, el pasajero ya no sigue la llegada sino el destino.
    trip.tracker?.retarget(trip.dropoff);
  }

  completeTrip(tripId: string): number {
    const trip = this.require(tripId);
    trip.complete(this.pricing); // IN_PROGRESS -> COMPLETED (calcula tarifa)
    this.detachTracker(trip);
    return trip.fareCents ?? 0;
  }

  cancelTrip(tripId: string): void {
    const trip = this.require(tripId);
    trip.cancel();
    this.detachTracker(trip);
  }

  setPricing(pricing: PricingStrategy): void {
    this.pricing = pricing;
  }

  getTrip(tripId: string): Trip {
    return this.require(tripId);
  }

  private detachTracker(trip: Trip): void {
    if (trip.driver && trip.tracker) {
      trip.driver.unsubscribe(trip.tracker); // cierra el canal de telemetría
    }
  }

  private require(tripId: string): Trip {
    const trip = this.trips.get(tripId);
    if (!trip) throw new TripError(`Viaje inexistente: ${tripId}.`);
    return trip;
  }
}
