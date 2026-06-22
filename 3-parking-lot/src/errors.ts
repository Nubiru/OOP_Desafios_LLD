/** Error de dominio del sistema de estacionamiento. */
export class ParkingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParkingError";
  }
}
