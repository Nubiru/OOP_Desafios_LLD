import { ParkingSpot } from "../models/ParkingSpot";
import { ParkingSpotFactory } from "./ParkingSpotFactory";

/** Configuración de despliegue del garaje (ingerible desde un archivo). */
export interface GarageConfig {
  floors: number;
  compactPerFloor: number;
  standardPerFloor: number;
  oversizePerFloor: number;
}

/**
 * Ensambla la topología espacial completa del garaje a partir de una
 * configuración, delegando la creación de cada plaza a una Abstract Factory.
 *
 * Cambiar el estilo del garaje (estándar ↔ premium) es cuestión de inyectar otra
 * fábrica: el algoritmo de construcción no cambia.
 */
export class GarageBuilder {
  constructor(private readonly factory: ParkingSpotFactory) {}

  build(config: GarageConfig): ParkingSpot[] {
    const spots: ParkingSpot[] = [];
    for (let floor = 1; floor <= config.floors; floor++) {
      for (let i = 1; i <= config.compactPerFloor; i++) {
        spots.push(this.factory.createCompact(`F${floor}-C${i}`, floor));
      }
      for (let i = 1; i <= config.standardPerFloor; i++) {
        spots.push(this.factory.createStandard(`F${floor}-S${i}`, floor));
      }
      for (let i = 1; i <= config.oversizePerFloor; i++) {
        spots.push(this.factory.createOversize(`F${floor}-L${i}`, floor));
      }
    }
    return spots;
  }
}
