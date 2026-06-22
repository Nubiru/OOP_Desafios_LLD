import { Size } from "./Size";
import { ParkingError } from "../errors";

/**
 * Plaza física de estacionamiento. Encapsula su identificador topológico, su
 * tamaño y un registro de ocupación. Provee métodos para reclamar/liberar la
 * tenencia del espacio de forma controlada.
 *
 * `assign` falla si la plaza ya está ocupada: esta verificación es el último
 * cerrojo (pesimista) contra una doble asignación por condiciones de carrera.
 */
export class ParkingSpot {
  private occupiedBy: string | null = null;

  constructor(
    public readonly id: string,
    public readonly size: Size,
    public readonly floor: number,
    /** Equipamiento extra (p. ej. cargador EV) según el tipo de garaje. */
    public readonly features: readonly string[] = [],
  ) {}

  get isFree(): boolean {
    return this.occupiedBy === null;
  }

  get plate(): string | null {
    return this.occupiedBy;
  }

  assign(plate: string): void {
    if (this.occupiedBy !== null) {
      throw new ParkingError(`La plaza ${this.id} ya está ocupada.`);
    }
    this.occupiedBy = plate;
  }

  release(): void {
    this.occupiedBy = null;
  }
}
