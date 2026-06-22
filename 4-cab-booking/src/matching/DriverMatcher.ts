import { Coordinates, distance } from "../models/Location";
import { Driver, DriverStatus } from "../models/Driver";
import { GridIndex } from "./GridIndex";

/**
 * Emparejamiento bajo demanda (matchmaking).
 *
 * Usa el índice geoespacial para hallar conductores cercanos, expandiendo el
 * radio de búsqueda por anillos hasta encontrar disponibles. Entre los
 * candidatos, prioriza la PROXIMIDAD y, como desempate, la tasa de aceptación.
 */
export class DriverMatcher {
  constructor(
    private readonly grid: GridIndex,
    private readonly maxRing: number = 5,
  ) {}

  register(driver: Driver): void {
    this.grid.add(driver);
  }

  /** Reindexa al conductor tras un cambio de posición. */
  reindex(driver: Driver): void {
    this.grid.update(driver);
  }

  /** Mejor conductor disponible para un punto de recogida, o null si no hay. */
  findNearest(pickup: Coordinates): Driver | null {
    for (let ring = 1; ring <= this.maxRing; ring++) {
      const candidates = this.grid
        .nearby(pickup, ring)
        .filter((d) => d.status === DriverStatus.AVAILABLE);

      if (candidates.length > 0) {
        return candidates.sort(
          (a, b) =>
            distance(a.location, pickup) - distance(b.location, pickup) ||
            b.acceptanceRate - a.acceptanceRate,
        )[0];
      }
    }
    return null;
  }
}
