import { Coordinates } from "../models/Location";

/**
 * Patrón OBSERVER — contrato del observador de telemetría.
 *
 * Los dispositivos de los pasajeros se suscriben al flujo de ubicación emitido
 * por el conductor (Sujeto). Ante cada variación de coordenadas, el conductor
 * notifica a todos los observadores, que actualizan su vista en tiempo real.
 */
export interface LocationObserver {
  onLocationUpdate(driverId: string, location: Coordinates): void;
}
