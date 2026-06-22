import { Coordinates, etaMinutes } from "../models/Location";
import { Rider } from "../models/Rider";
import { LocationObserver } from "./LocationObserver";

/**
 * Observador concreto: el dispositivo del pasajero que sigue en vivo la posición
 * del conductor asignado y recalcula el ETA hacia un objetivo (el punto de
 * recogida primero, el destino durante el viaje).
 */
export class RiderLocationTracker implements LocationObserver {
  lastLocation: Coordinates | null = null;
  updateCount = 0;

  constructor(
    public readonly rider: Rider,
    private target: Coordinates,
  ) {}

  onLocationUpdate(_driverId: string, location: Coordinates): void {
    this.lastLocation = location;
    this.updateCount += 1;
  }

  /** Cambia el objetivo de seguimiento (p. ej. de la recogida al destino). */
  retarget(target: Coordinates): void {
    this.target = target;
  }

  /** ETA hacia el objetivo actual según la última posición conocida (minutos). */
  etaMinutes(): number | null {
    return this.lastLocation ? etaMinutes(this.lastLocation, this.target) : null;
  }
}
