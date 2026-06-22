import { ParkingSpot } from "../models/ParkingSpot";
import { Size } from "../models/Size";

/**
 * Patrón ABSTRACT FACTORY — fábrica de una FAMILIA de plazas relacionadas.
 *
 * Aísla los algoritmos de construcción del garaje: el cliente (GarageBuilder)
 * depende de esta abstracción y puede ensamblar topologías de distinto estilo
 * (estándar, premium con cargadores EV…) sin conocer las clases concretas.
 */
export interface ParkingSpotFactory {
  readonly style: string;
  createCompact(id: string, floor: number): ParkingSpot; // SMALL
  createStandard(id: string, floor: number): ParkingSpot; // MEDIUM
  createOversize(id: string, floor: number): ParkingSpot; // LARGE
}

/** Garaje estándar: plazas sin equipamiento extra. */
export class StandardGarageFactory implements ParkingSpotFactory {
  readonly style = "estandar";

  createCompact(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.SMALL, floor);
  }
  createStandard(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.MEDIUM, floor);
  }
  createOversize(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.LARGE, floor);
  }
}

/** Garaje premium: las plazas medianas y grandes incluyen cargador EV. */
export class PremiumGarageFactory implements ParkingSpotFactory {
  readonly style = "premium";

  createCompact(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.SMALL, floor, ["luz-led"]);
  }
  createStandard(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.MEDIUM, floor, ["luz-led", "cargador-ev"]);
  }
  createOversize(id: string, floor: number): ParkingSpot {
    return new ParkingSpot(id, Size.LARGE, floor, ["luz-led", "cargador-ev"]);
  }
}
