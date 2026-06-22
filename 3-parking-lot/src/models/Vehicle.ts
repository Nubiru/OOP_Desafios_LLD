import { Size } from "./Size";

/**
 * Clase abstracta fundamental: encapsula los atributos persistentes (patente y
 * tamaño volumétrico). Base para la herencia de vehículos especializados.
 */
export abstract class Vehicle {
  protected constructor(
    public readonly plate: string,
    public readonly size: Size,
  ) {}

  abstract get type(): string;
}

export class Motorcycle extends Vehicle {
  constructor(plate: string) {
    super(plate, Size.SMALL);
  }
  get type(): string {
    return "Motocicleta";
  }
}

export class Car extends Vehicle {
  constructor(plate: string) {
    super(plate, Size.MEDIUM);
  }
  get type(): string {
    return "Automovil";
  }
}

export class Truck extends Vehicle {
  constructor(plate: string) {
    super(plate, Size.LARGE);
  }
  get type(): string {
    return "Camion";
  }
}
