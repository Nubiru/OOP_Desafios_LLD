import { Coordinates } from "./Location";
import { LocationObserver } from "../observers/LocationObserver";

export enum DriverStatus {
  AVAILABLE = "AVAILABLE",
  ASSIGNED = "ASSIGNED",
  OFFLINE = "OFFLINE",
}

/**
 * Conductor. Actúa como SUJETO (Subject) del patrón Observer: mantiene la lista
 * de observadores suscritos a su telemetría y los notifica en cada cambio de
 * ubicación (simulando un canal WebSocket persistente).
 */
export class Driver {
  status: DriverStatus = DriverStatus.AVAILABLE;
  private readonly observers = new Set<LocationObserver>();

  constructor(
    public readonly id: string,
    public readonly name: string,
    public location: Coordinates,
    /** Tasa histórica de aceptación [0..1], usada como desempate en el matching. */
    public readonly acceptanceRate: number = 1,
  ) {}

  subscribe(observer: LocationObserver): void {
    this.observers.add(observer);
  }

  unsubscribe(observer: LocationObserver): void {
    this.observers.delete(observer);
  }

  get subscriberCount(): number {
    return this.observers.size;
  }

  /** Emite una nueva posición y notifica a todos los observadores. */
  updateLocation(location: Coordinates): void {
    this.location = location;
    for (const observer of this.observers) {
      observer.onLocationUpdate(this.id, location);
    }
  }
}
