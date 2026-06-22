/** Error de dominio de la plataforma de viajes. */
export class TripError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripError";
  }
}
