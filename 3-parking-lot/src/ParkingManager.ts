import { ParkingSpot } from "./models/ParkingSpot";
import { Vehicle } from "./models/Vehicle";
import { Size, ALL_SIZES, sizeName } from "./models/Size";
import { ParkingError } from "./errors";

/**
 * Núcleo algorítmico del sistema. Mantiene estructuras optimizadas para localizar
 * plazas libres en tiempo CONSTANTE O(1) en lugar de iterar linealmente miles de
 * plazas.
 *
 * Estrategia: un "pool" de plazas vacantes por tamaño (`freeBySize`). Buscar la
 * mejor plaza (Best Fit) es revisar a lo sumo 3 buckets, y reclamarla/​liberarla
 * es un push/pop O(1) — nunca se recorren las plazas ocupadas.
 *
 * Concurrencia: `assign` adopta un bloqueo pesimista para que "buscar + reclamar"
 * sea una operación atómica. Si dos puertas autorizan accesos simultáneos, el
 * recurso se adquiere de forma inquebrantable sin colisiones (doble asignación).
 */
export class ParkingManager {
  private readonly freeBySize = new Map<Size, ParkingSpot[]>();
  private readonly spotsById = new Map<string, ParkingSpot>();
  private locked = false;

  constructor(spots: ParkingSpot[]) {
    for (const size of ALL_SIZES) this.freeBySize.set(size, []);
    for (const spot of spots) {
      this.spotsById.set(spot.id, spot);
      this.freeBySize.get(spot.size)!.push(spot);
    }
  }

  /**
   * Asigna la plaza óptima (Best Fit: la más pequeña compatible) al vehículo.
   * Lanza ParkingError si no hay ninguna plaza compatible disponible.
   */
  assign(vehicle: Vehicle): ParkingSpot {
    if (this.locked) {
      throw new ParkingError("Asignador ocupado (bloqueo pesimista).");
    }
    this.locked = true;
    try {
      for (let size = vehicle.size; size <= Size.LARGE; size++) {
        const bucket = this.freeBySize.get(size as Size)!;
        const spot = bucket.pop(); // O(1)
        if (spot) {
          spot.assign(vehicle.plate); // último cerrojo anti doble-asignación
          return spot;
        }
      }
      throw new ParkingError(
        `Sin plazas compatibles para ${vehicle.type} (${vehicle.plate}).`,
      );
    } finally {
      this.locked = false;
    }
  }

  /** Libera una plaza y la reincorpora al pool de vacantes para su reutilización. */
  release(spotId: string): void {
    const spot = this.spotsById.get(spotId);
    if (!spot) throw new ParkingError(`Plaza inexistente: ${spotId}.`);
    if (spot.isFree) return;
    spot.release();
    this.freeBySize.get(spot.size)!.push(spot);
  }

  freeCount(size?: Size): number {
    if (size === undefined) {
      return ALL_SIZES.reduce((acc, s) => acc + this.freeBySize.get(s)!.length, 0);
    }
    return this.freeBySize.get(size)!.length;
  }

  totalCount(): number {
    return this.spotsById.size;
  }

  /** Resumen de disponibilidad por tamaño (para la vista). */
  availability(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const size of ALL_SIZES) out[sizeName(size)] = this.freeBySize.get(size)!.length;
    return out;
  }
}
